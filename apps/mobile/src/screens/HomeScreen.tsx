import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { SocketEvent, type RoomConfig } from '@poker-friends/shared';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { socketService } from '../services/socket';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const roomCode = useRoomStore((s) => s.roomCode);

  // Navigate to RoomLobby when room state arrives
  useEffect(() => {
    if (roomCode) {
      setLoading(false);
      setJoinCode('');
      navigation.navigate('RoomLobby', { roomCode });
    }
  }, [roomCode, navigation]);

  // Listen for creation errors
  useEffect(() => {
    const unsub = socketService.on(SocketEvent.GameError, (data) => {
      setLoading(false);
      Alert.alert('错误', data.message);
    });
    return unsub;
  }, []);

  // Prevent accidental back on Home (exit app)
  useEffect(() => {
    const onBack = () => {
      // If in a room, don't exit — go rejoin instead
      if (roomCode) return true;
      return false; // allow default behavior (exit app)
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [roomCode]);

  const handleRejoin = useCallback(() => {
    if (roomCode) {
      navigation.navigate('RoomLobby', { roomCode });
    }
  }, [roomCode, navigation]);

  const handleCreate = useCallback(() => {
    if (loading) return;
    setLoading(true);
    const config: RoomConfig = {
      maxPlayers: 6,
      smallBlind: 10,
      bigBlind: 20,
      minBuyin: 400,
      maxBuyin: 2000,
      actionTimeout: 30,
    };
    socketService.createRoom({ config });
  }, [loading]);

  const handleJoin = useCallback(() => {
    if (loading) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('提示', '请输入房间号');
      return;
    }
    setLoading(true);
    socketService.joinRoom({ roomCode: code });
  }, [joinCode, loading]);

  const handleLogout = useCallback(() => {
    socketService.disconnect();
    useAuthStore.getState().logout();
    useRoomStore.getState().clearRoom();
    navigation.replace('Login');
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {user?.nickname ?? '玩家'}
        </Text>
        <Text style={styles.coins}>💰 {user?.coins ?? 0}</Text>
      </View>

      <Text style={styles.logo}>♠ Poker Friends ♥</Text>

      {/* Return to room banner */}
      {roomCode && (
        <TouchableOpacity style={styles.rejoinBanner} onPress={handleRejoin}>
          <Text style={styles.rejoinText}>🎮 游戏中 · 房间 #{roomCode}</Text>
          <Text style={styles.rejoinBtn}>返回房间 →</Text>
        </TouchableOpacity>
      )}

      {/* Create room */}
      <TouchableOpacity
        style={[styles.btnCreate, loading && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#E8ECF2" />
        ) : (
          <Text style={styles.btnCreateText}>创建房间</Text>
        )}
      </TouchableOpacity>

      {/* Join room */}
      <View style={styles.joinRow}>
        <TextInput
          style={styles.input}
          placeholder="输入房间号"
          placeholderTextColor="#556"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.btnJoin, loading && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#E8ECF2" size="small" />
          ) : (
            <Text style={styles.btnJoinText}>加入</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <TouchableOpacity
        style={styles.btnStats}
        onPress={() => navigation.navigate('Stats')}
      >
        <Text style={styles.btnStatsText}>📊 战绩</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1A',
    alignItems: 'center',
    paddingTop: 80,
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 20,
    alignItems: 'flex-end',
  },
  greeting: { color: '#D4A843', fontSize: 16, fontWeight: '600' },
  coins: { color: '#8FA', fontSize: 14, marginTop: 2 },
  logo: {
    fontSize: 30,
    fontWeight: '700',
    color: '#D4A843',
    marginBottom: 60,
    marginTop: 30,
  },
  btnCreate: {
    backgroundColor: '#1B6B3A',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: 260,
    alignItems: 'center',
  },
  btnCreateText: { color: '#E8ECF2', fontSize: 18, fontWeight: '600' },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    width: 160,
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2A3A4A',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#E8E0D0',
    textAlign: 'center',
    letterSpacing: 4,
  },
  btnJoin: {
    backgroundColor: '#1A2236',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnJoinText: { color: '#E8ECF2', fontSize: 16, fontWeight: '600' },
  btnStats: {
    backgroundColor: '#1A2332',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  btnStatsText: { color: '#D4A843', fontSize: 15, fontWeight: '600' },
  btnLogout: { position: 'absolute', bottom: 60 },
  logoutText: { color: '#666', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  rejoinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B3A2A',
    borderWidth: 1,
    borderColor: '#2A6A4A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: 300,
    marginBottom: 20,
  },
  rejoinText: { color: '#8FA', fontSize: 14, fontWeight: '600' },
  rejoinBtn: { color: '#D4A843', fontSize: 14, fontWeight: '700' },
});
