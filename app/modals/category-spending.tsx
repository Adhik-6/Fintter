/**
 * Category Spending Modal
 * Shows a bar chart for past 1 year of a specific category and its transactions.
 */
import { Ionicons } from '@expo/vector-icons';
import { endOfMonth, format, isAfter, isBefore, startOfMonth, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount, formatAmountCompact } from '@src/utils/currency';

function formatTime(isoStr: string) {
  try {
    return format(new Date(isoStr), 'h:mm a');
  } catch {
    return '';
  }
}

export default function CategorySpendingScreen() {
  const router = useRouter();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    expenseCategories.length > 0 ? expenseCategories[0].id : null
  );

  const selectedCategory = expenseCategories.find(c => c.id === selectedCategoryId);

  // Timeframes
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const oneYearAgoStart = startOfMonth(subMonths(now, 11)); // 12 months including current

  const { thisMonthTotal, chartData, filteredTransactions, pieData, merchantData, avgPerTx, txCount, bestMonth, worstMonth } = useMemo(() => {
    let monthTotal = 0;
    const pastYearTx: typeof transactions = [];

    // Initialize 12 months map for chart
    const monthMap = new Map<string, number>();
    const monthLabels = new Map<string, string>();

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'yyyy-MM');
      monthMap.set(key, 0);
      monthLabels.set(key, format(d, 'MMM'));
    }

    const merchantMap = new Map<string, number>();

    if (selectedCategoryId) {
      transactions.forEach((tx) => {
        if (tx.type !== 'expense' || tx.categoryId !== selectedCategoryId) return;

        const txDate = new Date(tx.date);

        // Current Month Sum
        if (!isBefore(txDate, currentMonthStart) && !isAfter(txDate, currentMonthEnd)) {
          monthTotal += tx.amount;
        }

        // Past 1 Year
        if (!isBefore(txDate, oneYearAgoStart) && !isAfter(txDate, currentMonthEnd)) {
          pastYearTx.push(tx);
          const mKey = format(txDate, 'yyyy-MM');
          if (monthMap.has(mKey)) {
            monthMap.set(mKey, (monthMap.get(mKey) || 0) + tx.amount);
          }

          const merchantName = (tx.merchant && tx.merchant.trim() !== '') ? tx.merchant.trim() : 'Others';
          merchantMap.set(merchantName, (merchantMap.get(merchantName) || 0) + tx.amount);
        }
      });
    }

    const cData = Array.from(monthMap.entries()).map(([k, v]) => ({
      value: v / 100, // For display
      label: monthLabels.get(k) || '',
      frontColor: v > 0 ? (selectedCategory?.color || colors.cyan) : colors.surface2,
    }));

    pastYearTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalMerchantSpend = Array.from(merchantMap.values()).reduce((sum, v) => sum + v, 0);
    const merchantData = Array.from(merchantMap.entries())
      .map(([m, val]) => {
        const pct = totalMerchantSpend > 0 ? (val / totalMerchantSpend) * 100 : 0;
        return { name: m, amount: val, percentage: pct.toFixed(1) };
      })
      .sort((a, b) => b.amount - a.amount);

    const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    const pieData = merchantData.map((m, i) => ({
      value: m.amount,
      color: PIE_COLORS[i % PIE_COLORS.length],
      text: `${m.percentage}%`,
      label: m.name
    }));

    const pastYearTotal = pastYearTx.reduce((sum, t) => sum + t.amount, 0);
    const avgPerTx = pastYearTx.length > 0 ? pastYearTotal / pastYearTx.length : 0;
    const txCount = pastYearTx.length;

    // Best and Worst Month
    let bestMonth = { label: '', value: Infinity };
    let worstMonth = { label: '', value: -1 };

    Array.from(monthMap.entries()).forEach(([k, v]) => {
      if (v > worstMonth.value) { worstMonth = { label: monthLabels.get(k) || '', value: v }; }
      if (v > 0 && v < bestMonth.value) { bestMonth = { label: monthLabels.get(k) || '', value: v }; }
    });
    if (bestMonth.value === Infinity) bestMonth.value = 0; // fallback if no spend

    return {
      thisMonthTotal: monthTotal,
      chartData: cData,
      filteredTransactions: pastYearTx,
      pieData,
      merchantData,
      avgPerTx,
      txCount,
      bestMonth,
      worstMonth
    };
  }, [transactions, selectedCategoryId, selectedCategory]);

  const [showAllMerchants, setShowAllMerchants] = useState(false);
  const [focusedSlice, setFocusedSlice] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Category Spending</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {expenseCategories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              style={[
                styles.filterChip,
                selectedCategoryId === cat.id && [styles.filterChipActive, { borderColor: cat.color || colors.cyan }]
              ]}
            >
              <Text style={styles.filterChipIcon}>{cat.icon}</Text>
              <Text style={[styles.filterText, selectedCategoryId === cat.id && { color: cat.color || colors.cyan }]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedCategoryId ? (
          <Text style={styles.emptyText}>Please select a category</Text>
        ) : (
          <Animated.View entering={FadeInDown.duration(300)}>

            {/* Current Month Summary */}
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: (selectedCategory?.color || colors.cyan) + '20' }]}>
                <Text style={{ fontSize: 32 }}>{selectedCategory?.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>This Month</Text>
                <Text style={[styles.summaryAmount, { color: selectedCategory?.color || colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(thisMonthTotal)}
                </Text>
                {txCount > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>Avg per transaction: {formatAmountCompact(avgPerTx)}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{txCount} transactions this period</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Best and Worst Month */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>

              {/* Best Month */}
              <View style={{
                flex: 1,
                backgroundColor: colors.surface1,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                borderTopWidth: 3,
                borderTopColor: colors.income,
                overflow: 'hidden',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Text style={{ fontSize: 16 }}>📉</Text>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                    color: colors.income,
                    textTransform: 'uppercase',
                  }}>
                    Best Month
                  </Text>
                </View>

                {bestMonth.value > 0 ? (
                  <>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: colors.textPrimary,
                        lineHeight: 28,
                        fontVariant: ['tabular-nums'],
                      }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      {formatAmountCompact(bestMonth.value)}
                    </Text>
                    <View style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {bestMonth.label}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 }}>
                    Not enough data yet
                  </Text>
                )}
              </View>

              {/* Worst Month */}
              <View style={{
                flex: 1,
                backgroundColor: colors.surface1,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                borderTopWidth: 3,
                borderTopColor: colors.expense,
                overflow: 'hidden',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Text style={{ fontSize: 16 }}>📈</Text>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                    color: colors.expense,
                    textTransform: 'uppercase',
                  }}>
                    Worst Month
                  </Text>
                </View>

                {worstMonth.value > 0 ? (
                  <>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: colors.textPrimary,
                        lineHeight: 28,
                        fontVariant: ['tabular-nums'],
                      }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      {formatAmountCompact(worstMonth.value)}
                    </Text>
                    <View style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {worstMonth.label}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 }}>
                    Not enough data yet
                  </Text>
                )}
              </View>

            </View>

            {/* 1 Year Bar Chart */}
            <Text style={styles.sectionTitle}>Past 12 Months</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={chartData}
                height={160}
                width={280}
                barWidth={16}
                spacing={12}
                initialSpacing={5}
                noOfSections={4}
                barBorderRadius={4}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                rulesColor={colors.surface2}
                rulesType="solid"
                isAnimated
                scrollToEnd
                renderTooltip={(item: any) => {
                  return (
                    <View style={{ marginBottom: 10, backgroundColor: colors.surface0, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>{formatAmountCompact(item.value * 100)}</Text>
                    </View>
                  );
                }}
              />
            </View>

            {/* Merchant Pie Chart */}
            {pieData.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Merchants Breakdown</Text>
                <View style={styles.pieCard}>
                  <View style={styles.pieWrap}>
                    <PieChart
                      data={pieData.map((d, i) => ({ ...d, focused: i === focusedSlice }))}
                      donut
                      radius={80}
                      innerRadius={45}
                      innerCircleColor={colors.surface1}
                      strokeColor={colors.surface0}
                      strokeWidth={2}
                      focusOnPress
                      onPress={(item: any, index: number) => {
                        setFocusedSlice(prev => prev === index ? null : index);
                      }}
                      centerLabelComponent={() => {
                        if (focusedSlice === null || !pieData[focusedSlice]) return null;
                        const focusedItem = pieData[focusedSlice];
                        return (
                          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, color: focusedItem.color, fontWeight: 'bold' }}>{focusedItem.text}</Text>
                            <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>{focusedItem.label}</Text>
                          </View>
                        );
                      }}
                    />
                  </View>
                  <View style={styles.pieLegend}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>Highest Spend Breakdown</Text>
                    {(showAllMerchants ? merchantData : merchantData.slice(0, 5)).map((item, i) => (
                      <View key={i} style={styles.legendRow}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pieData[i]?.color || colors.surface2, marginRight: 8 }} />
                        <Text style={{ fontSize: 13, color: colors.textMuted, width: 24 }}>#{i + 1}</Text>
                        <Text style={[styles.legendLabel, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.legendPct, { color: colors.textPrimary, fontWeight: '500', marginRight: 4 }]} numberOfLines={1}>{formatAmountCompact(item.amount)}</Text>
                        <Text style={[styles.legendPct, { width: 50, textAlign: 'right' }]} numberOfLines={1}>({item.percentage}%)</Text>
                      </View>
                    ))}
                    {merchantData.length > 5 && (
                      <Pressable onPress={() => setShowAllMerchants(!showAllMerchants)} style={{ marginTop: 8, alignSelf: 'center' }}>
                        <Text style={{ color: colors.cyan, fontSize: 13, fontWeight: '600' }}>{showAllMerchants ? 'Show Less' : 'Show More'}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Transactions List */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Transactions</Text>
            {filteredTransactions.length === 0 ? (
              <Text style={styles.emptyText}>No transactions found for this category.</Text>
            ) : (
              filteredTransactions.map((tx, idx) => (
                <Pressable
                  key={tx.id}
                  style={styles.txCard}
                  onPress={() => router.push({ pathname: '/modals/transaction-detail', params: { id: tx.id } })}
                >
                  <View style={[styles.txIconWrap, { backgroundColor: (tx.categoryColor || colors.cyan) + '20' }]}>
                    <Text style={styles.txIcon}>{tx.categoryIcon}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName} numberOfLines={1}>
                      {tx.merchant ?? tx.note ?? tx.categoryName}
                    </Text>
                    <Text style={styles.txMeta}>
                      {format(new Date(tx.date), 'dd MMM yyyy')} • {formatTime(tx.date)}
                    </Text>
                  </View>
                  <View style={styles.txAmountWrap}>
                    <Text style={[styles.txAmount, { color: colors.expense }]} numberOfLines={1}>
                      -{formatAmountCompact(tx.amount)}
                    </Text>
                    {tx.moodEmoji && <Text style={styles.txMood}>{tx.moodEmoji}</Text>}
                  </View>
                </Pressable>
              ))
            )}

          </Animated.View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textPrimary },

  filterContainer: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface0 },
  catScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.surface1 },
  filterChipIcon: { fontSize: 14, marginRight: 6 },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  content: { padding: 20 },

  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  summaryIconWrap: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  summaryLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '500', marginBottom: 4 },
  summaryAmount: { fontSize: 28, fontWeight: '700', fontFamily: 'SpaceMono-Bold' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },

  chartCard: { backgroundColor: colors.surface1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', paddingBottom: 24 },

  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },

  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  txIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txIcon: { fontSize: 22 },
  txInfo: { flex: 1, marginRight: 12 },
  txName: { fontSize: 16, color: colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  txMeta: { fontSize: 12, color: colors.textMuted },
  txAmountWrap: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },
  txMood: { fontSize: 14, marginTop: 4 },

  pieCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  pieWrap: { alignItems: 'center', marginBottom: 20 },
  pieLegend: { gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  legendLabel: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  legendPct: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
});
