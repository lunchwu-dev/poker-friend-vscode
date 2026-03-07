import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SeatInfo, Card } from '@poker-friends/shared';
import { CardView } from './CardView';

interface Props {
  seat: SeatInfo;
  isMe: boolean;
  isActive: boolean;
  isDealer: boolean;
  holeCards?: Card[];
  showCards?: Card[];
}

export function PlayerSeat({ seat, isMe, isActive, isDealer, holeCards, showCards }: Props) {
  const isFolded = seat.status === 'folded';
  const isAllIn = seat.status === 'allin';

  const displayCards = showCards || (isMe ? holeCards : undefined);

  return (
    <View style={[styles.container, isActive && styles.active, isFolded && styles.folded]}>
      {/* Dealer button */}
      {isDealer && (
        <View style={styles.dealerBadge}>
          <Text style={styles.dealerText}>D</Text>
        </View>
      )}

      {/* Nickname */}
      <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
        {seat.nickname}{isMe ? '' : ''}
      </Text>

      {/* Chips */}
      <Text style={[styles.chips, isAllIn && styles.chipsAllIn]}>
        {isAllIn ? 'ALL IN' : `${seat.chips}`}
      </Text>

      {/* Hole cards */}
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
    backgroundColor: '#1A2332',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A3A4A',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 80,
  },
  active: {
    borderColor: '#D4A843',
    shadowColor: '#D4A843',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  folded: { opacity: 0.35 },
  dealerBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D4A843',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealerText: { color: '#080E1A', fontSize: 10, fontWeight: '800' },
  name: {
    color: '#E8E0D0',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 70,
  },
  nameMe: { color: '#D4A843' },
  chips: { color: '#8FA', fontSize: 11, marginTop: 1 },
  chipsAllIn: { color: '#E74C3C', fontWeight: '700' },
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
