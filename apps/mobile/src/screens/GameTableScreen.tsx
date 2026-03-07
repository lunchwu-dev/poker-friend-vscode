import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'GameTable'>;

export function GameTableScreen({ route }: Props) {
  const { roomCode } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.roomCode}>房间 #{roomCode}</Text>
      <View style={styles.table}>
        <Text style={styles.tableText}>牌桌区域</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1A',
    alignItems: 'center',
    paddingTop: 60,
  },
  roomCode: {
    fontSize: 16,
    color: '#8B95A5',
    marginBottom: 20,
  },
  table: {
    flex: 1,
    width: '90%',
    backgroundColor: '#0D3B23',
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 3,
    borderColor: '#D4A843',
  },
  tableText: {
    fontSize: 20,
    color: '#E8ECF2',
  },
});
