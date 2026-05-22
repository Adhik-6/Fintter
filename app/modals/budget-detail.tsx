/**
 * Budget Detail Modal — view budget progress, edit, and see related transactions.
 */
import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount, parseAmountToSmallestUnit } from '@src/utils/currency';
import { formatTransactionDate, formatTime } from '@src/utils/date';
import { CircularProgressArc } from '@src/components/ui/CircularProgressArc';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfYear, endOfYear, format } from 'date-fns';

function getPeriodDates(period: string, startDate: string): { start: string; end: string } {
  const now = new Date();
  switch (period) {
    case 'daily': return { start: format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss") };
    case 'weekly': return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss") };
    case 'monthly': return { start: format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss") };
    case 'yearly': return { start: format(startOfYear(now), "yyyy-MM-dd'T'HH:mm:ss"), end: format(endOfYear(now), "yyyy-MM-dd'T'HH:mm:ss") };
    default: return { start: startDate, end: format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss") };
  }
}

export default function BudgetDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  
  const budgets = useStore((s) => s.budgets);
  const budgetProgress = useStore((s) => s.budgetProgress);
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const updateBudget = useStore((s) => s.updateBudget);
  const deleteBudget = useStore((s) => s.deleteBudget);
  const computeBudgetProgress = useStore((s) => s.computeBudgetProgress);

  const budgetId = Number(params.id);
  const budget = budgets.find(b => b.id === budgetId);
  const progress = budgetProgress[budgetId];

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (budget) {
      setEditName(budget.name);
      setEditAmount((budget.amount / 100).toFixed(2));
      setEditCategoryId(budget.categoryId);
    }
  }, [budget]);

  const relatedTransactions = useMemo(() => {
    if (!budget) return [];
    const { start, end } = getPeriodDates(budget.period, budget.startDate);
    return transactions.filter(t => 
      t.type === 'expense' &&
      t.date >= start && t.date <= end &&
      (budget.categoryId ? t.categoryId === budget.categoryId : true) &&
      (budget.walletId ? t.walletId === budget.walletId : true)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [budget, transactions]);

  if (!budget || !progress) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Budget', 'Are you sure you want to delete this budget?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteBudget(budget.id);
          router.back();
        }
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editAmount || saving) return;
    setSaving(true);
    try {
      await updateBudget(budget.id, {
        name: editName,
        amount: parseAmountToSmallestUnit(editAmount),
        categoryId: editCategoryId,
      });
      await computeBudgetProgress();
      setShowEdit(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const pct = progress.percentUsed;
  const statusColor = pct >= 90 ? colors.expense : pct >= 60 ? colors.warning : colors.income;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Budget Details</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowEdit(true)} style={styles.headerBtn}>
            <Ionicons name="pencil-outline" size={20} color={colors.cyan} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.expense} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.arcContainer}>
          <CircularProgressArc percentage={pct} color={statusColor} size={120} strokeWidth={8} />
          <View style={styles.arcCenter}>
            <Text style={styles.bigIcon}>{budget.categoryIcon ?? '🎯'}</Text>
          </View>
        </View>

        <Text style={styles.budgetName}>{budget.name}</Text>
        
        <View style={styles.amountsRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Spent</Text>
            <Text style={[styles.amountValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatAmount(progress.spent)}</Text>
          </View>
          <View style={styles.amountSep} />
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text style={[styles.amountValue, { color: progress.remaining < 0 ? colors.expense : colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
              {progress.remaining < 0 ? `+${formatAmount(Math.abs(progress.remaining))}` : `${formatAmount(progress.remaining)} left`}
            </Text>
          </View>
          <View style={styles.amountSep} />
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Limit</Text>
            <Text style={[styles.amountValue, { color: colors.textMuted }]} numberOfLines={1} adjustsFontSizeToFit>{formatAmount(budget.amount)}</Text>
          </View>
        </View>

        <View style={styles.txListContainer}>
          <Text style={styles.sectionTitle}>Transactions ({getPeriodDates(budget.period, budget.startDate).start.substring(0, 7)})</Text>
          {relatedTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No expenses logged for this budget in the current period.</Text>
          ) : (
            relatedTransactions.map(tx => (
              <Pressable
                key={tx.id}
                style={styles.txCard}
                onPress={() => router.push({ pathname: '/modals/transaction-detail', params: { id: tx.id } })}
              >
                <View style={[styles.txIconWrap, { backgroundColor: tx.categoryColor + '20' }]}>
                  <Text style={styles.txIcon}>{tx.categoryIcon}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName} numberOfLines={1}>{tx.merchant ?? tx.note ?? tx.categoryName}</Text>
                  <Text style={styles.txMeta}>{formatTransactionDate(tx.date)} • {formatTime(tx.date)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: colors.expense }]}>-{formatAmount(tx.amount)}</Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowEdit(false)} />
        <KeyboardAvoidingView 
          style={styles.editSheetContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editSheet}>
            <View style={styles.editHandle} />
            <Text style={styles.editTitle}>Edit Budget</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Budget Name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.editInput}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <Pressable onPress={() => setEditCategoryId(null)} style={[styles.catChip, !editCategoryId && styles.catChipActive]}>
                  <Text style={styles.catChipText}>All</Text>
                </Pressable>
                {expenseCategories.map((c) => (
                  <Pressable key={c.id} onPress={() => setEditCategoryId(c.id)} style={[styles.catChip, editCategoryId === c.id && styles.catChipActive]}>
                    <Text style={styles.catChipIcon}>{c.icon}</Text>
                    <Text style={[styles.catChipText, editCategoryId === c.id && { color: colors.cyan }]}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                onPress={handleSaveEdit}
                disabled={!editName || !editAmount || saving}
                style={[styles.saveBtn, (!editName || !editAmount || saving) && styles.saveBtnDisabled]}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 100 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerBtn: { padding: 8 },
  headerActions: { flexDirection: 'row', gap: 4 },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },

  scroll: { flex: 1 },
  content: { alignItems: 'center', padding: 20 },
  
  arcContainer: { position: 'relative', width: 120, height: 120, marginBottom: 16 },
  arcCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bigIcon: { fontSize: 40 },
  
  budgetName: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 24 },
  
  amountsRow: { flexDirection: 'row', backgroundColor: colors.surface1, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, width: '100%', marginBottom: 32 },
  amountBox: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  amountSep: { width: 1, backgroundColor: colors.border },
  amountLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  amountValue: { fontSize: 15, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },

  txListContainer: { width: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },

  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  txIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  txMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },

  // Edit Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  editSheetContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '90%' },
  editSheet: { backgroundColor: colors.surface1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 20, height: '100%' },
  editHandle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  editTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  editInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  
  catChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  catChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  catChipIcon: { fontSize: 14, marginRight: 4 },
  catChipText: { fontSize: 12, color: colors.textSecondary },
  
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
