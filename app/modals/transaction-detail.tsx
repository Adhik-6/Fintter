/**
 * Transaction Detail Modal
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';
import { formatTransactionDate, formatTime } from '@src/utils/date';
import { transactionRepository } from '@src/db/repositories/transactionRepository';
import type { TransactionWithDetails } from '@src/features/transactions/types';

export default function TransactionDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [tx, setTx] = useState<TransactionWithDetails | null>(null);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const fetchWallets = useStore((s) => s.fetchWallets);

  useEffect(() => {
    if (params.id) {
      transactionRepository.getById(Number(params.id)).then(setTx);
    }
  }, [params.id]);

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (tx) { await deleteTransaction(tx.id); await fetchWallets(); router.back(); }
      }},
    ]);
  };

  if (!tx) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  const amountColor = tx.type === 'income' ? colors.income : tx.type === 'transfer' ? colors.transfer : colors.expense;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.close}>✕</Text></Pressable>
        <Text style={styles.title}>Transaction</Text>
        <Pressable onPress={handleDelete}><Text style={styles.deleteBtn}>🗑️</Text></Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: tx.categoryColor + '20' }]}>
          <Text style={styles.bigIcon}>{tx.categoryIcon}</Text>
        </View>

        <Text style={[styles.amount, { color: amountColor }]}>
          {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
        </Text>
        <Text style={styles.type}>{tx.type.toUpperCase()}</Text>

        <View style={styles.detailCard}>
          <DetailRow label="Category" value={`${tx.categoryIcon} ${tx.categoryName}`} />
          <DetailRow label="Wallet" value={tx.walletName} />
          <DetailRow label="Date" value={formatTransactionDate(tx.date)} />
          <DetailRow label="Time" value={formatTime(tx.date)} />
          {tx.merchant && <DetailRow label="Merchant" value={tx.merchant} />}
          {tx.note && <DetailRow label="Note" value={tx.note} />}
          {tx.moodEmoji && <DetailRow label="Mood" value={`${tx.moodEmoji} ${tx.moodLabel ?? ''}`} />}
          <DetailRow label="Source" value={tx.source} />
          {tx.isImpulse === 1 && <DetailRow label="Impulse" value="⚠️ Yes" />}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 100 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  close: { fontSize: 20, color: colors.textSecondary, padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  deleteBtn: { fontSize: 20, padding: 8 },

  scroll: { flex: 1 },
  content: { alignItems: 'center', padding: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bigIcon: { fontSize: 36 },
  amount: { fontSize: 36, fontWeight: '700', fontFamily: 'SpaceMono-Regular', marginBottom: 4 },
  type: { fontSize: 13, color: colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: 24 },

  detailCard: { width: '100%', backgroundColor: colors.surface1, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 14, color: colors.textMuted },
  detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
});
