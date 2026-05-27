/**
 * Analytics Screen — with immediate refresh and pie chart visualization.
 */
import { SpendingTrendChart } from '@src/components/charts/SpendingTrendChart';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmountCompact } from '@src/utils/currency';
import { format, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Animated, { FadeInDown } from 'react-native-reanimated';

const periods = ['This Month', 'Last Month'] as const;

export default function AnalyticsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<typeof periods[number]>('This Month');
  const [activeTab, setActiveTab] = useState<'month' | 'patterns'>('month');

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

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const doRefresh = useCallback(() => {
    const month = selectedPeriod === 'Last Month'
      ? format(subMonths(new Date(), 1), 'yyyy-MM')
      : format(new Date(), 'yyyy-MM');
    refreshAnalytics(month);
  }, [selectedPeriod, refreshAnalytics]);

  // Refresh on mount, period change, or new transactions
  useEffect(() => {
    doRefresh();
  }, [selectedPeriod, transactions.length, doRefresh]);

  // Compute cumulative spending trend (line never dips with 0-value days)
  const filteredTrend = useMemo(() => {
    const monthStr = selectedPeriod === 'Last Month'
      ? format(subMonths(new Date(), 1), 'yyyy-MM')
      : format(new Date(), 'yyyy-MM');

    const now = new Date();
    const isCurrentMonth = selectedPeriod === 'This Month';
    
    // Sum transactions per week
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0;
    
    const relevantTx = transactions.filter(t =>
      t.type === 'expense' &&
      t.date.startsWith(monthStr) &&
      new Date(t.date).getTime() <= now.getTime()
    );

    relevantTx.forEach(t => {
      const day = parseInt(t.date.substring(8, 10), 10);
      const amt = t.amount / 100;
      if (day <= 7) w1 += amt;
      else if (day <= 14) w2 += amt;
      else if (day <= 21) w3 += amt;
      else if (day <= 28) w4 += amt;
      else w5 += amt;
    });

    const result = [
      { label: 'Week 1', value: w1 },
    ];
    
    const maxDays = new Date(
      isCurrentMonth ? now.getFullYear() : subMonths(now, 1).getFullYear(),
      isCurrentMonth ? now.getMonth() + 1 : subMonths(now, 1).getMonth() + 1,
      0
    ).getDate();
    const lastDay = isCurrentMonth ? now.getDate() : maxDays;

    if (lastDay > 7) result.push({ label: 'Week 2', value: w2 });
    if (lastDay > 14) result.push({ label: 'Week 3', value: w3 });
    if (lastDay > 21) result.push({ label: 'Week 4', value: w4 });
    if (maxDays > 28 && lastDay > 28) result.push({ label: 'Week 5', value: w5 });

    return result;
  }, [transactions, selectedPeriod]);

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

  const largestTransactions = useMemo(() => {
    const monthStr = selectedPeriod === 'Last Month'
      ? format(subMonths(new Date(), 1), 'yyyy-MM')
      : format(new Date(), 'yyyy-MM');
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(monthStr))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, selectedPeriod]);

  const patternStats = useMemo(() => {
    const monthStr = selectedPeriod === 'Last Month'
      ? format(subMonths(new Date(), 1), 'yyyy-MM')
      : format(new Date(), 'yyyy-MM');
    const relevantTx = transactions.filter(t => t.type === 'expense' && t.date.startsWith(monthStr));

    const now = new Date();
    const isCurrentMonth = selectedPeriod === 'This Month';
    const refDate = isCurrentMonth ? now : subMonths(now, 1);
    const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
    const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;

    const spentDays = new Set(relevantTx.map(t => parseInt(t.date.substring(8, 10), 10)));
    const noSpendDays = lastDay - spentDays.size;

    // Build the 6x7 calendar (42 days)
    const calendarDays = [];
    const firstDayOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1).getDay(); // 0 = Sunday
    // Pad start
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push({ type: 'empty' });

    // Find max daily spend for color scaling
    const dailySpendMap = new Map<number, number>();
    relevantTx.forEach(t => {
      const d = parseInt(t.date.substring(8, 10), 10);
      dailySpendMap.set(d, (dailySpendMap.get(d) || 0) + t.amount);
    });
    let maxDailySpend = 1;
    dailySpendMap.forEach(v => { if (v > maxDailySpend) maxDailySpend = v; });

    let currentStreak = 0;
    let bestStreak = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      if (d > lastDay) {
        calendarDays.push({ type: 'future', day: d });
        currentStreak = 0;
      } else if (spentDays.has(d)) {
        calendarDays.push({ type: 'spend', day: d, amount: dailySpendMap.get(d) || 0, ratio: (dailySpendMap.get(d) || 0) / maxDailySpend });
        currentStreak = 0;
      } else {
        calendarDays.push({ type: 'nospend', day: d });
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      }
    }
    // Pad end to 42
    while (calendarDays.length < 42) calendarDays.push({ type: 'empty' });

    let weekdaySpend = 0;
    let weekendSpend = 0;
    let weekdayCount = 0;
    let weekendCount = 0;
    let recurringSpend = 0;
    let recurringCount = 0;
    let oneoffSpend = 0;
    let oneoffCount = 0;

    relevantTx.forEach(t => {
      const d = new Date(t.date);
      const day = d.getDay();
      if (day === 0 || day === 6) { weekendSpend += t.amount; weekendCount++; }
      else { weekdaySpend += t.amount; weekdayCount++; }

      if (t.isRecurring) { recurringSpend += t.amount; recurringCount++; }
      else { oneoffSpend += t.amount; oneoffCount++; }
    });

    return { noSpendDays, bestStreak, calendarDays, weekdaySpend, weekendSpend, weekdayCount, weekendCount, recurringSpend, recurringCount, oneoffSpend, oneoffCount };
  }, [transactions, selectedPeriod]);

  // Overall monthly budget limit
  const budgets = useStore((s) => s.budgets);
  const overallBudget = budgets.find(b => b.scope === 'overall' && b.period === 'monthly');
  const monthTotalLimit = overallBudget ? overallBudget.amount : null;

  const velocityIndicator = useMemo(() => {
    if (!monthlySummary) return null;
    const now = new Date();
    const isCurrentMonth = selectedPeriod === 'This Month';
    const refDate = isCurrentMonth ? now : subMonths(now, 1);
    const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
    const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
    const daysLeft = daysInMonth - daysElapsed;
    const dailyRate = monthlySummary.totalExpense / (daysElapsed || 1);
    const projectedMonthEnd = dailyRate * daysInMonth;

    let status = '';
    let statusColor: string = colors.textMuted;
    if (monthTotalLimit) {
      if (projectedMonthEnd <= monthTotalLimit) { status = 'ON TRACK'; statusColor = colors.income; }
      else if (projectedMonthEnd <= monthTotalLimit * 1.15) { status = 'AT RISK'; statusColor = colors.warning; }
      else { status = 'OVER'; statusColor = colors.expense; }
    }

    return { daysLeft, projectedMonthEnd, status, statusColor };
  }, [monthlySummary, selectedPeriod, monthTotalLimit]);

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

      {/* Main Tabs */}
      <View style={styles.mainTabsContainer}>
        <Pressable onPress={() => setActiveTab('month')} style={[styles.mainTab, activeTab === 'month' && styles.mainTabActive]}>
          <Text style={[styles.mainTabText, activeTab === 'month' && styles.mainTabTextActive]}>Summary</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('patterns')} style={[styles.mainTab, activeTab === 'patterns' && styles.mainTabActive]}>
          <Text style={[styles.mainTabText, activeTab === 'patterns' && styles.mainTabTextActive]}>Patterns</Text>
        </Pressable>
      </View>

      {activeTab === 'month' ? (
        <>
          {/* Summary Cards */}
          {monthlySummary && (
            <Animated.View entering={FadeInDown.delay(50).duration(300)} style={[styles.summaryGrid, { flexWrap: 'wrap' }]}>
              <View style={[styles.summaryCard, { width: '47%' }]}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={[styles.summaryValue, { color: colors.expense }]} numberOfLines={1}>{formatAmountCompact(monthlySummary.totalExpense)}</Text>
              </View>
              <View style={[styles.summaryCard, { width: '47%' }]}>
                <Text style={styles.summaryLabel}>Total Earned</Text>
                <Text style={[styles.summaryValue, { color: colors.income }]} numberOfLines={1}>{formatAmountCompact(monthlySummary.totalIncome)}</Text>
              </View>
              <View style={[styles.summaryCard, { width: '47%' }]}>
                <Text style={styles.summaryLabel}>Net</Text>
                <Text style={[styles.summaryValue, { color: monthlySummary.netAmount >= 0 ? colors.income : colors.expense }]} numberOfLines={1}>
                  {formatAmountCompact(monthlySummary.netAmount)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { width: '47%' }]}>
                <Text style={styles.summaryLabel}>Avg/Day</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]} numberOfLines={1}>{formatAmountCompact(monthlySummary.avgPerDay)}</Text>
              </View>
            </Animated.View>
          )}

          {/* Spending Velocity */}
          {velocityIndicator && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.velocityCard}>
              {monthTotalLimit ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '500' }}>
                    Spent {formatAmountCompact(monthlySummary!.totalExpense)} of {formatAmountCompact(monthTotalLimit)} budget
                  </Text>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, marginHorizontal: 6 }} />
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{velocityIndicator.daysLeft} days left</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '500' }}>
                    Spent {formatAmountCompact(monthlySummary!.totalExpense)}
                  </Text>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, marginHorizontal: 6 }} />
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{velocityIndicator.daysLeft} days left</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: monthTotalLimit ? colors.textSecondary : colors.textMuted }}>
                  At this rate → {formatAmountCompact(velocityIndicator.projectedMonthEnd)} by month end
                </Text>
                {monthTotalLimit && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                    <Text style={{ color: velocityIndicator.statusColor, fontSize: 10, marginRight: 4 }}>●</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: velocityIndicator.statusColor }}>{velocityIndicator.status}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Spending Trend */}
          <Animated.View entering={FadeInDown.delay(110).duration(300)}>
            <Text style={styles.sectionTitle}>Spending Trend</Text>
            {filteredTrend.length > 0 ? (
              <View style={styles.trendCard}>
                <SpendingTrendChart
                  data={filteredTrend}
                />
              </View>
            ) : (
              <Text style={styles.emptyText}>No spending data for selected period.</Text>
            )}
          </Animated.View>

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
                      <Text style={styles.catAmount} numberOfLines={1} adjustsFontSizeToFit>{formatAmountCompact(cat.total)}</Text>
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



          {/* Largest Transactions */}
          {largestTransactions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).duration(300)}>
              <Text style={styles.sectionTitle}>Largest Transactions</Text>
              <View style={styles.merchantCard}>
                {largestTransactions.map((tx, i) => (
                  <Pressable
                    key={tx.id}
                    onPress={() => router.push({ pathname: '/modals/transaction-detail', params: { id: tx.id } })}
                    style={[styles.merchantRow, i !== largestTransactions.length - 1 && styles.merchantBorder]}
                  >
                    <View style={[styles.merchantIconWrap, { backgroundColor: (tx.categoryColor ?? colors.cyan) + '20' }]}>
                      <Text style={styles.merchantIconText}>{tx.categoryIcon}</Text>
                    </View>
                    <View style={styles.merchantInfo}>
                      <Text style={styles.merchantName}>{tx.categoryName}</Text>
                      <Text style={styles.merchantCount}>{tx.date.substring(0, 10)} {tx.merchant ? `• ${tx.merchant}` : ''}</Text>
                    </View>
                    <Text style={styles.merchantTotal} numberOfLines={1}>{formatAmountCompact(tx.amount)}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}
        </>
      ) : (
        <>
          {/* Pattern Tab */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={{ marginBottom: 24 }}>
            <View style={[styles.summaryCard, { flexDirection: 'column', alignItems: 'flex-start', padding: 20 }]}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>{patternStats.noSpendDays} no-spend days</Text>
              <View style={{ width: '100%', marginTop: 16, marginBottom: 0 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {patternStats.calendarDays.map((d, i) => {
                    const totalItems = patternStats.calendarDays.length;
                    const isLastRow = i >= totalItems - 7; // last 7 items = last row
                    let bgColor: string;
                    let borderColor: string;
                    if (d.type === 'nospend') {
                      bgColor = colors.income + 'CC';
                      borderColor = colors.income;
                    } else if (d.type === 'spend') {
                      bgColor = `rgba(239, 68, 68, ${0.3 + (d.ratio! * 0.7)})`;
                      borderColor = colors.expense;
                    } else if (d.type === 'future') {
                      bgColor = colors.surface2;
                      borderColor = colors.border;
                    } else { // empty
                      bgColor = 'transparent';
                      borderColor = 'transparent';
                    }
                    return <View key={i} style={{ width: 36, height: 36, marginBottom: isLastRow ? 0 : 8, borderRadius: 6, backgroundColor: bgColor as any, borderWidth: d.type === 'empty' ? 0 : 1, borderColor }} />;
                  })}
                </View>
              </View>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Your best streak this month: {patternStats.bestStreak} days</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(70).duration(300)} style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={[styles.summaryCard, { flex: 1, marginBottom: 0, padding: 16 }]}>
              <Text style={styles.summaryLabel}>Weekdays</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]} numberOfLines={1}>{formatAmountCompact(patternStats.weekdaySpend)}</Text>
              <Text style={styles.catPct}>{formatAmountCompact(patternStats.weekdaySpend / (patternStats.weekdayCount || 1))} avg/day · {patternStats.weekdayCount} txns</Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1, marginBottom: 0, padding: 16 }]}>
              <Text style={styles.summaryLabel}>Weekends</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]} numberOfLines={1}>{formatAmountCompact(patternStats.weekendSpend)}</Text>
              <Text style={styles.catPct}>{formatAmountCompact(patternStats.weekendSpend / (patternStats.weekendCount || 1))} avg/day · {patternStats.weekendCount} txns</Text>
            </View>
          </Animated.View>
          {(() => {
            const wdayAvg = patternStats.weekdaySpend / (patternStats.weekdayCount || 1);
            const wendAvg = patternStats.weekendSpend / (patternStats.weekendCount || 1);
            if (wdayAvg > 0 && wendAvg > 0) {
              if (wendAvg > wdayAvg * 1.3) return <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: -12, marginBottom: 24 }}>You tend to spend more on weekends</Text>;
              if (wdayAvg > wendAvg * 1.3) return <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: -12, marginBottom: 24 }}>You tend to spend more on weekdays</Text>;
            }
            return null;
          })()}

          <Animated.View entering={FadeInDown.delay(90).duration(300)} style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Recurring vs One-off</Text>
            <View style={styles.merchantCard}>
              <View style={{ flexDirection: 'row', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <View style={{ backgroundColor: colors.purple, width: `${(patternStats.recurringSpend / ((patternStats.recurringSpend + patternStats.oneoffSpend) || 1)) * 100}%` }} />
                <View style={{ backgroundColor: colors.cyan, width: `${(patternStats.oneoffSpend / ((patternStats.recurringSpend + patternStats.oneoffSpend) || 1)) * 100}%` }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.purple, marginRight: 8 }} /><Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '500' }}>Recurring</Text></View>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{formatAmountCompact(patternStats.recurringSpend)} <Text style={{ color: colors.textMuted, fontWeight: '400' }}>({Math.round((patternStats.recurringSpend / ((patternStats.recurringSpend + patternStats.oneoffSpend) || 1)) * 100)}%)</Text></Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 18, marginBottom: 12 }}>{patternStats.recurringCount} txns · {formatAmountCompact(patternStats.recurringSpend / (patternStats.recurringCount || 1))} avg each</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.cyan, marginRight: 8 }} /><Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '500' }}>One-off</Text></View>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{formatAmountCompact(patternStats.oneoffSpend)} <Text style={{ color: colors.textMuted, fontWeight: '400' }}>({Math.round((patternStats.oneoffSpend / ((patternStats.recurringSpend + patternStats.oneoffSpend) || 1)) * 100)}%)</Text></Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 18 }}>{patternStats.oneoffCount} txns · {formatAmountCompact(patternStats.oneoffSpend / (patternStats.oneoffCount || 1))} avg each</Text>
            </View>
          </Animated.View>

          {/* Mood Correlation */}
          {moodCorrelation.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>Mood vs Spending</Text>
              <View style={styles.moodGrid}>
                {moodCorrelation.map((m) => (
                  <View key={m.moodId} style={styles.moodCard}>
                    <Text style={styles.moodEmoji}>{m.moodEmoji}</Text>
                    <Text style={styles.moodLabel}>{m.moodLabel}</Text>
                    <Text style={styles.moodAvg} numberOfLines={1} adjustsFontSizeToFit>{formatAmountCompact(m.avgSpend)}</Text>
                    <Text style={styles.moodCount}>{m.transactionCount} txns</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Impulse Stats */}
          {impulseStats && (
            <Animated.View entering={FadeInDown.delay(110).duration(300)} style={{ marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>Impulse vs Planned</Text>
              <View style={styles.impulseCard}>
                <View style={styles.impulseRow}>
                  <View style={styles.impulseItem}>
                    <Text style={styles.impulseLabel}>Impulse</Text>
                    <Text style={[styles.impulseAmount, { color: colors.warning }]} numberOfLines={1} adjustsFontSizeToFit>{formatAmountCompact(impulseStats.impulseTotal)}</Text>
                    <Text style={styles.impulseCount}>{impulseStats.impulseCount} txns</Text>
                  </View>
                  <View style={styles.velocitySep} />
                  <View style={styles.impulseItem}>
                    <Text style={styles.impulseLabel}>Planned</Text>
                    <Text style={[styles.impulseAmount, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>{formatAmountCompact(impulseStats.plannedTotal)}</Text>
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

          {/* Top Merchants List */}
          {topMerchants && topMerchants.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionTitle}>Top Merchants</Text>
              <View style={styles.merchantCard}>
                {topMerchants.map((m, i) => (
                  <View key={m.merchant} style={[styles.merchantRow, i !== topMerchants.length - 1 && styles.merchantBorder]}>
                    <View style={[styles.merchantIconWrap, { backgroundColor: (m.categoryColor || colors.surface2) + '40' }]}>
                      <Text style={[styles.merchantIconText, { color: m.categoryColor || colors.textPrimary }]}>#{i + 1}</Text>
                    </View>
                    <View style={styles.merchantInfo}>
                      <Text style={[styles.merchantName, { color: m.categoryColor || colors.textPrimary }]}>{m.merchant}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        {m.categoryName && (
                          <>
                            <Text style={{ fontSize: 12, color: m.categoryColor || colors.textMuted, fontWeight: '500' }}>{m.categoryName}</Text>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, marginHorizontal: 6 }} />
                          </>
                        )}
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>{m.count} transactions</Text>
                      </View>
                    </View>
                    <Text style={styles.merchantTotal} numberOfLines={1}>{formatAmountCompact(m.total)}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </>
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

  catScroll: { gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  filterText: { fontSize: 13, color: colors.textMuted },
  filterTextActive: { color: colors.cyan, fontWeight: '600' },

  mainTabsContainer: { flexDirection: 'row', backgroundColor: colors.surface1, borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  mainTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  mainTabActive: { backgroundColor: colors.surface3 },
  mainTabText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  mainTabTextActive: { color: colors.textPrimary },

  // Grid: 2 equal columns with consistent gap, no extra right padding on column 2
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, minWidth: '45%', backgroundColor: colors.surface1, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },

  velocityCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  velocityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  velocityItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  velocitySep: { width: 1, height: 30, backgroundColor: colors.border },
  velocityLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  velocityValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular', textAlign: 'center' },

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

  // Mood grid: flow left-to-right, wrap naturally
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 0 },
  moodCard: { backgroundColor: colors.surface1, borderRadius: 14, padding: 14, width: '31%', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  moodEmoji: { fontSize: 28, marginBottom: 6 },
  moodLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  moodAvg: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular' },
  moodCount: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  trendCard: { backgroundColor: colors.surface1, borderRadius: 16, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8, marginBottom: 24, borderWidth: 1, borderColor: colors.border },

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
