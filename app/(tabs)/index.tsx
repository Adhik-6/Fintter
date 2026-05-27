/**
 * Dashboard Screen — the main home screen.
 */
import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount, formatAmountCompact } from '@src/utils/currency';
import { getGreeting, formatTransactionDate, formatTime } from '@src/utils/date';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const wallets = useStore((s) => s.wallets);
  const activeWalletId = useStore((s) => s.activeWalletId);
  const setActiveWallet = useStore((s) => s.setActiveWallet);
  const allTransactions = useStore((s) => s.transactions);
  const fetchTransactions = useStore((s) => s.fetchTransactions);
  const fetchWallets = useStore((s) => s.fetchWallets);
  const budgets = useStore((s) => s.budgets);
  const budgetProgress = useStore((s) => s.budgetProgress);
  const fetchBudgets = useStore((s) => s.fetchBudgets);
  const computeBudgetProgress = useStore((s) => s.computeBudgetProgress);

  // Filter transactions by active wallet
  const transactions = activeWalletId
    ? allTransactions.filter((t) => t.walletId === activeWalletId)
    : allTransactions;

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchTransactions({ limit: 500 }),
      fetchWallets(),
      fetchBudgets(),
    ]);
    // Compute after budgets load
    setTimeout(() => computeBudgetProgress(), 100);
  }, [fetchTransactions, fetchWallets, fetchBudgets, computeBudgetProgress]);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-hide balance when navigating away; reload data on focus so income/expense is always fresh
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        setBalanceVisible(false);
      };
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalBalance = activeWalletId
    ? (wallets.find((w) => w.id === activeWalletId)?.balance ?? 0)
    : wallets.reduce((sum, w) => sum + w.balance, 0);
  const activeWallet = wallets.find((w) => w.id === activeWalletId);

  // Today's totals — parse ISO to get local date before comparing to avoid UTC vs local timezone mismatch
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isTodayTx = (dateStr: string) => {
    if (dateStr.length === 10) return dateStr === todayStr;
    try {
      return format(parseISO(dateStr), 'yyyy-MM-dd') === todayStr;
    } catch {
      return dateStr.startsWith(todayStr);
    }
  };
  const todayExpenses = transactions
    .filter((t) => t.type === 'expense' && isTodayTx(t.date))
    .reduce((sum, t) => sum + t.amount, 0);
  const todayIncome = transactions
    .filter((t) => t.type === 'income' && isTodayTx(t.date))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      >
        {/* Greeting Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, dd MMMM')}</Text>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Pressable onPress={() => setBalanceVisible(!balanceVisible)} style={styles.balanceCard}>
            <View style={styles.balanceGlow} />
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {balanceVisible ? formatAmount(totalBalance) : '••••••'}
            </Text>
            <Text style={styles.balanceHint}>
              {balanceVisible ? 'Tap to hide' : 'Tap to reveal'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Wallet Selector */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
            <Pressable
              onPress={() => setActiveWallet(null)}
              style={[styles.walletChip, !activeWalletId && styles.walletChipActive]}
            >
              <Text style={styles.walletChipIcon}>🌐</Text>
              <Text style={[styles.walletChipText, !activeWalletId && styles.walletChipTextActive]}>All</Text>
            </Pressable>
            {wallets.map((wallet) => (
              <Pressable
                key={wallet.id}
                onPress={() => setActiveWallet(wallet.id)}
                style={[styles.walletChip, activeWalletId === wallet.id && styles.walletChipActive]}
              >
                <Text style={styles.walletChipIcon}>
                  {wallet.name === 'Bank Account' ? '🏦' : (wallet.icon ?? '💳')}
                </Text>
                <Text style={[styles.walletChipText, activeWalletId === wallet.id && styles.walletChipTextActive]}>
                  {wallet.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Today's Summary */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: colors.income }]}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]} numberOfLines={1}>
              {formatAmountCompact(todayIncome)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: colors.expense }]}>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryAmount, { color: colors.expense }]} numberOfLines={1}>
              {formatAmountCompact(todayExpenses)}
            </Text>
          </View>
        </Animated.View>

        {/* Budget Health Row */}
        {budgets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.sectionTitle}>Budget Health</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.budgetScroll}>
              {budgets.map((budget) => {
                const progress = budgetProgress[budget.id];
                const pct = progress?.percentUsed ?? 0;
                const statusColor = pct >= 90 ? colors.expense : pct >= 60 ? colors.warning : colors.income;
                return (
                  <View key={budget.id} style={styles.budgetChip}>
                    <Text style={styles.budgetChipIcon}>{budget.categoryIcon ?? '🎯'}</Text>
                    <Text style={styles.budgetChipName} numberOfLines={1}>{budget.name}</Text>
                    <View style={styles.budgetBar}>
                      <View style={[styles.budgetBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: statusColor }]} />
                    </View>
                    <Text style={[styles.budgetChipPct, { color: statusColor }]}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Category Wise Spending Button */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={{ marginBottom: 24 }}>
          <Pressable 
            style={{ backgroundColor: colors.surface1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            onPress={() => router.push('/modals/category-spending')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 24 }}>📊</Text>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>Category Wise Spending</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Analyze your expenses by category</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((tx, idx) => (
              <Animated.View key={tx.id} entering={FadeInDown.delay(300 + idx * 50).duration(300)}>
                <Pressable
                  style={styles.txCard}
                  onPress={() => router.push({ pathname: '/modals/transaction-detail', params: { id: tx.id } })}
                >
                  <View style={{ position: 'relative', marginRight: 12 }}>
                    <View style={[styles.txIconWrap, { backgroundColor: tx.categoryColor + '20' }]}>
                      <Text style={styles.txIcon}>{tx.categoryIcon}</Text>
                    </View>
                    {tx.isRecurring === 1 && (
                      <View style={styles.txRecurringDot}>
                        <Ionicons name="repeat" size={9} color={colors.black} />
                      </View>
                    )}
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName} numberOfLines={1}>
                      {tx.merchant ?? tx.note ?? tx.categoryName}
                    </Text>
                    <Text style={styles.txMeta}>
                      {tx.categoryName} • {formatTime(tx.date)}
                    </Text>
                  </View>
                  <View style={styles.txAmountWrap}>
                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.income : tx.type === 'transfer' ? colors.transfer : colors.expense }]} numberOfLines={1}>
                      {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatAmountCompact(tx.amount)}
                    </Text>
                    {tx.moodEmoji && <Text style={styles.txMood}>{tx.moodEmoji}</Text>}
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/modals/quick-add')}
      >
        <View style={styles.fabGlow} />
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },

  // Header
  header: { marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  // Balance Card
  balanceCard: {
    backgroundColor: colors.surface1,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cyanGlow,
  },
  balanceLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '700', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular' },
  balanceHint: { fontSize: 11, color: colors.textMuted, marginTop: 8 },

  // Wallet Selector
  walletScroll: { marginBottom: 20 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletChipIcon: { fontSize: 16, marginRight: 6 },
  walletChipText: { fontSize: 13, color: colors.textSecondary },
  walletChipTextActive: { color: colors.cyan, fontWeight: '600' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
  },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  summaryAmount: { fontSize: 20, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },

  // Budget Health
  budgetScroll: { marginBottom: 24 },
  budgetChip: {
    backgroundColor: colors.surface1,
    borderRadius: 14,
    padding: 14,
    width: 130,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetChipIcon: { fontSize: 20, marginBottom: 6 },
  budgetChipName: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  budgetBar: { height: 4, backgroundColor: colors.surface3, borderRadius: 2, marginBottom: 6 },
  budgetBarFill: { height: 4, borderRadius: 2 },
  budgetChipPct: { fontSize: 13, fontWeight: '700' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 14 },
  seeAll: { fontSize: 13, color: colors.cyan, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: colors.textMuted },

  // Transaction Card
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txIcon: { fontSize: 20 },
  txRecurringDot: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.surface0 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  txMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txAmountWrap: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },
  txMood: { fontSize: 14, marginTop: 2 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  fabGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  fabIcon: { fontSize: 30, color: colors.black, fontWeight: '700' },
});
