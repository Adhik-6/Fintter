/**
 * BudgetProgressBar — animated horizontal progress bar for budgets.
 */
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';

interface BudgetProgressBarProps {
  name: string;
  icon: string;
  spent: number;
  limit: number;
  percentUsed: number;
  color?: string;
}

export function BudgetProgressBar({ name, icon, spent, limit, percentUsed, color }: BudgetProgressBarProps) {
  const fillWidth = useSharedValue(0);
  const statusColor = color ?? (percentUsed >= 90 ? colors.expense : percentUsed >= 60 ? colors.warning : colors.income);
  const clamped = Math.min(percentUsed, 100);

  useEffect(() => {
    fillWidth.value = withTiming(clamped, { duration: 600 });
  }, [clamped]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
    backgroundColor: statusColor,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={[styles.pct, { color: statusColor }]}>{Math.round(percentUsed)}%</Text>
      </View>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, fillStyle]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.spent}>{formatAmount(spent)}</Text>
        <Text style={styles.limit}>/ {formatAmount(limit)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  icon: { fontSize: 18 },
  name: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  pct: { fontSize: 14, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },
  barBg: { height: 8, backgroundColor: colors.surface3, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  footer: { flexDirection: 'row', marginTop: 4 },
  spent: { fontSize: 12, color: colors.textSecondary, fontFamily: 'SpaceMono-Regular' },
  limit: { fontSize: 12, color: colors.textMuted, marginLeft: 2 },
});
