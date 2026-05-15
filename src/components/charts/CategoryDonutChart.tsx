/**
 * CategoryDonutChart — donut/pie chart for category breakdown.
 */
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';

export interface CategorySlice {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

interface CategoryDonutChartProps {
  data: CategorySlice[];
  centerLabel?: string;
  centerValue?: number;
  size?: number;
}

export function CategoryDonutChart({ data, centerLabel, centerValue, size = 180 }: CategoryDonutChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No category data</Text>
      </View>
    );
  }

  const pieData = data.map((d) => ({
    value: d.total,
    color: d.categoryColor,
    text: d.categoryIcon,
    textSize: 14,
    shiftTextX: -4,
    shiftTextY: -4,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.chartWrap}>
        <PieChart
          data={pieData}
          donut
          radius={size / 2}
          innerRadius={size / 2 - 28}
          innerCircleColor={colors.surface1}
          centerLabelComponent={() => (
            <View style={styles.center}>
              {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
              {centerValue !== undefined && (
                <Text style={styles.centerValue}>{formatAmount(centerValue)}</Text>
              )}
            </View>
          )}
          isAnimated
          animationDuration={600}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.slice(0, 5).map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.categoryColor }]} />
            <Text style={styles.legendIcon}>{d.categoryIcon}</Text>
            <Text style={styles.legendName} numberOfLines={1}>{d.categoryName}</Text>
            <Text style={styles.legendPct}>{d.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  chartWrap: { marginBottom: 20 },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: 40 },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerLabel: { fontSize: 12, color: colors.textMuted },
  centerValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular' },
  legend: { width: '100%', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendIcon: { fontSize: 16 },
  legendName: { flex: 1, fontSize: 13, color: colors.textSecondary },
  legendPct: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', fontFamily: 'SpaceMono-Regular' },
});
