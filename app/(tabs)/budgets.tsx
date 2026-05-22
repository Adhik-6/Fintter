/**
 * Budget Management Screen
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount, parseAmountToSmallestUnit } from '@src/utils/currency';
import { format, startOfMonth } from 'date-fns';
import { CircularProgressArc } from '@src/components/ui/CircularProgressArc';

export default function BudgetsScreen() {
  const router = useRouter();
  const budgets = useStore((s) => s.budgets);
  const budgetProgress = useStore((s) => s.budgetProgress);
  const fetchBudgets = useStore((s) => s.fetchBudgets);
  const computeBudgetProgress = useStore((s) => s.computeBudgetProgress);
  const addBudget = useStore((s) => s.addBudget);
  const categories = useStore((s) => s.categories);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchBudgets().then(() => computeBudgetProgress());
  }, []);

  const handleAdd = async () => {
    if (!newName || !newAmount) return;
    await addBudget({
      name: newName,
      amount: parseAmountToSmallestUnit(newAmount),
      period: 'monthly',
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00:00"),
      categoryId: newCategoryId,
    });
    await computeBudgetProgress();
    setShowAdd(false);
    setNewName('');
    setNewAmount('');
    setNewCategoryId(null);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </Animated.View>

      {budgets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyText}>No budgets yet</Text>
          <Text style={styles.emptySubtext}>Create a budget to track your spending</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {budgets.map((budget, i) => {
            const progress = budgetProgress[budget.id];
            const pct = progress?.percentUsed ?? 0;
            const statusColor = pct >= 90 ? colors.expense : pct >= 60 ? colors.warning : colors.income;
            return (
              <Animated.View key={budget.id} entering={FadeInDown.delay(i * 50).duration(300)} style={styles.budgetCard}>
                <Pressable onPress={() => router.push({ pathname: '/modals/budget-detail', params: { id: budget.id } })} style={{ alignItems: 'center', width: '100%' }}>
                  <View style={styles.arcContainer}>
                    <CircularProgressArc percentage={pct} color={statusColor} size={80} strokeWidth={6} />
                    <View style={styles.arcCenter}>
                      <Text style={styles.budgetIcon}>{budget.categoryIcon ?? '🎯'}</Text>
                    </View>
                  </View>
                  <Text style={styles.budgetName} numberOfLines={1}>{budget.name}</Text>

                  <View style={styles.budgetAmounts}>
                    <Text style={styles.budgetSpent}>{formatAmount(progress?.spent ?? 0)}</Text>
                    <Text style={styles.budgetLimit}>/ {formatAmount(budget.amount)}</Text>
                  </View>
                  <Text style={[styles.budgetRemaining, { color: (progress?.remaining ?? 0) < 0 ? colors.expense : colors.textMuted }]}>
                    {(progress?.remaining ?? 0) >= 0 ? `${formatAmount(progress?.remaining ?? 0)} left` : `${formatAmount(Math.abs(progress?.remaining ?? 0))} over`}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Add Budget Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Budget</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Budget name" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={newAmount} onChangeText={setNewAmount} placeholder="Amount" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />

            <Text style={styles.inputLabel}>Category (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <Pressable onPress={() => setNewCategoryId(null)} style={[styles.catChip, !newCategoryId && styles.catChipActive]}>
                <Text style={styles.catChipText}>All</Text>
              </Pressable>
              {expenseCategories.map((c) => (
                <Pressable key={c.id} onPress={() => setNewCategoryId(c.id)} style={[styles.catChip, newCategoryId === c.id && styles.catChipActive]}>
                  <Text style={styles.catChipIcon}>{c.icon}</Text>
                  <Text style={styles.catChipText}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAdd(false)} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable onPress={handleAdd} style={styles.createBtn}><Text style={styles.createText}>Create</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  addBtn: { backgroundColor: colors.cyan, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: colors.black, fontWeight: '700', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: colors.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  budgetCard: { width: '47%', backgroundColor: colors.surface1, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  arcContainer: { position: 'relative', width: 80, height: 80, marginBottom: 12 },
  arcCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  budgetIcon: { fontSize: 28 },
  budgetName: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', marginBottom: 8, textAlign: 'center' },
  budgetAmounts: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  budgetSpent: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular' },
  budgetLimit: { fontSize: 11, color: colors.textMuted, marginLeft: 2 },
  budgetRemaining: { fontSize: 11, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  input: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  inputLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  catScroll: { marginBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  catChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  catChipIcon: { fontSize: 14, marginRight: 4 },
  catChipText: { fontSize: 12, color: colors.textSecondary },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.surface2 },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.cyan },
  createText: { color: colors.black, fontWeight: '700' },
});
