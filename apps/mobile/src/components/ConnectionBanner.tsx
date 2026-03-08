import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useConnectionStore } from '../stores/connectionStore';

export function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);

  if (status !== 'reconnecting') return null;

  return (
    <View style={styles.banner}>
      <ActivityIndicator size="small" color="#D4A843" />
      <Text style={styles.text}>连接已断开，正在重连...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 999,
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
