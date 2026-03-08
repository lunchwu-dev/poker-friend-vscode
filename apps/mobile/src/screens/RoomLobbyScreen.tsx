import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  BackHandler,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/authStore';
import { useRoomStore } from '../stores/roomStore';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomLobby'>;

export function RoomLobbyScreen({ navigation, route }: Props) {
  const user = useAuthStore((s) => s.user);
  const { roomCode, config, hostId, seats, isPlaying } = useRoomStore();

  // Navigate to GameTable when game starts
  useEffect(() => {
    if (isPlaying && roomCode) {
      navigation.replace('GameTable', { roomCode });
    }
  }, [isPlaying, roomCode, navigation]);

  const isHost = user?.id === hostId;
  const mySeat = seats.find((s) => s.playerId === user?.id);
  const seatedCount = seats.filter((s) => s.status !== 'empty').length;

  const handleSit = useCallback(
    (seatIndex: number) => {
      socketService.sitDown({ seatIndex, buyinAmount: 1000 });
    },
    [],
  );

  const handleStand = useCallback(() => {
    socketService.standUp();
  }, []);

  const handleStart = useCallback(() => {
    if (seatedCount < 2) {
      Alert.alert('提示', '至少需要2人入座');
      return;
    }
    socketService.startGame();
  }, [seatedCount]);

  const handleLeave = useCallback(() => {
    socketService.leaveRoom();
    useRoomStore.getState().clearRoom();
    navigation.replace('Home');
  }, [navigation]);

  // Intercept Android back button
  useEffect(() => {
    const onBack = () => {
      handleLeave();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [handleLeave]);

  const handleShare = useCallback(async () => {
    if (!roomCode) return;
    await Share.share({
      message: `来 Poker Friends 打牌！房间号: ${roomCode}\npokerfriends://room/${roomCode}`,
    });
  }, [roomCode]);

  return (
    <View style={styles.container}>
      {/* Room header */}
      <View style={styles.header}>
        <Text style={styles.roomTitle}>房间 #{roomCode}</Text>
        <Text style={styles.blinds}>
          盲注 {config?.smallBlind}/{config?.bigBlind}
        </Text>
      </View>

      {/* Share button */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareText}>📤 分享房间号</Text>
      </TouchableOpacity>

      {/* Seats */}
      <View style={styles.seatsContainer}>
        {seats.map((seat) => {
          const occupied = seat.status !== 'empty';
          const isMe = seat.playerId === user?.id;
          return (
            <TouchableOpacity
              key={seat.seatIndex}
              style={[
                styles.seat,
                occupied && styles.seatOccupied,
                isMe && styles.seatMe,
              ]}
              onPress={() => !occupied && !mySeat && handleSit(seat.seatIndex)}
              disabled={occupied || !!mySeat}
            >
              {occupied ? (
                <>
                  <Text style={styles.seatName}>
                    {seat.nickname}{isMe ? ' (你)' : ''}
                  </Text>
                  <Text style={styles.seatChips}>💰 {seat.chips}</Text>
                </>
              ) : (
                <Text style={styles.seatEmpty}>座位 {seat.seatIndex}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {mySeat ? (
          <TouchableOpacity style={styles.btnSecondary} onPress={handleStand}>
            <Text style={styles.btnText}>站起</Text>
          </TouchableOpacity>
        ) : null}

        {isHost ? (
          <TouchableOpacity
            style={[styles.btnStart, seatedCount < 2 && styles.btnDisabled]}
            onPress={handleStart}
          >
            <Text style={styles.btnStartText}>
              开始游戏 ({seatedCount}/2+)
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.waitText}>等待房主开始游戏...</Text>
        )}

        <TouchableOpacity style={styles.btnDanger} onPress={handleLeave}>
          <Text style={styles.btnText}>离开房间</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1A',
    paddingTop: 60,
    alignItems: 'center',
  },
  header: { alignItems: 'center', marginBottom: 16 },
  roomTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4A843',
    letterSpacing: 2,
  },
  blinds: { color: '#8B95A5', fontSize: 14, marginTop: 4 },
  shareBtn: {
    backgroundColor: '#1A2332',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 24,
  },
  shareText: { color: '#D4A843', fontSize: 14 },
  seatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  seat: {
    width: 100,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A3A4A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111927',
  },
  seatOccupied: {
    borderColor: '#1B6B3A',
    borderStyle: 'solid',
  },
  seatMe: {
    borderColor: '#D4A843',
    backgroundColor: '#1A2332',
  },
  seatName: { color: '#E8E0D0', fontSize: 13, fontWeight: '600' },
  seatChips: { color: '#8FA', fontSize: 12, marginTop: 2 },
  seatEmpty: { color: '#556', fontSize: 12 },
  actions: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 12,
  },
  btnStart: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  btnStartText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
  btnSecondary: {
    backgroundColor: '#1A2332',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnDanger: {
    backgroundColor: '#3A1515',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: { color: '#E8E0D0', fontSize: 14 },
  waitText: { color: '#8B95A5', fontSize: 14 },
});
