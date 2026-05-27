/**
 * Budget Management Screen
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmountCompact, parseAmountToSmallestUnit } from '@src/utils/currency';
import { format, startOfMonth } from 'date-fns';
import { CircularProgressArc } from '@src/components/ui/CircularProgressArc';
import type { BudgetScope, BudgetPeriod } from '@src/features/budgets/types';

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
  const [scope, setScope] = useState<BudgetScope>('overall');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [resetVal, setResetVal] = useState('1');
  const [resetUnit, setResetUnit] = useState<'days'|'weeks'|'months'|'years'>('months');
  const [manualIcon, setManualIcon] = useState('🎯');

  useEffect(() => {
    fetchBudgets().then(() => computeBudgetProgress());
  }, []);

  const handleAdd = async () => {
    if (!newName || !newAmount) return;
    if (scope === 'category_group' && selectedCatIds.length === 0) return;
    
    await addBudget({
      name: newName,
      amount: parseAmountToSmallestUnit(newAmount),
      period: 'custom',
      resetIntervalValue: parseInt(resetVal, 10) || 1,
      resetIntervalUnit: resetUnit,
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00:00"),
      scope,
      categoryIds: scope === 'category_group' ? JSON.stringify(selectedCatIds) : null,
      categoryId: scope === 'category_group' ? selectedCatIds[0] : null, // legacy fallback for icon
      icon: scope === 'manual' ? manualIcon : (scope === 'overall' ? '💰' : null),
    });
    await computeBudgetProgress();
    setShowAdd(false);
    setNewName('');
    setNewAmount('');
    setScope('overall');
    setPeriod('monthly');
    setSelectedCatIds([]);
  };

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
            return (
              <Animated.View key={budget.id} entering={FadeInDown.delay(i * 50).duration(300)} style={styles.budgetCard}>
                <Pressable onPress={() => router.push({ pathname: '/modals/budget-detail', params: { id: budget.id } })} style={{ alignItems: 'center', width: '100%' }}>
                  <View style={styles.arcContainer}>
                    <CircularProgressArc percentage={pct} size={80} strokeWidth={6} />
                    <View style={styles.arcCenter}>
                      <Text style={styles.budgetIcon}>{budget.icon ?? budget.categoryIcon ?? '💰'}</Text>
                    </View>
                  </View>
                  <Text style={styles.budgetName} numberOfLines={1}>{budget.name}</Text>

                  <View style={styles.budgetAmounts}>
                    <Text style={styles.budgetSpent} numberOfLines={1}>{formatAmountCompact(progress?.spent ?? 0)}</Text>
                    <Text style={styles.budgetLimit} numberOfLines={1}>/ {formatAmountCompact(budget.amount)}</Text>
                  </View>
                  <Text style={[styles.budgetRemaining, { color: (progress?.remaining ?? 0) < 0 ? colors.expense : colors.textMuted }]} numberOfLines={1}>
                    {(progress?.remaining ?? 0) >= 0 ? `${formatAmountCompact(progress?.remaining ?? 0)} left` : `${formatAmountCompact(Math.abs(progress?.remaining ?? 0))} over`}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Add Budget Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Budget</Text>
            
            <View style={styles.scopeRow}>
              <Pressable onPress={() => setScope('overall')} style={[styles.scopeChip, scope === 'overall' && styles.scopeChipActive]}>
                <Text style={[styles.scopeText, scope === 'overall' && styles.scopeTextActive]}>Overall</Text>
              </Pressable>
              <Pressable onPress={() => setScope('category_group')} style={[styles.scopeChip, scope === 'category_group' && styles.scopeChipActive]}>
                <Text style={[styles.scopeText, scope === 'category_group' && styles.scopeTextActive]}>By Category</Text>
              </Pressable>
              <Pressable onPress={() => setScope('manual')} style={[styles.scopeChip, scope === 'manual' && styles.scopeChipActive]}>
                <Text style={[styles.scopeText, scope === 'manual' && styles.scopeTextActive]}>Manual</Text>
              </Pressable>
            </View>

            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Budget name" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={newAmount} onChangeText={setNewAmount} placeholder="Amount" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />

            {scope === 'category_group' && (
              <>
                <Text style={styles.inputLabel}>Select Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                  {expenseCategories.map((c) => {
                    const isSelected = selectedCatIds.includes(c.id);
                    return (
                      <Pressable 
                        key={c.id} 
                        onPress={() => setSelectedCatIds(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                        style={[styles.catChip, isSelected && styles.catChipActive]}
                      >
                        <Text style={styles.catChipIcon}>{c.icon}</Text>
                        <Text style={[styles.catChipText, isSelected && { color: colors.cyan, fontWeight: '600' }]}>{c.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {scope === 'manual' && (
              <TextInput style={[styles.input, { width: 80, textAlign: 'center', fontSize: 24 }]} value={manualIcon} onChangeText={setManualIcon} placeholder="Emoji" placeholderTextColor={colors.textMuted} maxLength={2} />
            )}

            <Text style={styles.inputLabel}>Reset Period</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={resetVal} onChangeText={setResetVal} placeholder="Number" keyboardType="numeric" />
              <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                {(['days','weeks','months','years'] as const).map((u) => (
                  <Pressable key={u} onPress={() => setResetUnit(u)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: resetUnit === u ? colors.cyanGlow : 'transparent' }}>
                    <Text style={{ fontSize: 10, color: resetUnit === u ? colors.cyan : colors.textMuted }}>{u.charAt(0).toUpperCase()}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {scope === 'overall' && (
              <Text style={[styles.inputLabel, { fontSize: 11, fontStyle: 'italic', marginTop: -4, marginBottom: 16 }]}>
                Note: All 'Expense' transactions will contribute to this budget.
              </Text>
            )}

            {scope === 'manual' && (
              <View style={[styles.infoCallout, { marginTop: 8 }]}>
                <Text style={styles.infoCalloutText}>You'll link transactions to this budget manually while adding them.</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAdd(false)} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable 
                onPress={handleAdd} 
                disabled={!newName || !newAmount || (scope === 'category_group' && selectedCatIds.length === 0)}
                style={[styles.createBtn, (!newName || !newAmount || (scope === 'category_group' && selectedCatIds.length === 0)) && { opacity: 0.5 }]}
              >
                <Text style={styles.createText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scopeChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  scopeChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  scopeText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  scopeTextActive: { color: colors.cyan },
  infoCallout: { backgroundColor: colors.surface2, padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  infoCalloutText: { color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
});
