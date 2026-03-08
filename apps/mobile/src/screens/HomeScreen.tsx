import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
  const roomCode = useRoomStore((s) => s.roomCode);

  // Navigate to RoomLobby when room state arrives
  useEffect(() => {
    if (roomCode) {
      setJoinCode('');
      navigation.navigate('RoomLobby', { roomCode });
    }
  }, [roomCode, navigation]);

  // Listen for creation errors
  useEffect(() => {
    const unsub = socketService.on(SocketEvent.GameError, (data) => {
      Alert.alert('错误', data.message);
    });
    return unsub;
  }, []);

  const handleCreate = useCallback(() => {
    const config: RoomConfig = {
      maxPlayers: 6,
      smallBlind: 10,
      bigBlind: 20,
      minBuyin: 400,
      maxBuyin: 2000,
      actionTimeout: 30,
    };
    socketService.createRoom({ config });
  }, []);

  const handleJoin = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('提示', '请输入房间号');
      return;
    }
    socketService.joinRoom({ roomCode: code });
  }, [joinCode]);

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

      {/* Create room */}
      <TouchableOpacity style={styles.btnCreate} onPress={handleCreate}>
        <Text style={styles.btnCreateText}>创建房间</Text>
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
        <TouchableOpacity style={styles.btnJoin} onPress={handleJoin}>
          <Text style={styles.btnJoinText}>加入</Text>
        </TouchableOpacity>
      </View>

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
  btnLogout: { position: 'absolute', bottom: 60 },
  logoutText: { color: '#666', fontSize: 14 },
});
