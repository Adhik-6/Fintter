/**
 * HealthScoreRing — circular progress ring for Financial Health Score.
 */
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@src/theme';

interface HealthScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export function HealthScoreRing({ score, size = 120, strokeWidth = 8 }: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const scoreColor = score >= 70 ? colors.income : score >= 40 ? colors.warning : colors.expense;
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Fair' : 'Needs Work';

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={colors.surface3} strokeWidth={strokeWidth} fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={scoreColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.score, { color: scoreColor }]}>{Math.round(score)}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 32, fontWeight: '800', fontFamily: 'SpaceMono-Regular' },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
});
