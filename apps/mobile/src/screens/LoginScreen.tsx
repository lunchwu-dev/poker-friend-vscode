import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/authStore';
import { socketService } from '../services/socket';

const SERVER_URL = __DEV__ ? 'http://10.0.2.2:3000' : 'https://poker-friends-server.fly.dev';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState('');
  const { guestLogin, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    const name = nickname.trim() || `玩家${Math.floor(Math.random() * 9000 + 1000)}`;
    await guestLogin(name, SERVER_URL);

    const { token } = useAuthStore.getState();
    if (token) {
      try {
        socketService.connect(token);
        navigation.replace('Home');
      } catch (e) {
        Alert.alert('连接失败', '无法连接到服务器，请稍后重试');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poker Friends</Text>
      <Text style={styles.subtitle}>好友德州 · 随时开局</Text>

      <TextInput
        style={styles.input}
        placeholder="输入昵称（可空）"
        placeholderTextColor="#556"
        value={nickname}
        onChangeText={setNickname}
        maxLength={12}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#080E1A" />
        ) : (
          <Text style={styles.buttonText}>游客登录</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080E1A',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D4A843',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B95A5',
    marginBottom: 32,
  },
  input: {
    width: 260,
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2A3A4A',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#E8E0D0',
    marginBottom: 16,
    textAlign: 'center',
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#D4A843',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#080E1A',
  },
});
