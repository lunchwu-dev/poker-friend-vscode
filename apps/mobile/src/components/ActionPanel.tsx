import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import type { AvailableActions, ActionType } from '@poker-friends/shared';
import { socketService } from '../services/socket';

interface Props {
  actions: AvailableActions;
}

export function ActionPanel({ actions }: Props) {
  const [raiseAmount, setRaiseAmount] = useState(actions.minRaise ?? 0);

  const send = useCallback((action: string, amount?: number) => {
    socketService.sendAction({
      action: { action: action as ActionType, amount },
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Top row: Fold / Check / Call */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.btnFold]}
          onPress={() => send('fold')}
        >
          <Text style={styles.btnText}>弃牌</Text>
        </TouchableOpacity>

        {actions.canCheck && (
          <TouchableOpacity
            style={[styles.btn, styles.btnCheck]}
            onPress={() => send('check')}
          >
            <Text style={styles.btnText}>过牌</Text>
          </TouchableOpacity>
        )}

        {actions.canCall && (
          <TouchableOpacity
            style={[styles.btn, styles.btnCall]}
            onPress={() => send('call')}
          >
            <Text style={styles.btnText}>
              跟注 {actions.callAmount}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, styles.btnAllIn]}
          onPress={() => send('allin')}
        >
          <Text style={styles.btnText}>全押</Text>
        </TouchableOpacity>
      </View>

      {/* Raise row */}
      {actions.canRaise && (
        <View style={styles.raiseRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnRaise]}
            onPress={() => send('raise', raiseAmount)}
          >
            <Text style={styles.btnText}>加注 {raiseAmount}</Text>
          </TouchableOpacity>
          <Slider
            style={styles.slider}
            minimumValue={actions.minRaise ?? 0}
            maximumValue={actions.maxRaise ?? 0}
            step={actions.minRaise ? Math.max(1, Math.floor((actions.minRaise) / 2)) : 1}
            value={raiseAmount}
            onValueChange={(v) => setRaiseAmount(Math.round(v))}
            minimumTrackTintColor="#D4A843"
            maximumTrackTintColor="#2A3A4A"
            thumbTintColor="#D4A843"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A2A3A',
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
    paddingBottom: 30,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  raiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  btnFold: { backgroundColor: '#C0392B' },
  btnCheck: { backgroundColor: '#2A3A4A' },
  btnCall: { backgroundColor: '#1B6B3A' },
  btnRaise: { backgroundColor: '#E67E22', minWidth: 100 },
  btnAllIn: { backgroundColor: '#8E44AD' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  slider: { flex: 1, height: 40 },
});
