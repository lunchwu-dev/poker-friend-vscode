import { Injectable } from '@nestjs/common';
import {
  Card, GameStage, ActionType, PlayerAction, AvailableActions, Pot, HandResult,
} from '@poker-friends/shared';
import { DeckService } from './deck.service';
import { EvaluatorService } from './evaluator.service';
import { PotService } from './pot.service';
import {
  EngineGameState, EnginePlayerState, PlayerStatus, PotDistribution,
} from './types/engine.types';

// ── Result types returned by the engine ──────────────────────────────────────

export interface InitGameParams {
  roomCode: string;
  smallBlind: number;
  bigBlind: number;
  actionTimeout: number; // seconds
  seats: Array<{ playerId: string; seatIndex: number; chips: number }>;
}

export interface StartHandResult {
  handNumber: number;
  dealerSeatIndex: number;
  /** Per-player private hole cards — caller is responsible for sending only to each player */
  playerHoleCards: Map<string, [Card, Card]>;
  firstPlayerId: string;
}

export interface ActionResult {
  valid: boolean;
  error?: string;
  /** Updated pot totals after this action */
  pots: Pot[];
  /** Next player to act; null when the hand is fully settled */
  nextPlayerId: string | null;
  /** New stage when the betting round advanced */
  newStage?: GameStage;
  /** Newly dealt community cards (FLOP = 3, TURN/RIVER = 1) */
  newCommunityCards?: Card[];
  /** Set when the hand is finished */
  handSettlement?: HandSettlement;
}

export interface HandSettlement {
  winners: PotDistribution[];
  /** Non-folded players' best hands (shown at showdown) */
  showdownHands: Map<string, HandResult>;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GameEngineService {
  /** In-memory store of active game states, keyed by roomCode */
  private readonly games = new Map<string, EngineGameState>();

  constructor(
    private readonly deckSvc: DeckService,
    private readonly evaluator: EvaluatorService,
    private readonly potSvc: PotService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /** Initialise a game room. Can also be used to add/refresh seated players. */
  initGame(params: InitGameParams): void {
    const players: EnginePlayerState[] = params.seats
      .sort((a, b) => a.seatIndex - b.seatIndex)
      .map((s) => ({
        playerId: s.playerId,
        seatIndex: s.seatIndex,
        chips: s.chips,
        holeCards: null,
        status: 'sitting' as PlayerStatus,
        currentRoundBet: 0,
        totalHandBet: 0,
        hasActedThisRound: false,
      }));

    this.games.set(params.roomCode, {
      roomCode: params.roomCode,
      handNumber: 0,
      stage: GameStage.IDLE,
      dealerSeatIndex: players[0]?.seatIndex ?? 0,
      smallBlind: params.smallBlind,
      bigBlind: params.bigBlind,
      actionTimeout: params.actionTimeout,
      deck: [],
      communityCards: [],
      players,
      currentPlayerIndex: null,
      pots: [],
      roundMaxBet: 0,
      lastRaiseAmount: params.bigBlind,
      handStartTime: 0,
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  startHand(roomCode: string): StartHandResult {
    const state = this.requireState(roomCode);
    if (state.players.length < 2) throw new Error('Need at least 2 players to start a hand');

    state.handNumber++;

    // Reset player state for new hand
    for (const p of state.players) {
      p.holeCards = null;
      p.status = 'playing';
      p.currentRoundBet = 0;
      p.totalHandBet = 0;
      p.hasActedThisRound = false;
    }

    // Advance dealer button to next player
    state.dealerSeatIndex = this.nextSeat(state, state.dealerSeatIndex);
    state.communityCards = [];
    state.pots = [];
    state.roundMaxBet = 0;
    state.lastRaiseAmount = state.bigBlind;
    state.handStartTime = Date.now();
    state.stage = GameStage.DEALING;

    // Post blinds
    const dealerIdx = this.playerIndexBySeat(state, state.dealerSeatIndex);
    const n = state.players.length;
    let sbIdx: number;
    let bbIdx: number;

    if (n === 2) {
      // Heads-up: dealer = SB
      sbIdx = dealerIdx;
      bbIdx = (dealerIdx + 1) % n;
    } else {
      sbIdx = (dealerIdx + 1) % n;
      bbIdx = (dealerIdx + 2) % n;
    }

    this.postBlind(state, sbIdx, state.smallBlind);
    this.postBlind(state, bbIdx, state.bigBlind);
    state.roundMaxBet = state.bigBlind;

    // Deal hole cards
    const shuffled = this.deckSvc.createShuffledDeck();
    state.deck = shuffled;
    const holeCards = new Map<string, [Card, Card]>();
    for (const p of state.players) {
      const cards = this.deckSvc.deal(state.deck, 2) as [Card, Card];
      p.holeCards = cards;
      holeCards.set(p.playerId, cards);
    }

    state.stage = GameStage.PRE_FLOP;

    // First to act pre-flop: player after BB
    const utgIdx = (bbIdx + 1) % n;
    state.currentPlayerIndex = utgIdx;

    return {
      handNumber: state.handNumber,
      dealerSeatIndex: state.dealerSeatIndex,
      playerHoleCards: holeCards,
      firstPlayerId: state.players[utgIdx].playerId,
    };
  }

  handleAction(roomCode: string, playerId: string, action: PlayerAction): ActionResult {
    const state = this.requireState(roomCode);
    const playerIdx = state.players.findIndex((p) => p.playerId === playerId);
    if (playerIdx === -1) return { valid: false, error: 'Player not found', pots: state.pots, nextPlayerId: null };
    if (state.currentPlayerIndex !== playerIdx) return { valid: false, error: 'Not your turn', pots: state.pots, nextPlayerId: null };

    const player = state.players[playerIdx];
    const validation = this.validateAction(state, player, action);
    if (!validation.valid) return { valid: false, error: validation.reason, pots: state.pots, nextPlayerId: null };

    // Apply the action
    this.applyAction(state, player, action);

    // Check if only one player remains (everyone else folded)
    const activePlayers = this.activePlayers(state); // not folded, not standing
    if (activePlayers.length === 1) {
      return this.settleHandNoShowdown(state, activePlayers[0].playerId);
    }

    // Check if betting round is over
    if (this.isBettingRoundOver(state)) {
      return this.endBettingRound(state);
    }

    // Round continues: find next player
    const nextIdx = this.nextActivePlayerIndex(state, playerIdx);
    state.currentPlayerIndex = nextIdx;

    return {
      valid: true,
      pots: state.pots,
      nextPlayerId: nextIdx !== null ? state.players[nextIdx].playerId : null,
    };
  }

  /**
   * Called when the current player's timer expires.
   * Auto-checks if possible, otherwise auto-folds.
   */
  handleTimeout(roomCode: string): ActionResult {
    const state = this.requireState(roomCode);
    if (state.currentPlayerIndex === null) {
      return { valid: false, error: 'No active player', pots: state.pots, nextPlayerId: null };
    }

    const player = state.players[state.currentPlayerIndex];
    const actions = this.computeAvailableActions(state, player);

    const autoAction: PlayerAction = actions.canCheck
      ? { action: ActionType.Check }
      : { action: ActionType.Fold };

    return this.handleAction(roomCode, player.playerId, autoAction);
  }

  getAvailableActions(roomCode: string, playerId: string): AvailableActions | null {
    const state = this.games.get(roomCode);
    if (!state) return null;
    const playerIdx = state.players.findIndex((p) => p.playerId === playerId);
    if (playerIdx === -1 || state.currentPlayerIndex !== playerIdx) return null;
    return this.computeAvailableActions(state, state.players[playerIdx]);
  }

  getGameState(roomCode: string): EngineGameState | undefined {
    return this.games.get(roomCode);
  }

  removeGame(roomCode: string): void {
    this.games.delete(roomCode);
  }

  // ── Betting round helpers ──────────────────────────────────────────────────

  private isBettingRoundOver(state: EngineGameState): boolean {
    const bettingPlayers = this.bettingPlayers(state); // active, not all-in
    if (bettingPlayers.length === 0) return true; // everyone is all-in or folded

    return bettingPlayers.every(
      (p) => p.hasActedThisRound && p.currentRoundBet >= state.roundMaxBet,
    );
  }

  private endBettingRound(state: EngineGameState): ActionResult {
    // Collect bets into pot tracking
    this.updatePots(state);

    // Reset per-round bet tracking
    for (const p of state.players) {
      p.currentRoundBet = 0;
      p.hasActedThisRound = false;
    }
    state.roundMaxBet = 0;
    state.lastRaiseAmount = state.bigBlind;

    // Advance stage
    return this.advanceStage(state);
  }

  private advanceStage(state: EngineGameState): ActionResult {
    // If only all-in players remain (or all active), skip straight to showdown
    const bettingPlayers = this.bettingPlayers(state);
    const skipToShowdown = bettingPlayers.length <= 1 && state.stage !== GameStage.RIVER;

    switch (state.stage) {
      case GameStage.PRE_FLOP: {
        state.stage = GameStage.FLOP;
        const flop = this.deckSvc.deal(state.deck, 3);
        state.communityCards.push(...flop);
        const result: ActionResult = {
          valid: true,
          pots: state.pots,
          newStage: GameStage.FLOP,
          newCommunityCards: flop,
          nextPlayerId: null,
        };
        if (skipToShowdown) return this.fastForwardToShowdown(state, result);
        return this.setupBettingRound(state, result);
      }

      case GameStage.FLOP: {
        state.stage = GameStage.TURN;
        const turn = this.deckSvc.deal(state.deck, 1);
        state.communityCards.push(...turn);
        const result: ActionResult = {
          valid: true,
          pots: state.pots,
          newStage: GameStage.TURN,
          newCommunityCards: turn,
          nextPlayerId: null,
        };
        if (skipToShowdown) return this.fastForwardToShowdown(state, result);
        return this.setupBettingRound(state, result);
      }

      case GameStage.TURN: {
        state.stage = GameStage.RIVER;
        const river = this.deckSvc.deal(state.deck, 1);
        state.communityCards.push(...river);
        const result: ActionResult = {
          valid: true,
          pots: state.pots,
          newStage: GameStage.RIVER,
          newCommunityCards: river,
          nextPlayerId: null,
        };
        if (skipToShowdown) return this.fastForwardToShowdown(state, result);
        return this.setupBettingRound(state, result);
      }

      case GameStage.RIVER: {
        return this.doShowdown(state);
      }

      default:
        throw new Error(`Unexpected stage for advanceStage: ${state.stage}`);
    }
  }

  /**
   * Sets up a new betting round: find first player to act after dealer.
   */
  private setupBettingRound(state: EngineGameState, partial: ActionResult): ActionResult {
    const dealerIdx = this.playerIndexBySeat(state, state.dealerSeatIndex);
    const firstIdx = this.nextActivePlayerIndex(state, dealerIdx - 1);
    state.currentPlayerIndex = firstIdx;

    return {
      ...partial,
      nextPlayerId: firstIdx !== null ? state.players[firstIdx].playerId : null,
    };
  }

  /**
   * Fast-forward: deal all remaining community cards and go straight to showdown.
   */
  private fastForwardToShowdown(state: EngineGameState, partial: ActionResult): ActionResult {
    const additionalCards: Card[] = [];

    while (state.communityCards.length < 5) {
      const card = this.deckSvc.dealOne(state.deck);
      state.communityCards.push(card);
      additionalCards.push(card);
    }

    const showdownResult = this.doShowdown(state);
    return {
      ...showdownResult,
      newStage: partial.newStage,
      newCommunityCards: [...(partial.newCommunityCards ?? []), ...additionalCards],
    };
  }

  private doShowdown(state: EngineGameState): ActionResult {
    state.stage = GameStage.SHOWDOWN;

    // Evaluate each non-folded player's best hand
    const handResults = new Map<string, HandResult>();
    for (const p of state.players) {
      if (p.status !== 'folded' && p.holeCards) {
        handResults.set(
          p.playerId,
          this.evaluator.evaluateBestHand(p.holeCards, state.communityCards),
        );
      }
    }

    // Seat order starting from player left of dealer (for odd-chip tiebreaking)
    const dealerIdx = this.playerIndexBySeat(state, state.dealerSeatIndex);
    const eligibilityOrder = [...state.players]
      .map((p, i) => ({ p, i }))
      .sort((a, b) => {
        const aRel = (a.i - dealerIdx - 1 + state.players.length) % state.players.length;
        const bRel = (b.i - dealerIdx - 1 + state.players.length) % state.players.length;
        return aRel - bRel;
      })
      .map(({ p }) => p.playerId);

    // Build contributions for pot calculation
    const contributions = new Map<string, number>();
    const allInIds = new Set<string>();
    for (const p of state.players) {
      if (p.totalHandBet > 0) contributions.set(p.playerId, p.totalHandBet);
      if (p.status === 'allin') allInIds.add(p.playerId);
    }

    const pots = this.potSvc.calculatePots(contributions, allInIds);
    const winners = this.potSvc.distributePots(pots, handResults, eligibilityOrder);

    // Apply winnings
    for (const { playerId, amount } of winners) {
      const p = state.players.find((pl) => pl.playerId === playerId);
      if (p) p.chips += amount;
    }

    state.stage = GameStage.SETTLE;
    state.currentPlayerIndex = null;
    state.pots = pots;

    return {
      valid: true,
      pots,
      nextPlayerId: null,
      newStage: GameStage.SETTLE,
      handSettlement: {
        winners,
        showdownHands: handResults,
      },
    };
  }

  private settleHandNoShowdown(state: EngineGameState, winnerId: string): ActionResult {
    // Last player standing: collect all bets
    const winner = state.players.find((p) => p.playerId === winnerId)!;

    const contributions = new Map<string, number>();
    const allInIds = new Set<string>();
    for (const p of state.players) {
      if (p.totalHandBet > 0) contributions.set(p.playerId, p.totalHandBet);
      if (p.status === 'allin') allInIds.add(p.playerId);
    }

    const pots = this.potSvc.calculatePots(contributions, allInIds);
    const total = this.potSvc.totalChips(pots);
    winner.chips += total;

    state.stage = GameStage.SETTLE;
    state.currentPlayerIndex = null;
    state.pots = pots;

    return {
      valid: true,
      pots,
      nextPlayerId: null,
      newStage: GameStage.SETTLE,
      handSettlement: {
        winners: [{ playerId: winnerId, amount: total }],
        showdownHands: new Map(),
      },
    };
  }

  // ── Action application ─────────────────────────────────────────────────────

  private applyAction(state: EngineGameState, player: EnginePlayerState, action: PlayerAction): void {
    switch (action.action) {
      case ActionType.Fold:
        this.applyFold(state, player);
        break;
      case ActionType.Check:
        this.applyCheck(player);
        break;
      case ActionType.Call:
        this.applyCall(state, player);
        break;
      case ActionType.Raise:
        this.applyRaise(state, player, action.amount!);
        break;
      case ActionType.AllIn:
        this.applyAllIn(state, player);
        break;
    }
  }

  private applyFold(_state: EngineGameState, player: EnginePlayerState): void {
    player.status = 'folded';
    player.hasActedThisRound = true;
  }

  private applyCheck(player: EnginePlayerState): void {
    player.hasActedThisRound = true;
  }

  private applyCall(state: EngineGameState, player: EnginePlayerState): void {
    const amount = Math.min(state.roundMaxBet - player.currentRoundBet, player.chips);
    player.chips -= amount;
    player.currentRoundBet += amount;
    player.totalHandBet += amount;
    player.hasActedThisRound = true;

    if (player.chips === 0) player.status = 'allin';
  }

  private applyRaise(state: EngineGameState, player: EnginePlayerState, totalBetThisRound: number): void {
    const amount = totalBetThisRound - player.currentRoundBet;
    player.chips -= amount;
    state.lastRaiseAmount = totalBetThisRound - state.roundMaxBet;
    state.roundMaxBet = totalBetThisRound;
    player.currentRoundBet = totalBetThisRound;
    player.totalHandBet += amount;
    player.hasActedThisRound = true;

    if (player.chips === 0) player.status = 'allin';

    // All other active non-folded non-allin players must act again
    for (const other of state.players) {
      if (other.playerId !== player.playerId && other.status === 'playing') {
        other.hasActedThisRound = false;
      }
    }
  }

  private applyAllIn(state: EngineGameState, player: EnginePlayerState): void {
    const allInAmount = player.currentRoundBet + player.chips;

    if (allInAmount > state.roundMaxBet) {
      // This all-in is effectively a raise
      state.lastRaiseAmount = allInAmount - state.roundMaxBet;
      state.roundMaxBet = allInAmount;

      // Others need to act again
      for (const other of state.players) {
        if (other.playerId !== player.playerId && other.status === 'playing') {
          other.hasActedThisRound = false;
        }
      }
    }

    player.totalHandBet += player.chips;
    player.currentRoundBet = allInAmount;
    player.chips = 0;
    player.status = 'allin';
    player.hasActedThisRound = true;
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  private validateAction(
    state: EngineGameState,
    player: EnginePlayerState,
    action: PlayerAction,
  ): { valid: boolean; reason?: string } {
    if (player.status === 'folded') return { valid: false, reason: 'Player already folded' };
    if (player.status === 'allin') return { valid: false, reason: 'Player is all-in' };

    const available = this.computeAvailableActions(state, player);

    switch (action.action) {
      case ActionType.Fold:
        return { valid: available.canFold };
      case ActionType.Check:
        return available.canCheck
          ? { valid: true }
          : { valid: false, reason: 'Cannot check, must call or raise' };
      case ActionType.Call:
        return { valid: available.canCall };
      case ActionType.Raise: {
        if (!available.canRaise) return { valid: false, reason: 'Cannot raise' };
        if (action.amount === undefined) return { valid: false, reason: 'Raise amount required' };
        if (action.amount < available.minRaise!) return { valid: false, reason: `Min raise is ${available.minRaise}` };
        if (action.amount > available.maxRaise!) return { valid: false, reason: `Max raise is ${available.maxRaise}` };
        return { valid: true };
      }
      case ActionType.AllIn:
        return { valid: available.canAllIn };
      default:
        return { valid: false, reason: 'Unknown action' };
    }
  }

  private computeAvailableActions(
    state: EngineGameState,
    player: EnginePlayerState,
  ): AvailableActions {
    const toCall = state.roundMaxBet - player.currentRoundBet;
    const canCheck = toCall === 0;
    const canCall = !canCheck && player.chips > toCall;
    const callAmount = canCall ? toCall : undefined;

    // Min raise = max bet + last raise amount (or big blind if first raise)
    const minRaiseTo = state.roundMaxBet + Math.max(state.lastRaiseAmount, state.bigBlind);
    const canRaise = player.chips > toCall && player.chips + player.currentRoundBet >= minRaiseTo;
    const minRaise = canRaise ? minRaiseTo : undefined;
    const maxRaise = canRaise ? player.chips + player.currentRoundBet : undefined;

    return {
      canFold: true,
      canCheck,
      canCall,
      callAmount,
      canRaise,
      minRaise,
      maxRaise,
      canAllIn: player.chips > 0,
      allInAmount: player.chips > 0 ? player.chips + player.currentRoundBet : undefined,
    };
  }

  // ── Pot tracking ───────────────────────────────────────────────────────────

  /** Recalculate pots based on totalHandBet contributions accumulated so far */
  private updatePots(state: EngineGameState): void {
    const contributions = new Map<string, number>();
    const allInIds = new Set<string>();
    for (const p of state.players) {
      if (p.totalHandBet > 0) contributions.set(p.playerId, p.totalHandBet);
      if (p.status === 'allin') allInIds.add(p.playerId);
    }
    state.pots = this.potSvc.calculatePots(contributions, allInIds);
  }

  // ── Player navigation ──────────────────────────────────────────────────────

  /** Returns players still in the hand (not folded, not standing) */
  private activePlayers(state: EngineGameState): EnginePlayerState[] {
    return state.players.filter((p) => p.status === 'playing' || p.status === 'allin');
  }

  /** Returns players who can still place bets (active and not all-in) */
  private bettingPlayers(state: EngineGameState): EnginePlayerState[] {
    return state.players.filter((p) => p.status === 'playing');
  }

  /**
   * Returns the index of the next player who needs to act, starting after `fromIndex`.
   * Returns null if no one needs to act.
   */
  private nextActivePlayerIndex(state: EngineGameState, fromIndex: number): number | null {
    const n = state.players.length;
    for (let offset = 1; offset < n; offset++) {
      const idx = (fromIndex + offset) % n;
      const p = state.players[idx];
      if (p.status === 'playing') return idx;
    }
    return null; // all others are folded or all-in
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  private requireState(roomCode: string): EngineGameState {
    const state = this.games.get(roomCode);
    if (!state) throw new Error(`No game found for room ${roomCode}`);
    return state;
  }

  private playerIndexBySeat(state: EngineGameState, seatIndex: number): number {
    const idx = state.players.findIndex((p) => p.seatIndex === seatIndex);
    if (idx === -1) throw new Error(`No player at seat ${seatIndex}`);
    return idx;
  }

  /** Advance dealer seat to next occupied seat clockwise */
  private nextSeat(state: EngineGameState, currentSeat: number): number {
    const seats = state.players.map((p) => p.seatIndex).sort((a, b) => a - b);
    const idx = seats.indexOf(currentSeat);
    return seats[(idx + 1) % seats.length];
  }

  private postBlind(state: EngineGameState, playerIdx: number, amount: number): void {
    const player = state.players[playerIdx];
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    player.currentRoundBet = actual;
    player.totalHandBet = actual;
    player.hasActedThisRound = false; // will be given a chance to act
    if (player.chips === 0) player.status = 'allin';
  }
}
