import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GameHandResultPayload } from '@poker-friends/shared';
import { CardView } from './CardView';

interface Props {
  result: GameHandResultPayload;
  myId: string | undefined;
}

export function SettlementOverlay({ result, myId }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>结算</Text>

        {/* Winners */}
        {result.winners.map((w, i) => {
          const isMe = w.playerId === myId;
          return (
            <View key={i} style={styles.winnerRow}>
              <Text style={[styles.winnerText, isMe && styles.winnerMe]}>
                🏆 座位{w.seatIndex}
                {isMe ? ' (你)' : ''}
                {' 赢得 '}
                <Text style={styles.gold}>{w.chipsWon}</Text>
                {w.handResult?.rankName ? ` — ${w.handResult.rankName}` : ''}
              </Text>
            </View>
          );
        })}

        {/* Showdown hands */}
        {result.showdownPlayers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>摊牌</Text>
            {result.showdownPlayers.map((p, i) => (
              <View key={i} style={styles.showdownRow}>
                <Text style={styles.showdownName}>
                  座位{p.seatIndex}
                  {p.playerId === myId ? ' (你)' : ''}
                </Text>
                <View style={styles.cardsRow}>
                  {p.holeCards.map((c, j) => (
                    <CardView key={j} card={c} size="sm" />
                  ))}
                </View>
                <Text style={styles.rankName}>
                  {p.handResult?.rankName ?? ''}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Community */}
        {result.communityCards.length > 0 && (
          <View style={styles.communityRow}>
            {result.communityCards.map((c, i) => (
              <CardView key={i} card={c} size="sm" />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#111927',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4A843',
    padding: 24,
    width: '85%',
    maxWidth: 360,
  },
  title: {
    color: '#D4A843',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  winnerRow: { marginBottom: 8 },
  winnerText: { color: '#E8E0D0', fontSize: 15 },
  winnerMe: { color: '#D4A843', fontWeight: '700' },
  gold: { color: '#D4A843', fontWeight: '700' },
  sectionTitle: {
    color: '#8B95A5',
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  showdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  showdownName: { color: '#E8E0D0', fontSize: 13, width: 70 },
  cardsRow: { flexDirection: 'row', gap: 3 },
  rankName: { color: '#8FA', fontSize: 12, marginLeft: 4 },
  communityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
  },
});
