/**
 * Transaction History — timeline grouped by day.
 */
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';
import { formatTransactionDate, formatTime } from '@src/utils/date';
import type { TransactionWithDetails, TransactionType } from '@src/features/transactions/types';

type ListItem = { type: 'header'; date: string } | { type: 'transaction'; data: TransactionWithDetails };

export default function HistoryScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | null>(null);
  const transactions = useStore((s) => s.transactions);
  const fetchTransactions = useStore((s) => s.fetchTransactions);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  useEffect(() => { fetchTransactions({ limit: 100 }); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions({ limit: 100, type: filterType ?? undefined });
    setRefreshing(false);
  }, [filterType]);

  // Group by day
  const listData: ListItem[] = [];
  let lastDate = '';
  const filtered = filterType ? transactions.filter((t) => t.type === filterType) : transactions;
  for (const tx of filtered) {
    const dateKey = tx.date.substring(0, 10);
    if (dateKey !== lastDate) {
      listData.push({ type: 'header', date: tx.date });
      lastDate = dateKey;
    }
    listData.push({ type: 'transaction', data: tx });
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{formatTransactionDate(item.date)}</Text>
        </View>
      );
    }
    const tx = item.data;
    return (
      <Pressable
        style={styles.txCard}
        onPress={() => router.push({ pathname: '/modals/transaction-detail', params: { id: tx.id } })}
      >
        <View style={[styles.txIconWrap, { backgroundColor: tx.categoryColor + '20' }]}>
          <Text style={styles.txIcon}>{tx.categoryIcon}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txName} numberOfLines={1}>{tx.merchant ?? tx.note ?? tx.categoryName}</Text>
          <Text style={styles.txMeta}>{tx.categoryName} • {tx.walletName}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.income : colors.expense }]}>
            {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
          </Text>
          <Text style={styles.txTime}>{formatTime(tx.date)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Text style={styles.title}>History</Text>
      </Animated.View>

      {/* Filter Bar */}
      <View style={styles.filterRow}>
        {([null, 'expense', 'income', 'transfer'] as const).map((type) => (
          <Pressable
            key={type ?? 'all'}
            onPress={() => { setFilterType(type); }}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
              {type === null ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {(() => {
        const flashListProps = {
          data: listData,
          renderItem,
          estimatedItemSize: 60,
          keyExtractor: (item: ListItem, idx: number) => item.type === 'header' ? `h-${item.date}` : `t-${item.data.id}`,
          contentContainerStyle: { paddingBottom: 100 },
          refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />,
          ListEmptyComponent: (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          ),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <FlashList {...(flashListProps as any)} />;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },

  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  filterText: { fontSize: 13, color: colors.textMuted },
  filterTextActive: { color: colors.cyan, fontWeight: '600' },

  dayHeader: { paddingTop: 16, paddingBottom: 8 },
  dayHeaderText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 14, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  txIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  txMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },
  txTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
