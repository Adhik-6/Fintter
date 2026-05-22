/**
 * Analytics Screen — with immediate refresh and pie chart visualization.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';
import { useRouter } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { SpendingTrendChart } from '@src/components/charts/SpendingTrendChart';
import { format, subMonths } from 'date-fns';

const periods = ['This Month', 'Last Month'] as const;

export default function AnalyticsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<typeof periods[number]>('This Month');
  const monthlySummary = useStore((s) => s.monthlySummary);
  const categoryBreakdown = useStore((s) => s.categoryBreakdown);
  const spendingVelocity = useStore((s) => s.spendingVelocity);
  const moodCorrelation = useStore((s) => s.moodCorrelation);
  const spendingTrend = useStore((s) => s.spendingTrend);
  const heatmapData = useStore((s) => s.heatmapData);
  const topMerchants = useStore((s) => s.topMerchants);
  const impulseStats = useStore((s) => s.impulseStats);
  const refreshAnalytics = useStore((s) => s.refreshAnalytics);
  const isLoading = useStore((s) => s.isLoadingAnalytics);
  // Listen to transaction changes to trigger refresh
  const transactions = useStore((s) => s.transactions);

  const doRefresh = useCallback(() => {
    const month = selectedPeriod === 'Last Month'
      ? format(subMonths(new Date(), 1), 'yyyy-MM')
      : format(new Date(), 'yyyy-MM');
    refreshAnalytics(month);
  }, [selectedPeriod, refreshAnalytics]);

  // Refresh on mount, period change, or new transactions
  useEffect(() => {
    doRefresh();
  }, [selectedPeriod, transactions.length]);

  const maxCatTotal = categoryBreakdown.length > 0 ? categoryBreakdown[0].total : 1;

  const [focusedSlice, setFocusedSlice] = useState<number | null>(0);

  // Pie chart data from category breakdown
  const pieData = useMemo(() => {
    return categoryBreakdown.slice(0, 6).map((cat, i) => ({
      value: cat.total,
      color: cat.categoryColor || colors.cyan,
      text: `${cat.percentage}%`,
      label: cat.categoryName,
      focused: focusedSlice === i,
    }));
  }, [categoryBreakdown, focusedSlice]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.title}>Analytics</Text>
      </Animated.View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {periods.map((p) => (
          <Pressable key={p} onPress={() => setSelectedPeriod(p)} style={[styles.periodChip, selectedPeriod === p && styles.periodActive]}>
            <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      {/* Summary Cards */}
      {monthlySummary && (
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>{formatAmount(monthlySummary.totalExpense)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Earned</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>{formatAmount(monthlySummary.totalIncome)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, { color: monthlySummary.netAmount >= 0 ? colors.income : colors.expense }]}>
              {formatAmount(monthlySummary.netAmount)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg/Day</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatAmount(monthlySummary.avgPerDay)}</Text>
          </View>
        </Animated.View>
      )}

      {/* Spending Velocity */}
      {spendingVelocity && (
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.velocityCard}>
          <Text style={styles.sectionTitle}>Spending Velocity</Text>
          <View style={styles.velocityRow}>
            <View style={styles.velocityItem}>
              <Text style={styles.velocityLabel}>Today</Text>
              <Text style={styles.velocityValue}>{formatAmount(spendingVelocity.todaySpent)}</Text>
            </View>
            <View style={styles.velocitySep} />
            <View style={styles.velocityItem}>
              <Text style={styles.velocityLabel}>Yesterday</Text>
              <Text style={styles.velocityValue}>{formatAmount(spendingVelocity.yesterdaySpent)}</Text>
            </View>
            <View style={styles.velocitySep} />
            <View style={styles.velocityItem}>
              <Text style={styles.velocityLabel}>7d Avg</Text>
              <Text style={styles.velocityValue}>{formatAmount(spendingVelocity.weekAvg)}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Spending Trend */}
      {spendingTrend && spendingTrend.length > 0 && (
        <Animated.View entering={FadeInDown.delay(110).duration(300)}>
          <Text style={styles.sectionTitle}>Spending Trend</Text>
          <View style={styles.trendCard}>
            <SpendingTrendChart 
              data={spendingTrend} 
              onPointPress={(date) => router.push({ pathname: '/(tabs)/history', params: { date } })}
            />
          </View>
        </Animated.View>
      )}

      {/* Pie Chart — Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Animated.View entering={FadeInDown.delay(130).duration(300)} style={styles.pieCard}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.pieWrap}>
            <PieChart
              data={pieData}
              donut
              radius={90}
              innerRadius={55}
              innerCircleColor={colors.surface1}
              centerLabelComponent={() => {
                const focused = focusedSlice !== null ? pieData[focusedSlice] : pieData[0];
                return (
                  <View style={styles.pieCenterLabel}>
                    <Text style={styles.pieCenterPct}>{focused?.text ?? ''}</Text>
                    <Text style={styles.pieCenterName} numberOfLines={1}>{focused?.label ?? ''}</Text>
                  </View>
                );
              }}
              onPress={(_: any, i: number) => setFocusedSlice(i === focusedSlice ? null : i)}
              focusOnPress
              extraRadius={10}
              strokeColor={colors.surface0}
              strokeWidth={2}
            />
          </View>
          {/* Legend */}
          <View style={styles.pieLegend}>
            {pieData.map((item, i) => (
              <Pressable key={i} onPress={() => setFocusedSlice(i === focusedSlice ? null : i)} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.legendPct}>{item.text}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Top Categories Bar Chart */}
      <Animated.View entering={FadeInDown.delay(150).duration(300)}>
        <Text style={styles.sectionTitle}>Top Categories</Text>
        {categoryBreakdown.length === 0 ? (
          <Text style={styles.emptyText}>No spending data yet</Text>
        ) : (
          categoryBreakdown.map((cat, i) => (
            <View key={cat.categoryId} style={styles.catRow}>
              <Text style={styles.catIcon}>{cat.categoryIcon}</Text>
              <View style={styles.catInfo}>
                <View style={styles.catHeader}>
                  <Text style={styles.catName}>{cat.categoryName}</Text>
                  <Text style={styles.catAmount}>{formatAmount(cat.total)}</Text>
                </View>
                <View style={styles.catBar}>
                  <Animated.View
                    entering={FadeInDown.delay(200 + i * 50).duration(400)}
                    style={[styles.catBarFill, { width: `${(cat.total / maxCatTotal) * 100}%`, backgroundColor: cat.categoryColor }]}
                  />
                </View>
                <Text style={styles.catPct}>{cat.percentage}% • {cat.transactionCount} transactions</Text>
              </View>
            </View>
          ))
        )}
      </Animated.View>

      {/* Top Merchants List */}
      {topMerchants && topMerchants.length > 0 && (
        <Animated.View entering={FadeInDown.delay(170).duration(300)}>
          <Text style={styles.sectionTitle}>Top Merchants</Text>
          <View style={styles.merchantCard}>
            {topMerchants.map((m, i) => (
              <View key={m.merchant} style={[styles.merchantRow, i !== topMerchants.length - 1 && styles.merchantBorder]}>
                <View style={styles.merchantIconWrap}>
                  <Text style={styles.merchantIconText}>#{i + 1}</Text>
                </View>
                <View style={styles.merchantInfo}>
                  <Text style={styles.merchantName}>{m.merchant}</Text>
                  <Text style={styles.merchantCount}>{m.count} transactions</Text>
                </View>
                <Text style={styles.merchantTotal}>{formatAmount(m.total)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Mood Correlation */}
      {moodCorrelation.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={{ marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>Mood vs Spending</Text>
          <View style={styles.moodGrid}>
            {moodCorrelation.map((m) => (
              <View key={m.moodId} style={styles.moodCard}>
                <Text style={styles.moodEmoji}>{m.moodEmoji}</Text>
                <Text style={styles.moodLabel}>{m.moodLabel}</Text>
                <Text style={styles.moodAvg} numberOfLines={1} adjustsFontSizeToFit>{formatAmount(m.avgSpend)}</Text>
                <Text style={styles.moodCount}>{m.transactionCount} txns</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Impulse Stats */}
      {impulseStats && (
        <Animated.View entering={FadeInDown.delay(220).duration(300)}>
          <Text style={styles.sectionTitle}>Impulse vs Planned</Text>
          <View style={styles.impulseCard}>
            <View style={styles.impulseRow}>
              <View style={styles.impulseItem}>
                <Text style={styles.impulseLabel}>Impulse</Text>
                <Text style={[styles.impulseAmount, { color: colors.warning }]}>{formatAmount(impulseStats.impulseTotal)}</Text>
                <Text style={styles.impulseCount}>{impulseStats.impulseCount} txns</Text>
              </View>
              <View style={styles.velocitySep} />
              <View style={styles.impulseItem}>
                <Text style={styles.impulseLabel}>Planned</Text>
                <Text style={[styles.impulseAmount, { color: colors.income }]}>{formatAmount(impulseStats.plannedTotal)}</Text>
                <Text style={styles.impulseCount}>{impulseStats.plannedCount} txns</Text>
              </View>
            </View>
            
            {/* Simple visual bar */}
            {impulseStats.impulseTotal > 0 || impulseStats.plannedTotal > 0 ? (
              <View style={styles.impulseBarWrap}>
                <View style={[styles.impulseBarFill, { backgroundColor: colors.warning, width: `${(impulseStats.impulseTotal / (impulseStats.impulseTotal + impulseStats.plannedTotal)) * 100}%` }]} />
                <View style={[styles.impulseBarFill, { backgroundColor: colors.income, width: `${(impulseStats.plannedTotal / (impulseStats.impulseTotal + impulseStats.plannedTotal)) * 100}%` }]} />
              </View>
            ) : null}
          </View>
        </Animated.View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },

  periodRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  periodChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  periodActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  periodText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  periodTextActive: { color: colors.cyan },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  summaryCard: { width: '47%', backgroundColor: colors.surface1, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },

  velocityCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  velocityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  velocityItem: { flex: 1, alignItems: 'center' },
  velocitySep: { width: 1, height: 30, backgroundColor: colors.border },
  velocityLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  velocityValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular' },

  // Pie chart
  pieCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  pieWrap: { alignItems: 'center', marginVertical: 16 },
  pieCenterLabel: { alignItems: 'center', justifyContent: 'center' },
  pieCenterPct: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pieCenterName: { fontSize: 10, color: colors.textMuted, maxWidth: 80, textAlign: 'center', marginTop: 2 },
  pieLegend: { gap: 8, marginTop: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  legendPct: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 14 },
  emptyText: { color: colors.textMuted, fontSize: 14, marginBottom: 20 },

  catRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  catIcon: { fontSize: 24, marginRight: 12, marginTop: 2 },
  catInfo: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  catAmount: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', fontFamily: 'SpaceMono-Regular' },
  catBar: { height: 6, backgroundColor: colors.surface3, borderRadius: 3, marginBottom: 4 },
  catBarFill: { height: 6, borderRadius: 3 },
  catPct: { fontSize: 11, color: colors.textMuted },

  moodGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  moodCard: { backgroundColor: colors.surface1, borderRadius: 14, padding: 14, width: '31%', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  moodEmoji: { fontSize: 28, marginBottom: 6 },
  moodLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  moodAvg: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular' },
  moodCount: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  
  trendCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  
  merchantCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  merchantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  merchantBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  merchantIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  merchantIconText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  merchantCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  merchantTotal: { fontSize: 15, fontWeight: '700', fontFamily: 'SpaceMono-Regular', color: colors.textPrimary },

  impulseCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  impulseRow: { flexDirection: 'row', marginBottom: 16 },
  impulseItem: { flex: 1, alignItems: 'center' },
  impulseLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  impulseAmount: { fontSize: 16, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },
  impulseCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  impulseBarWrap: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', backgroundColor: colors.surface3 },
  impulseBarFill: { height: '100%' },
});
