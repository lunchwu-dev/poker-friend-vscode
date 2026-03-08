import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STAGES = [
  { key: 'PRE_FLOP', label: '翻牌前' },
  { key: 'FLOP', label: '翻牌' },
  { key: 'TURN', label: '转牌' },
  { key: 'RIVER', label: '河牌' },
];

const STAGE_ORDER: Record<string, number> = {
  PRE_FLOP: 0,
  FLOP: 1,
  TURN: 2,
  RIVER: 3,
  SHOWDOWN: 3,
  SETTLE: 3,
};

interface Props {
  stage: string;
}

export function StageProgressBar({ stage }: Props) {
  const currentIdx = STAGE_ORDER[stage] ?? -1;

  if (currentIdx < 0) return null;

  return (
    <View style={styles.container}>
      {STAGES.map((s, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <View key={s.key} style={styles.step}>
            {/* Connector line (not for first) */}
            {i > 0 && (
              <View
                style={[
                  styles.line,
                  isPast || isCurrent ? styles.lineActive : styles.lineInactive,
                ]}
              />
            )}
            {/* Dot */}
            <View
              style={[
                styles.dot,
                isPast && styles.dotPast,
                isCurrent && styles.dotCurrent,
                !isPast && !isCurrent && styles.dotFuture,
              ]}
            />
            <Text
              style={[
                styles.label,
                (isPast || isCurrent) ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 24,
    backgroundColor: '#0A1420',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  line: {
    height: 2,
    flex: 1,
    marginRight: 4,
  },
  lineActive: { backgroundColor: '#38A169' },
  lineInactive: {
    backgroundColor: '#2A3A4A',
    borderStyle: 'dashed',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  dotPast: { backgroundColor: '#38A169' },
  dotCurrent: {
    backgroundColor: '#38A169',
    shadowColor: '#38A169',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  dotFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4A5A6A',
  },
  label: { fontSize: 10 },
  labelActive: { color: '#E8E0D0' },
  labelInactive: { color: '#4A5A6A' },
});
