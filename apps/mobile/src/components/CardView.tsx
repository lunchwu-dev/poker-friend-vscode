import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Card as CardType } from '@poker-friends/shared';

const SUIT_SYMBOLS: Record<string, string> = {
  S: '♠', H: '♥', D: '♦', C: '♣',
};
const RANK_NAMES: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

interface Props {
  card?: CardType;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { width: 32, height: 44, fontSize: 12, suitSize: 10 },
  md: { width: 44, height: 62, fontSize: 16, suitSize: 14 },
  lg: { width: 56, height: 78, fontSize: 20, suitSize: 18 },
};

export function CardView({ card, faceDown, size = 'md' }: Props) {
  const dim = SIZES[size];
  const isRed = card && (card.suit === 'H' || card.suit === 'D');

  if (faceDown || !card) {
    return (
      <View style={[styles.card, styles.cardBack, { width: dim.width, height: dim.height }]}>
        <Text style={[styles.backPattern, { fontSize: dim.suitSize }]}>♠</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.cardFront, { width: dim.width, height: dim.height }]}>
      <Text style={[styles.rank, { fontSize: dim.fontSize, color: isRed ? '#E74C3C' : '#222' }]}>
        {RANK_NAMES[card.rank]}
      </Text>
      <Text style={[styles.suit, { fontSize: dim.suitSize, color: isRed ? '#E74C3C' : '#222' }]}>
        {SUIT_SYMBOLS[card.suit]}
      </Text>
    </View>
  );
}

export function formatCard(card: CardType): string {
  return `${SUIT_SYMBOLS[card.suit]}${RANK_NAMES[card.rank]}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CCC',
  },
  cardBack: {
    backgroundColor: '#1A3366',
    borderColor: '#0D1F4A',
  },
  rank: { fontWeight: '700', lineHeight: 20 },
  suit: { marginTop: -2 },
  backPattern: { color: '#2A4A8A', opacity: 0.6 },
});
