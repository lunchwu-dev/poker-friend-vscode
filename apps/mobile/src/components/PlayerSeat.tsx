import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SeatInfo, Card } from '@poker-friends/shared';
import { CardView } from './CardView';
import { CountdownRing } from './CountdownRing';

interface Props {
  seat: SeatInfo;
  isMe: boolean;
  isActive: boolean;
  isDealer: boolean;
  holeCards?: Card[];
  showCards?: Card[];
  timeoutMs?: number;
}

export function PlayerSeat({ seat, isMe, isActive, isDealer, holeCards, showCards, timeoutMs }: Props) {
  const isFolded = seat.status === 'folded';
  const isAllIn = seat.status === 'allin';

  const displayCards = showCards || (isMe ? holeCards : undefined);

  // First letter of nickname for avatar
  const avatarLetter = (seat.nickname ?? '?').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Dealer button */}
      {isDealer && (
        <View style={styles.dealerBadge}>
          <Text style={styles.dealerText}>D</Text>
        </View>
      )}

      {/* Avatar circle */}
      <View
        style={[
          styles.avatar,
          isActive && styles.avatarActive,
          isFolded && styles.avatarFolded,
        ]}
      >
        <Text style={styles.avatarText}>{avatarLetter}</Text>
        {/* Folded overlay */}
        {isFolded && (
          <View style={styles.foldedOverlay}>
            <Text style={styles.foldedText}>弃牌</Text>
          </View>
        )}
        {/* Countdown ring */}
        {isActive && timeoutMs && timeoutMs > 0 && (
          <CountdownRing durationMs={timeoutMs} />
        )}
      </View>

      {/* ALL IN label */}
      {isAllIn && (
        <View style={styles.allInBadge}>
          <Text style={styles.allInText}>ALL IN</Text>
        </View>
      )}

      {/* Nickname */}
      <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
        {seat.nickname}
      </Text>

      {/* Chips */}
      <View style={styles.chipsBg}>
        <Text style={styles.chips}>
          {isAllIn ? '0' : `${seat.chips}`}
        </Text>
      </View>

      {/* Hole cards (small, in seat for other players) */}
      {displayCards && displayCards.length === 2 ? (
        <View style={styles.cardsRow}>
          <CardView card={displayCards[0]} size="sm" />
          <CardView card={displayCards[1]} size="sm" />
        </View>
      ) : seat.status === 'playing' && !isMe ? (
        <View style={styles.cardsRow}>
          <CardView faceDown size="sm" />
          <CardView faceDown size="sm" />
        </View>
      ) : null}

      {/* Current bet */}
      {seat.currentBet > 0 && (
        <View style={styles.betBadge}>
          <Text style={styles.betText}>{seat.currentBet}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    minWidth: 76,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A3A4A',
    borderWidth: 2,
    borderColor: '#3A4A5A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarActive: {
    borderColor: '#D4A843',
    borderWidth: 3,
    shadowColor: '#D4A843',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarFolded: {
    opacity: 0.5,
  },
  avatarText: {
    color: '#E8E0D0',
    fontSize: 18,
    fontWeight: '700',
  },
  foldedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foldedText: {
    color: '#E74C3C',
    fontSize: 10,
    fontWeight: '800',
  },
  allInBadge: {
    backgroundColor: '#C53030',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  allInText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dealerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D4A843',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dealerText: { color: '#080E1A', fontSize: 10, fontWeight: '800' },
  name: {
    color: '#E8E0D0',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 70,
    marginTop: 2,
  },
  nameMe: { color: '#D4A843' },
  chipsBg: {
    backgroundColor: '#111927',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginTop: 1,
  },
  chips: { color: '#8FA', fontSize: 11, fontWeight: '600' },
  cardsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 3,
  },
  betBadge: {
    position: 'absolute',
    bottom: -14,
    backgroundColor: '#F90',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  betText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
