import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const SIZE = 52;
const STROKE = 3;

interface Props {
  durationMs: number;
}

export function CountdownRing({ durationMs }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progress.setValue(0);
    const timer = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    });
    timer.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
    );
    pulseLoop.start();

    return () => {
      timer.stop();
      pulseLoop.stop();
    };
  }, [durationMs, progress, pulse]);

  // Color: green → gold → red
  const borderColor = progress.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: ['#38A169', '#38A169', '#D4A843', '#C53030'],
  });

  return (
    <View style={styles.container}>
      {/* Dark track ring */}
      <View style={styles.track} />
      {/* Animated pulsing color ring */}
      <Animated.View style={[styles.ring, { borderColor, opacity: pulse }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: SIZE,
    height: SIZE,
  },
  track: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: '#2A3A4A',
  },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
  },
});
