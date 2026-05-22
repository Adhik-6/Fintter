/**
 * SpendingTrendChart — line chart for daily/weekly spending trends.
 */
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '@src/theme';

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

export function SpendingTrendChart({ data, height = 200, showArea = true, onPointPress }: SpendingTrendChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.empty}>No trend data available</Text>
      </View>
    );
  }

  const chartData = data.map((d) => ({
    value: d.value / 100, // Convert from paise to rupees for display
    label: d.label,
    date: d.date,
    labelTextStyle: { ...styles.label },
    onPress: () => {
      if (d.date && onPointPress) onPointPress(d.date);
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.yAxisTitle}>Amount (₹)</Text>
      <View style={{ marginLeft: 8 }}>
        <LineChart
          data={chartData}
          height={height}
          width={280}
          color={colors.cyan}
          thickness={2}
          areaChart={showArea}
          startFillColor={colors.cyanGlow}
          endFillColor="transparent"
          startOpacity={0.6}
          endOpacity={0}
          curved
          hideDataPoints={data.length > 14}
          dataPointsColor={colors.cyan}
          dataPointsRadius={3}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.label}
          backgroundColor={colors.surface1}
          rulesType="solid"
          rulesColor={colors.border}
          noOfSections={4}
          spacing={data.length > 10 ? 30 : 50}
          initialSpacing={10}
          hideRules={false}
          showVerticalLines={false}
          isAnimated
          animationDuration={500}
        />
      </View>
      <Text style={styles.xAxisTitle}>Date</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', paddingBottom: 10, position: 'relative' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: 40 },
  label: { color: colors.textMuted, fontSize: 10 },
  axisText: { color: colors.textMuted, fontSize: 10 },
  yAxisTitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '600', marginBottom: 8, marginLeft: 10 },
  xAxisTitle: { color: colors.textSecondary, fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
