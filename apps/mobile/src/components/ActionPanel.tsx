import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import type { AvailableActions, ActionType } from '@poker-friends/shared';
import { socketService } from '../services/socket';

/* ── Animated pressable button with scale feedback ── */
function ActionButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style: object;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.timing(scale, {
      toValue: 0.93,
      duration: 80,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[styles.btn, style, { transform: [{ scale }] }]}
      >
        <Text style={styles.btnText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

interface Props {
  actions: AvailableActions;
  potTotal: number;
}

export function ActionPanel({ actions, potTotal }: Props) {
  const [raiseAmount, setRaiseAmount] = useState(actions.minRaise ?? 0);
  const [showRaise, setShowRaise] = useState(false);

  const send = useCallback((action: string, amount?: number) => {
    socketService.sendAction({
      action: { action: action as ActionType, amount },
    });
    setShowRaise(false);
  }, []);

  const handleAllIn = useCallback(() => {
    Alert.alert(
      '确认全押',
      `确定 All-in ${actions.allInAmount ?? ''} 筹码？`,
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', style: 'destructive', onPress: () => send('allin') },
      ],
    );
  }, [actions.allInAmount, send]);

  const minR = actions.minRaise ?? 0;
  const maxR = actions.maxRaise ?? 0;

  const setQuickRaise = useCallback(
    (amount: number) => {
      const clamped = Math.min(maxR, Math.max(minR, Math.round(amount)));
      setRaiseAmount(clamped);
    },
    [minR, maxR],
  );

  /* ── Slide-up raise panel ── */
  if (showRaise && actions.canRaise) {
    const halfPot = Math.round(potTotal / 2);
    const pot1x = potTotal;
    const pot2x = potTotal * 2;
    return (
      <View style={styles.container}>
        <Text style={styles.raiseLabel}>加注到: {raiseAmount}</Text>
        <Slider
          style={styles.slider}
          minimumValue={minR}
          maximumValue={maxR}
          step={Math.max(1, Math.floor(minR / 2))}
          value={raiseAmount}
          onValueChange={(v) => setRaiseAmount(Math.round(v))}
          minimumTrackTintColor="#D4A843"
          maximumTrackTintColor="#2A3A4A"
          thumbTintColor="#D4A843"
        />
        <View style={styles.sliderRange}>
          <Text style={styles.rangeText}>{minR}</Text>
          <Text style={styles.rangeText}>{maxR}</Text>
        </View>
        <View style={styles.quickRow}>
          <ActionButton
            label={`½底池\n${halfPot}`}
            onPress={() => setQuickRaise(halfPot)}
            style={styles.btnQuick}
          />
          <ActionButton
            label={`底池\n${pot1x}`}
            onPress={() => setQuickRaise(pot1x)}
            style={styles.btnQuick}
          />
          <ActionButton
            label={`2x底池\n${pot2x}`}
            onPress={() => setQuickRaise(pot2x)}
            style={styles.btnQuick}
          />
          <ActionButton
            label="All-in"
            onPress={() => setQuickRaise(maxR)}
            style={styles.btnQuickAllin}
          />
        </View>
        <View style={styles.row}>
          <ActionButton
            label="取消"
            onPress={() => setShowRaise(false)}
            style={styles.btnCheck}
          />
          <ActionButton
            label={`加注 ${raiseAmount}`}
            onPress={() => send('raise', raiseAmount)}
            style={styles.btnRaise}
          />
        </View>
      </View>
    );
  }

  /* ── Main action buttons ── */
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ActionButton
          label="弃牌"
          onPress={() => send('fold')}
          style={styles.btnFold}
        />

        {actions.canCheck && (
          <ActionButton
            label="过牌"
            onPress={() => send('check')}
            style={styles.btnCheck}
          />
        )}

        {actions.canCall && (
          <ActionButton
            label={`跟注 ${actions.callAmount}`}
            onPress={() => send('call')}
            style={styles.btnCall}
          />
        )}

        {actions.canRaise && (
          <ActionButton
            label="加注"
            onPress={() => setShowRaise(true)}
            style={styles.btnRaise}
          />
        )}

        <ActionButton
          label="全押"
          onPress={handleAllIn}
          style={styles.btnAllIn}
        />
      </View>
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
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  /* ── Raise panel styles ── */
  raiseLabel: {
    color: '#D4A843',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  slider: { width: '100%', height: 40 },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  rangeText: { color: '#8B95A5', fontSize: 11 },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  btnQuick: {
    backgroundColor: '#1A3344',
    borderWidth: 1,
    borderColor: '#2A4A5A',
    minWidth: 62,
  },
  btnQuickAllin: {
    backgroundColor: '#3A2044',
    borderWidth: 1,
    borderColor: '#5A3A6A',
    minWidth: 62,
  },
});
