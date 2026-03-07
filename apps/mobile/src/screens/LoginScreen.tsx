import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poker Friends</Text>
      <Text style={styles.subtitle}>好友德州 · 随时开局</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Home')}
      >
        <Text style={styles.buttonText}>游客登录</Text>
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
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#D4A843',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#080E1A',
  },
});
