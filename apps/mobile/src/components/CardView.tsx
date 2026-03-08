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
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: { width: 32, height: 44, rankSize: 10, suitSize: 8, centerSize: 16, radius: 4 },
  md: { width: 44, height: 62, rankSize: 12, suitSize: 10, centerSize: 22, radius: 6 },
  lg: { width: 56, height: 78, rankSize: 14, suitSize: 12, centerSize: 28, radius: 6 },
  xl: { width: 68, height: 96, rankSize: 16, suitSize: 14, centerSize: 36, radius: 8 },
};

export function CardView({ card, faceDown, size = 'md' }: Props) {
  const dim = SIZES[size];
  const isRed = card && (card.suit === 'H' || card.suit === 'D');

  if (faceDown || !card) {
    return (
      <View style={[styles.card, styles.cardBack, { width: dim.width, height: dim.height, borderRadius: dim.radius }]}>
        <View style={styles.backInner}>
          <Text style={styles.backPattern}>♠</Text>
        </View>
      </View>
    );
  }

  const textColor = isRed ? '#D63031' : '#1A1A2E';

  return (
    <View style={[styles.card, styles.cardFront, { width: dim.width, height: dim.height, borderRadius: dim.radius }]}>
      {/* Top-left corner index */}
      <View style={styles.cornerTL}>
        <Text style={[styles.cornerRank, { fontSize: dim.rankSize, color: textColor }]}>
          {RANK_NAMES[card.rank]}
        </Text>
        <Text style={[styles.cornerSuit, { fontSize: dim.suitSize, color: textColor }]}>
          {SUIT_SYMBOLS[card.suit]}
        </Text>
      </View>

      {/* Center suit */}
      <Text style={[styles.centerSuit, { fontSize: dim.centerSize, color: textColor }]}>
        {SUIT_SYMBOLS[card.suit]}
      </Text>

      {/* Bottom-right corner index (rotated 180°) */}
      <View style={styles.cornerBR}>
        <Text style={[styles.cornerRank, { fontSize: dim.rankSize, color: textColor }]}>
          {RANK_NAMES[card.rank]}
        </Text>
        <Text style={[styles.cornerSuit, { fontSize: dim.suitSize, color: textColor }]}>
          {SUIT_SYMBOLS[card.suit]}
        </Text>
      </View>
    </View>
  );
}

export function formatCard(card: CardType): string {
  return `${SUIT_SYMBOLS[card.suit]}${RANK_NAMES[card.rank]}`;
}

const styles = StyleSheet.create({
  card: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardFront: {
    backgroundColor: '#FEFCF8',
    borderColor: '#D5D0C5',
  },
  cardBack: {
    backgroundColor: '#132B5E',
    borderColor: '#0D1F4A',
  },
  backInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#2A4A8A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPattern: { color: '#2A4A8A', fontSize: 18, opacity: 0.5 },
  /* Corner index */
  cornerTL: {
    position: 'absolute',
    top: 2,
    left: 3,
    alignItems: 'center',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  cornerRank: { fontWeight: '800', lineHeight: 16 },
  cornerSuit: { lineHeight: 14, marginTop: -2 },
  /* Center */
  centerSuit: { opacity: 0.25 },
});
