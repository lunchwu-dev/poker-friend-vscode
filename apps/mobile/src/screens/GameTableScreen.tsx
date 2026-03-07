import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useRoomStore } from '../stores/roomStore';
import { PlayerSeat } from '../components/PlayerSeat';
import { CardView } from '../components/CardView';
import { ActionPanel } from '../components/ActionPanel';
import { SettlementOverlay } from '../components/SettlementOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'GameTable'>;

/**
 * Seat positions around the table ellipse, relative to container.
 * Index 0 = bottom center (me), clockwise.
 * For 6 seats: bottom, bottom-left, top-left, top, top-right, bottom-right
 */
const SEAT_POSITIONS_6 = [
  { left: '50%', top: '88%' },  // 0 - bottom center
  { left: '6%',  top: '68%' },  // 1 - left lower
  { left: '6%',  top: '28%' },  // 2 - left upper
  { left: '50%', top: '6%'  },  // 3 - top center
  { left: '94%', top: '28%' },  // 4 - right upper
  { left: '94%', top: '68%' },  // 5 - right lower
];

const STAGE_LABELS: Record<string, string> = {
  IDLE: '等待开始',
  PRE_FLOP: '翻牌前',
  FLOP: '翻牌',
  TURN: '转牌',
  RIVER: '河牌',
  SHOWDOWN: '摊牌',
  SETTLE: '结算',
};

export function GameTableScreen({ route }: Props) {
  const { roomCode } = route.params;
  const userId = useAuthStore((s) => s.user?.id);
  const config = useRoomStore((s) => s.config);

  const {
    seats,
    dealerSeatIndex,
    communityCards,
    stage,
    potTotal,
    myHoleCards,
    actionSeatIndex,
    actionPlayerId,
    availableActions,
    timeoutMs,
    handResult,
  } = useGameStore();

  const isMyTurn = actionPlayerId === userId;
  const showdownCards = handResult?.showdownPlayers;

  return (
    <View style={styles.container}>
      {/* Room info header */}
      <View style={styles.header}>
        <Text style={styles.roomCode}>#{roomCode}</Text>
        <Text style={styles.blinds}>
          {config ? `${config.smallBlind}/${config.bigBlind}` : ''}
        </Text>
      </View>

      {/* Table ellipse */}
      <View style={styles.tableArea}>
        {/* Felt surface */}
        <View style={styles.felt}>
          {/* Stage label */}
          <Text style={styles.stageText}>{STAGE_LABELS[stage] ?? stage}</Text>

          {/* Pot */}
          {potTotal > 0 && (
            <Text style={styles.potText}>底池 {potTotal}</Text>
          )}

          {/* Community cards */}
          {communityCards.length > 0 && (
            <View style={styles.communityCards}>
              {communityCards.map((c, i) => (
                <CardView key={i} card={c} size="md" />
              ))}
            </View>
          )}
        </View>

        {/* Player seats */}
        {seats.map((seat, idx) => {
          if (seat.status === 'empty') return null;
          const pos = SEAT_POSITIONS_6[idx] ?? SEAT_POSITIONS_6[0];
          const isMe = seat.playerId === userId;
          const showCards = showdownCards?.find(
            (p) => p.playerId === seat.playerId,
          )?.holeCards;

          return (
            <View
              key={idx}
              style={[styles.seatWrapper, { left: pos.left as any, top: pos.top as any }]}
            >
              <PlayerSeat
                seat={seat}
                isMe={isMe}
                isActive={actionSeatIndex === idx}
                isDealer={dealerSeatIndex === idx}
                holeCards={isMe ? myHoleCards : undefined}
                showCards={showCards}
              />
            </View>
          );
        })}
      </View>

      {/* Action panel */}
      {isMyTurn && availableActions && (
        <ActionPanel actions={availableActions} />
      )}

      {/* Settlement overlay */}
      {handResult && <SettlementOverlay result={handResult} myId={userId} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 8,
  },
  roomCode: { color: '#8B95A5', fontSize: 14 },
  blinds: { color: '#8FA', fontSize: 13 },
  tableArea: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    position: 'relative',
  },
  felt: {
    position: 'absolute',
    top: '10%',
    left: '8%',
    right: '8%',
    bottom: '14%',
    borderRadius: 100,
    backgroundColor: '#0D5E3A',
    borderWidth: 3,
    borderColor: '#1A7A4E',
    justifyContent: 'center',
    alignItems: 'center',
    // Inner glow effect
    shadowColor: '#0f7a4a',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 4,
  },
  stageText: {
    color: '#D4A843',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  potText: {
    color: '#E8E0D0',
    fontSize: 14,
    marginBottom: 8,
  },
  communityCards: {
    flexDirection: 'row',
    gap: 4,
  },
  seatWrapper: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -30 }],
  },
});
