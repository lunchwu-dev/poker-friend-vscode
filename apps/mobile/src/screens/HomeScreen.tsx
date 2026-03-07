import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>主界面</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('GameTable', { roomCode: 'TEST01' })}
      >
        <Text style={styles.buttonText}>创建房间</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondary]}>
        <Text style={styles.buttonText}>加入房间</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#E8ECF2',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1B6B3A',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    width: 220,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: '#1A2236',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8ECF2',
  },
});
