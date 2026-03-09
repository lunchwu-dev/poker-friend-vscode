import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/authStore';

const SERVER_URL = __DEV__ ? 'http://10.0.2.2:3000' : 'https://poker-friends-server.fly.dev';

const RANK_NAMES: Record<number, string> = {
  0: '皇家同花顺',
  1: '同花顺',
  2: '四条',
  3: '葫芦',
  4: '同花',
  5: '顺子',
  6: '三条',
  7: '两对',
  8: '一对',
  9: '高牌',
};

interface StatsData {
  nickname: string;
  coins: number;
  totalHands: number;
  totalWins: number;
  winRate: number;
  totalProfit: number;
  bestHandRank: number | null;
  maxSingleWin: number;
  recentHands: Array<{
    roomCode: string;
    handNumber: number;
    playerCount: number;
    potTotal: number;
    chipsChange: number;
    isWinner: boolean;
    finalHandRank: number | null;
    playedAt: string;
  }>;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export function StatsScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/stats/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch {
      // Silently fail for now
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4A843" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>战绩统计</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Overview cards */}
      <View style={styles.statsGrid}>
        <StatCard label="总手数" value={`${stats.totalHands}`} />
        <StatCard label="胜率" value={`${stats.winRate}%`} />
        <StatCard
          label="总盈亏"
          value={`${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit}`}
          color={stats.totalProfit >= 0 ? '#4CAF50' : '#E74C3C'}
        />
        <StatCard label="最大单笔" value={`${stats.maxSingleWin}`} />
        <StatCard
          label="最佳牌型"
          value={
            stats.bestHandRank !== null
              ? RANK_NAMES[stats.bestHandRank] ?? `Rank ${stats.bestHandRank}`
              : '-'
          }
        />
        <StatCard label="筹码" value={`${stats.coins}`} />
      </View>

      {/* Recent hands */}
      <Text style={styles.sectionTitle}>最近对局</Text>
      {stats.recentHands.length === 0 ? (
        <Text style={styles.emptyText}>暂无对局记录</Text>
      ) : (
        stats.recentHands.map((hand, i) => (
          <View key={i} style={styles.handRow}>
            <View style={styles.handLeft}>
              <Text style={styles.handRoom}>#{hand.roomCode}</Text>
              <Text style={styles.handInfo}>
                {hand.playerCount}人 · 底池{hand.potTotal}
              </Text>
            </View>
            <View style={styles.handRight}>
              <Text
                style={[
                  styles.handChips,
                  { color: hand.chipsChange >= 0 ? '#4CAF50' : '#E74C3C' },
                ]}
              >
                {hand.chipsChange >= 0 ? '+' : ''}{hand.chipsChange}
              </Text>
              {hand.isWinner && <Text style={styles.winBadge}>🏆</Text>}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color = '#E8E0D0',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080E1A' },
  content: { paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: '#080E1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { color: '#D4A843', fontSize: 16 },
  title: {
    color: '#D4A843',
    fontSize: 20,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#111927',
    borderRadius: 12,
    padding: 14,
    width: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A2332',
  },
  statLabel: { color: '#8B95A5', fontSize: 11, marginBottom: 4 },
  statValue: { color: '#E8E0D0', fontSize: 18, fontWeight: '700' },
  sectionTitle: {
    color: '#D4A843',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyText: { color: '#556', fontSize: 14, textAlign: 'center' },
  handRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111927',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
  },
  handLeft: {},
  handRoom: { color: '#8B95A5', fontSize: 12 },
  handInfo: { color: '#E8E0D0', fontSize: 13, marginTop: 2 },
  handRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  handChips: { fontSize: 16, fontWeight: '700' },
  winBadge: { fontSize: 14 },
});
