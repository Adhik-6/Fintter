/**
 * SpendingTrendChart — weekly area chart with scrollable & tappable data points.
 * Uses React state tooltip instead of pointerConfig to avoid scroll conflicts.
 */
import { colors } from '@src/theme';
import { formatAmountCompact } from '@src/utils/currency';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CurveType, LineChart } from 'react-native-gifted-charts';

export interface TrendDataPoint {
  label: string;
  value: number;
  date?: string;
}

interface SpendingTrendChartProps {
  data: TrendDataPoint[];
  height?: number;
  showArea?: boolean;
  onPointPress?: (date: string) => void;
}

export function SpendingTrendChart({
  data,
  height = 200,
  showArea = true,
  onPointPress,
}: SpendingTrendChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [tooltip, setTooltip] = useState<{ label: string; value: number } | null>(null);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.empty}>No trend data available</Text>
      </View>
    );
  }

  // Chart fills the card with horizontal padding accounted for
  // 32 = parent horizontal padding, 16 = yAxis label width approx
  const chartWidth = screenWidth - 32 - 16;

  const maxRaw = Math.max(...data.map(d => d.value), 1);
  const maxValue = Math.ceil(maxRaw * 1.25);

  // Distribute spacing evenly to fit perfectly within the chartWidth
  // Subtracting extra width (80) to account for Y-axis labels and padding so the last point doesn't get clipped.
  const dynamicSpacing = Math.max(20, (chartWidth - 80) / Math.max(1, data.length - 1));

  const chartData = data.map((d) => ({
    value: typeof d.value === 'number' && isFinite(d.value) ? Math.max(0, d.value) : 0,
    label: d.label ?? '',
    date: d.date,
    // ✅ Inline plain object instead of StyleSheet reference
    labelTextStyle: {
      color: colors.textMuted,
      fontSize: 10,
    },
    onPress: () => {
      setTooltip(prev =>
        prev?.label === d.label ? null : { label: d.label, value: d.value }
      );
      if (d.date && onPointPress) onPointPress(d.date);
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.yAxisTitle}>Amount (₹)</Text>

      {/* Tooltip — absolute position at top center */}
      {tooltip && (
        <View style={styles.tooltipBadge}>
          <Text style={styles.tooltipLabel}>{tooltip.label}</Text>
          <View style={styles.tooltipDivider} />
          <Text style={styles.tooltipValue}>{formatAmountCompact(tooltip.value)}</Text>
        </View>
      )}

      {/* Chart */}
      <View style={{ marginLeft: 8 }}>
        <LineChart
          data={chartData}
          height={height}
          width={chartWidth - 50} // Reduced width to accommodate Y-axis without overflowing the container
          color={colors.cyan}
        thickness={2.5}
        areaChart={showArea}
        startFillColor={colors.cyanGlow}
        endFillColor="transparent"
        startOpacity={0.45}
        endOpacity={0}
        curveType={CurveType.QUADRATIC}
        curved
        hideDataPoints={false}
        dataPointsColor={colors.cyan}
        dataPointsRadius={5}
        maxValue={maxValue}
        xAxisColor={colors.border}
        yAxisColor={colors.border}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.label}
        rulesType="solid"
        rulesColor={colors.border}
        noOfSections={4}
        spacing={dynamicSpacing}
        initialSpacing={20}
        endSpacing={20}
        hideRules={false}
        showVerticalLines={false}
        isAnimated
        animationDuration={600}
        />
      </View>

      {/* X-axis label */}
      <Text style={styles.xAxisTitle}>Week</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  emptyContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
  },
  axisText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  yAxisTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 10,
  },
  xAxisTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },

  // Tooltip — absolute positioned top center
  tooltipBadge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  tooltipLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  tooltipValue: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
  },
});