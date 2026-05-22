/**
 * SpendingHeatmap — A 7-column calendar grid showing spending intensity.
 */
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@src/theme';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';

interface SpendingHeatmapProps {
  data: Record<string, number>; // date string 'YYYY-MM-DD' -> amount in paise
  month: Date; // A date in the target month
}

export function SpendingHeatmap({ data, month }: SpendingHeatmapProps) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  
  // Get start day offset (0 = Sunday, 1 = Monday, etc.)
  const startOffset = getDay(start);
  
  // Calculate max spend for intensity scaling
  const values = Object.values(data);
  const maxSpend = values.length > 0 ? Math.max(...values) : 1;
  
  // Generate empty cells for offset
  const blanks = Array.from({ length: startOffset }).map((_, i) => (
    <View key={`blank-${i}`} style={styles.cellEmpty} />
  ));
  
  const dayCells = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const amount = data[dateStr] || 0;
    
    // Calculate intensity (0 to 1)
    const intensity = amount > 0 ? 0.2 + (amount / maxSpend) * 0.8 : 0;
    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    
    return (
      <View key={dateStr} style={[
        styles.cell,
        amount > 0 && { backgroundColor: colors.cyan },
        amount > 0 && { opacity: intensity },
        isToday && styles.cellToday,
      ]} />
    );
  });
  
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {weekDays.map((d, i) => (
          <Text key={`wd-${i}`} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {blanks}
        {dayCells}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.surface1, // To act as margin between cells but keeping width exact
    backgroundColor: colors.surface2,
    borderRadius: 6,
  },
  cellToday: {
    borderColor: colors.textPrimary,
  }
});
