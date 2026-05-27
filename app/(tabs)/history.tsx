/**
 * Transaction History — timeline grouped by day.
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Calendar } from 'react-native-calendars';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';
import { formatTransactionDate, formatTime } from '@src/utils/date';
import { format } from 'date-fns';
import type { TransactionWithDetails, TransactionType } from '@src/features/transactions/types';
type ListItem = { type: 'header'; date: string } | { type: 'transaction'; data: TransactionWithDetails };

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'upcoming' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(params.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const transactions = useStore((s) => s.transactions);
  const fetchTransactions = useStore((s) => s.fetchTransactions);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const categories = useStore((s) => s.categories);


  useEffect(() => { 
    fetchTransactions({ limit: 500 }); 
  }, []);

  useEffect(() => {
    if (params.date) {
      setSelectedDate(params.date);
    }
  }, [params.date]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions({ limit: 500, type: filterType && filterType !== 'upcoming' ? filterType : undefined });
    setRefreshing(false);
  }, [filterType]);

  // Compute available categories for the currently filtered transactions (ignoring category filter)
  const baseFiltered = transactions
    .filter((t) => !selectedDate || t.date.startsWith(selectedDate))
    .filter((t) => !filterType || t.type === filterType);

  const availableCategoryIds = new Set(baseFiltered.map(t => t.categoryId));
  const availableCategories = categories.filter(c => availableCategoryIds.has(c.id));

  // Apply category filter
  const filtered = selectedCategoryId ? baseFiltered.filter((t) => t.categoryId === selectedCategoryId) : baseFiltered;

  // Group by day
  const listData: ListItem[] = [];
  let lastDate = '';

  if (filterType === 'upcoming') {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const upcomingList = transactions
      .filter(tx => tx.date.substring(0, 10) > todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    let lastUpcomingDate = '';
    upcomingList.forEach(tx => {
      const dateKey = tx.date.substring(0, 10);
      if (dateKey !== lastUpcomingDate) {
        listData.push({ type: 'header', date: tx.date });
        lastUpcomingDate = dateKey;
      }
      listData.push({ type: 'transaction', data: tx });
    });
  } else {

    for (const tx of filtered) {
      const dateKey = tx.date.substring(0, 10);
      if (dateKey !== lastDate) {
        listData.push({ type: 'header', date: tx.date });
        lastDate = dateKey;
      }
      listData.push({ type: 'transaction', data: tx });
    }
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
    const isRecurring = tx.isRecurring === 1;
    return (
      <Pressable
        style={styles.txCard}
        onPress={() => router.push({ pathname: '/modals/transaction-detail', params: { id: tx.id } })}
      >
        <View style={{ position: 'relative', marginRight: 12 }}>
          <View style={[styles.txIconWrap, { backgroundColor: tx.categoryColor + '20' }]}>
            <Text style={styles.txIcon}>{tx.categoryIcon}</Text>
          </View>
          {isRecurring && (
            <View style={styles.recurringDot}>
              <Ionicons name="repeat" size={9} color={colors.black} />
            </View>
          )}
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txName} numberOfLines={1}>{tx.merchant ?? tx.note ?? tx.categoryName}</Text>
          <Text style={styles.txMeta}>{tx.categoryName} • {tx.walletName}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.income : tx.type === 'transfer' ? colors.transfer : colors.expense }]}>
            {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatAmount(tx.amount)}
          </Text>
          <Text style={styles.txTime}>{formatTime(tx.date)}</Text>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={{ paddingTop: 10 }}>
      {/* Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {([null, 'expense', 'income', 'transfer', 'upcoming'] as const).map((type) => (
          <Pressable
            key={type ?? 'all'}
            onPress={() => { setFilterType(type); setSelectedCategoryId(null); }}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
              {type === null ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Calendar
        current={selectedDate || undefined}
        maxDate={format(new Date(), 'yyyy-MM-dd')}
        onDayPress={(day: any) => {
          if (selectedDate === day.dateString) setSelectedDate('');
          else setSelectedDate(day.dateString);
          setSelectedCategoryId(null); // Reset category when date changes
        }}
        markedDates={(() => {
          const marks: Record<string, any> = {};
          if (selectedDate) {
            marks[selectedDate] = { selected: true, selectedColor: colors.cyan };
          }
          return marks;
        })()}
        theme={{
          backgroundColor: colors.surface0,
          calendarBackground: colors.surface1,
          textSectionTitleColor: colors.textMuted,
          selectedDayBackgroundColor: colors.cyan,
          selectedDayTextColor: colors.black,
          todayTextColor: colors.cyan,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.textDisabled,
          monthTextColor: colors.textPrimary,
          arrowColor: colors.cyan,
        }}
        style={styles.calendar}
      />

      {/* Category Filter */}
      {availableCategories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <Pressable
            onPress={() => setSelectedCategoryId(null)}
            style={[styles.filterChip, !selectedCategoryId && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, !selectedCategoryId && styles.filterTextActive]}>All Cats</Text>
          </Pressable>
          {availableCategories.map(c => (
            <Pressable
              key={c.id}
              onPress={() => setSelectedCategoryId(c.id)}
              style={[styles.filterChip, selectedCategoryId === c.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedCategoryId === c.id && styles.filterTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Pressable
          onPress={() => router.push(selectedDate ? { pathname: '/modals/quick-add', params: { date: selectedDate } } : '/modals/quick-add' as any)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={colors.black} />
        </Pressable>
      </Animated.View>

      {(() => {
        const flashListProps = {
          data: listData,
          renderItem,
          ListHeaderComponent: renderHeader,
          estimatedItemSize: 60,
          keyExtractor: (item: ListItem, idx: number) => item.type === 'header' ? `h-${item.date}` : `t-${item.data.id}`,
          contentContainerStyle: { paddingBottom: 100, paddingHorizontal: 20 },
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
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },

  filterRow: { gap: 8, marginBottom: 12 },
  catScroll: { gap: 8, marginBottom: 16 },
  calendar: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  filterText: { fontSize: 13, color: colors.textMuted },
  filterTextActive: { color: colors.cyan, fontWeight: '600' },

  dayHeader: { paddingTop: 16, paddingBottom: 8 },
  dayHeaderText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 14, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  txIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txIcon: { fontSize: 20 },
  recurringDot: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.surface0 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  txMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },
  txTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deleteBtn: { marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
