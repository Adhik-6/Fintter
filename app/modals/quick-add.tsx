/**
 * Quick-Add Modal — log a transaction in under 3 seconds.
 */
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { parseAmountToSmallestUnit, formatAmountCompact } from '@src/utils/currency';
import type { TransactionType } from '@src/features/transactions/types';
import type { BudgetWithDetails } from '@src/features/budgets/types';

const TYPES: { label: string; value: TransactionType; color: string }[] = [
  { label: 'Expense', value: 'expense', color: colors.expense },
  { label: 'Income', value: 'income', color: colors.income },
  { label: 'Transfer', value: 'transfer', color: colors.transfer },
];

const TRANSFER_CATEGORIES = [
  { id: -1, name: 'Wallet Transfer', icon: '🔄', color: colors.transfer },
] as any[];

export default function QuickAddModal() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const categories = useStore((s) => s.categories);
  const wallets = useStore((s) => s.wallets);
  const activeWalletId = useStore((s) => s.activeWalletId);
  const addTransaction = useStore((s) => s.addTransaction);
  const fetchWallets = useStore((s) => s.fetchWallets);
  const budgets = useStore((s) => s.budgets);

  const params = useLocalSearchParams<{ date?: string }>();
  const prefilledDate = params.date;

  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number>(activeWalletId ?? wallets[0]?.id ?? 0);
  const [toWalletId, setToWalletId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');
  const [moodId, setMoodId] = useState<number | null>(null);
  const [isImpulse, setIsImpulse] = useState(false);
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState('30'); // "next occurrence in N days"
  const [moods, setMoods] = useState<any[]>([]);
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);

  const [resolvedBudget, setResolvedBudget] = useState<{ type: 'none' | 'auto' | 'ambiguous', budget?: BudgetWithDetails, budgets?: BudgetWithDetails[] }>({ type: 'none' });
  const [manualBudgetId, setManualBudgetId] = useState<number | null>(null);
  const [ambiguousSelectedBudgetId, setAmbiguousSelectedBudgetId] = useState<number | null>(null);

  useEffect(() => {
    import('@src/db/repositories/moodRepository').then(m => {
      m.moodRepository.getAll().then(setMoods);
    });
  }, []);

  // Filtered categories based on transaction type
  const filteredCategories = txType === 'transfer'
    ? TRANSFER_CATEGORIES
    : categories.filter((c) => c.type === txType);

  // Auto-select first category on type change
  useEffect(() => {
    if (txType === 'transfer') {
      setSelectedCategoryId(-1);
    } else if (filteredCategories.length > 0) {
      setSelectedCategoryId(filteredCategories[0].id);
    } else {
      setSelectedCategoryId(null);
    }
    // Reset recurring for transfer
    if (txType === 'transfer') setMakeRecurring(false);
  }, [txType]);

  // Resolve Auto Budget
  useEffect(() => {
    if (txType !== 'expense' || !selectedCategoryId) {
      setResolvedBudget({ type: 'none' });
      setAmbiguousSelectedBudgetId(null);
      return;
    }
    const dStr = prefilledDate || new Date().toISOString().substring(0, 10);
    const active = budgets.filter(b => 
      b.scope === 'category_group' &&
      b.startDate <= dStr &&
      (!b.endDate || b.endDate >= dStr)
    ).filter(b => {
      try {
        const catIds: number[] = JSON.parse(b.categoryIds ?? '[]');
        return catIds.includes(selectedCategoryId);
      } catch { return false; }
    });

    if (active.length === 1) {
      setResolvedBudget({ type: 'auto', budget: active[0] });
    } else if (active.length > 1) {
      setResolvedBudget({ type: 'ambiguous', budgets: active });
    } else {
      setResolvedBudget({ type: 'none' });
    }
    setAmbiguousSelectedBudgetId(null);
  }, [selectedCategoryId, txType, budgets, prefilledDate]);

  // Fix issue 9: when fromWallet changes, clear toWallet if it now conflicts
  useEffect(() => {
    if (toWalletId === selectedWalletId) {
      setToWalletId(null);
    }
  }, [selectedWalletId]);

  // Auto-focus amount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCategorySelect = (id: number) => {
    setSelectedCategoryId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Issue 9: For transfer, Save is only possible when toWalletId is set
  const canSave = !!amount && !saving && (
    txType === 'transfer'
      ? (toWalletId !== null && toWalletId !== selectedWalletId)
      : !!selectedCategoryId
  );

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const amountInSmallest = parseAmountToSmallestUnit(amount);
      let categoryId = selectedCategoryId ?? filteredCategories[0]?.id;
      if (txType === 'transfer' || categoryId === -1) {
        categoryId = categories[0]?.id ?? 1;
      }

      const txDate = prefilledDate
        ? `${prefilledDate}T${new Date().toTimeString().substring(0, 8)}`
        : undefined;

      let finalBudgetId: number | null = null;
      if (txType === 'expense') {
        if (resolvedBudget.type === 'auto') finalBudgetId = resolvedBudget.budget!.id;
        else if (resolvedBudget.type === 'ambiguous' && ambiguousSelectedBudgetId) finalBudgetId = ambiguousSelectedBudgetId;
        else if (manualBudgetId) finalBudgetId = manualBudgetId;
      }

      let nextTransactionId: number | null = null;
      if (makeRecurring && txType !== 'transfer') {
        const { format, addDays } = await import('date-fns');
        const days = parseInt(recurringDays, 10);
        const safeDays = isNaN(days) || days < 1 ? 30 : days;
        
        const currentDate = prefilledDate ? new Date(prefilledDate) : new Date();
        const nextDate = addDays(currentDate, safeDays);
        
        // Generate the upcoming transaction first to get its ID
        nextTransactionId = await addTransaction({
          amount: amountInSmallest,
          type: txType,
          categoryId: categoryId!,
          walletId: selectedWalletId,
          note: note || undefined,
          merchant: txType === 'expense' ? (merchant || undefined) : undefined,
          moodId: txType === 'expense' ? moodId : null,
          isImpulse: txType === 'expense' && isImpulse ? 1 : 0,
          isRecurring: 1,
          recurringDays: safeDays,
          source: 'manual',
          budgetId: finalBudgetId,
          date: format(nextDate, 'yyyy-MM-dd'),
        });
      }

      await addTransaction({
        amount: amountInSmallest,
        type: txType,
        categoryId,
        walletId: selectedWalletId,
        toWalletId: txType === 'transfer' ? toWalletId : undefined,
        note: note || undefined,
        merchant: txType === 'expense' ? (merchant || undefined) : undefined,
        moodId: txType === 'expense' ? moodId : null,
        isImpulse: txType === 'expense' && isImpulse ? 1 : 0,
        isRecurring: makeRecurring ? 1 : 0,
        recurringDays: makeRecurring ? (parseInt(recurringDays, 10) || 30) : null,
        nextTransactionId: nextTransactionId,
        source: 'manual',
        budgetId: finalBudgetId,
        date: txDate,
      });

      await fetchWallets();
      router.back();
    } catch (error) {
      console.error('[QuickAdd] Save error:', error);
      setSaving(false);
    }
  };

  const activeType = TYPES.find((t) => t.value === txType);

  // Available to-wallets (exclude selected from-wallet)
  const toWallets = wallets.filter(w => w.id !== selectedWalletId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Type Toggle */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.typeRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => {
                setTxType(t.value);
                setSelectedCategoryId(null);
              }}
              style={[styles.typeChip, txType === t.value && { backgroundColor: t.color + '20', borderColor: t.color }]}
            >
              <Text style={[styles.typeText, txType === t.value && { color: t.color }]}>{t.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Amount Input */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.amountSection}>
          <Text style={[styles.currencySymbol, { color: activeType?.color }]}>₹</Text>
          <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 100 }}>
            <TextInput
              ref={inputRef}
              style={[styles.amountInput, { opacity: 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
              value={amount}
              onChangeText={(v) => {
                // Only allow positive numbers
                const cleaned = v.replace(/[^0-9.]/g, '');
                setAmount(cleaned);
              }}
              keyboardType="decimal-pad"
              autoFocus
            />
            {amount === '' ? (
              <Text style={[styles.amountInput, { color: colors.textDisabled }]}>0</Text>
            ) : (
              <Text style={[styles.amountInput, { color: activeType?.color ?? colors.textPrimary }]}>
                {amount}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Category — horizontal FlatList to fix nested scroll issue */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <Text style={styles.sectionLabel}>Category</Text>
          <FlatList
            data={filteredCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            style={{ marginBottom: 10 }}
            contentContainerStyle={styles.categoryGrid}
            renderItem={({ item: cat }) => (
              <Pressable
                onPress={() => handleCategorySelect(cat.id)}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === cat.id && { backgroundColor: (cat.color ?? colors.cyan) + '25', borderColor: cat.color ?? colors.cyan },
                ]}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryName, selectedCategoryId === cat.id && { color: colors.textPrimary }]}>
                  {cat.name}
                </Text>
              </Pressable>
            )}
          />
        </Animated.View>

        {/* Wallet Selector */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={styles.sectionLabel}>
            {txType === 'transfer' ? 'From Wallet' : 'Wallet'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(w.id)}
                style={[styles.walletChip, selectedWalletId === w.id && styles.walletChipActive]}
              >
                <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                <Text style={[styles.walletText, selectedWalletId === w.id && styles.walletTextActive]}>
                  {w.name} <Text style={{ color: w.balance < 0 ? colors.expense : (selectedWalletId === w.id ? colors.cyan : colors.textSecondary) }}>· {formatAmountCompact(w.balance)}</Text>
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* To Wallet (Transfer only) — Issue 9 fixed: filtered and resets when invalid */}
        {txType === 'transfer' && (
          <Animated.View entering={FadeInDown.delay(220).duration(250)}>
            <Text style={styles.sectionLabel}>To Wallet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
              {toWallets.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => setToWalletId(w.id)}
                  style={[styles.walletChip, toWalletId === w.id && styles.walletChipActive]}
                >
                  <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                  <Text style={[styles.walletText, toWalletId === w.id && styles.walletTextActive]}>
                    {w.name} <Text style={{ color: w.balance < 0 ? colors.expense : (toWalletId === w.id ? colors.cyan : colors.textSecondary) }}>· {formatAmountCompact(w.balance)}</Text>
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {toWalletId === null && (
              <Text style={{ fontSize: 12, color: colors.warning, marginTop: -8, marginBottom: 8 }}>
                ⚠️ Please select a destination wallet
              </Text>
            )}
          </Animated.View>
        )}

        {/* Budget Auto/Ambiguous/Manual Logic */}
        {txType === 'expense' && (
          <Animated.View entering={FadeInDown.delay(230).duration(250)} style={{ marginBottom: 16 }}>
            {resolvedBudget.type === 'auto' && resolvedBudget.budget && (
              <View style={[styles.infoCallout, { borderColor: colors.cyan, backgroundColor: colors.cyanGlow }]}>
                <Text style={[styles.infoCalloutText, { color: colors.cyan }]}>
                  🎯 Will count toward {resolvedBudget.budget.name}
                </Text>
              </View>
            )}

            {resolvedBudget.type === 'ambiguous' && resolvedBudget.budgets && (
              <View>
                <Text style={styles.sectionLabel}>Which budget should this count toward?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
                  {resolvedBudget.budgets.map((b) => (
                    <Pressable
                      key={b.id}
                      onPress={() => setAmbiguousSelectedBudgetId(b.id)}
                      style={[styles.walletChip, ambiguousSelectedBudgetId === b.id && styles.walletChipActive]}
                    >
                      <Text style={styles.walletIcon}>🎯</Text>
                      <Text style={[styles.walletText, ambiguousSelectedBudgetId === b.id && styles.walletTextActive]}>{b.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {resolvedBudget.type === 'none' && budgets.filter(b => b.scope === 'manual').length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>Add to a budget? (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
                  <Pressable
                    onPress={() => setManualBudgetId(null)}
                    style={[styles.walletChip, manualBudgetId === null && styles.walletChipActive]}
                  >
                    <Text style={[styles.walletText, manualBudgetId === null && styles.walletTextActive]}>None</Text>
                  </Pressable>
                  {budgets.filter(b => b.scope === 'manual').map((b) => (
                    <Pressable
                      key={b.id}
                      onPress={() => setManualBudgetId(b.id)}
                      style={[styles.walletChip, manualBudgetId === b.id && styles.walletChipActive]}
                    >
                      <Text style={styles.walletIcon}>🎯</Text>
                      <Text style={[styles.walletText, manualBudgetId === b.id && styles.walletTextActive]}>{b.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </Animated.View>
        )}

        {/* Optional Fields Toggle */}
        <Pressable onPress={() => setShowOptional(!showOptional)} style={styles.optionalToggle}>
          <Text style={styles.optionalToggleText}>{showOptional ? 'Hide details ▲' : 'Add details ▼'}</Text>
        </Pressable>

        {showOptional && (
          <Animated.View entering={FadeInDown.duration(200)}>
            {/* Merchant (expense only) */}
            {txType === 'expense' && (
              <TextInput
                style={[styles.noteInput, { minHeight: 50, marginBottom: 12 }]}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Merchant (e.g. Starbucks)"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <TextInput
              style={[styles.noteInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            {/* Mood & Impulse — expense only */}
            {txType === 'expense' && (
              <>
                <Text style={styles.sectionLabel}>Mood</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {moods.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => setMoodId(m.id)}
                      style={[styles.moodChip, moodId === m.id && styles.moodChipActive]}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={[styles.moodLabel, moodId === m.id && styles.moodLabelActive]}>{m.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  onPress={() => setIsImpulse(!isImpulse)}
                  style={styles.impulseToggle}
                >
                  <Text style={styles.impulseText}>Is this an impulse purchase?</Text>
                  <View style={[styles.checkbox, isImpulse && styles.checkboxActive]}>
                    {isImpulse && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                </Pressable>
              </>
            )}

            {/* Make Recurring — expense/income only */}
            {txType !== 'transfer' && (
              <>
                <Pressable
                  onPress={() => setMakeRecurring(!makeRecurring)}
                  style={[styles.impulseToggle, makeRecurring && { borderColor: colors.cyan, backgroundColor: colors.cyanGlow }]}
                >
                  <Text style={styles.impulseText}>🔄 Make this recurring</Text>
                  <View style={[styles.checkbox, makeRecurring && { backgroundColor: colors.cyan, borderColor: colors.cyan }]}>
                    {makeRecurring && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                </Pressable>

                {makeRecurring && (
                  <Animated.View entering={FadeInDown.duration(200)} style={styles.recurringBox}>
                    <Text style={styles.sectionLabel}>Next occurrence in how many days?</Text>
                    <View style={styles.daysRow}>
                      {['7', '14', '30', '60', '90', '365'].map(d => (
                        <Pressable
                          key={d}
                          onPress={() => setRecurringDays(d)}
                          style={[styles.dayChip, recurringDays === d && styles.dayChipActive]}
                        >
                          <Text style={[styles.dayChipText, recurringDays === d && styles.dayChipTextActive]}>
                            {d}d
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Text style={[styles.sectionLabel, { marginBottom: 0, marginRight: 8 }]}>Custom:</Text>
                      <TextInput
                        style={[styles.noteInput, { flex: 1, minHeight: 0, height: 44, marginBottom: 0, textAlign: 'center' }]}
                        value={recurringDays}
                        onChangeText={(v) => setRecurringDays(v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="30"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Text style={[styles.sectionLabel, { marginBottom: 0, marginLeft: 8 }]}>days</Text>
                    </View>
                    {(() => {
                      const d = parseInt(recurringDays, 10);
                      if (!isNaN(d) && d > 0) {
                        const nextDate = new Date();
                        nextDate.setDate(nextDate.getDate() + d);
                        const formatted = nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        return (
                          <Text style={{ fontSize: 12, color: colors.cyan, marginTop: 8 }}>
                            📅 Next payment: {formatted}
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </Animated.View>
                )}
              </>
            )}
          </Animated.View>
        )}

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(250).duration(300)} style={styles.saveWrap}>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveText}>
              {saving ? 'Saving...' : 
                (resolvedBudget.type === 'auto')
                  ? `Save & Link to ${resolvedBudget.budget?.name}`
                  : (resolvedBudget.type === 'ambiguous' && ambiguousSelectedBudgetId)
                    ? `Save & Link to Budget`
                    : manualBudgetId
                      ? `Save & Link to Budget`
                      : 'Save Transaction'
              }
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginTop: 12 },

  infoCallout: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  infoCalloutText: { fontSize: 13, fontWeight: '500' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 20, color: colors.textSecondary },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface1 },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },

  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, paddingVertical: 16 },
  currencySymbol: { fontSize: 36, fontWeight: '300', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '700', fontFamily: 'SpaceMono-Regular', minWidth: 100, textAlign: 'center' },

  sectionLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 10, fontWeight: '500' },
  categoryGrid: { gap: 8, paddingBottom: 4 },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 10,
    width: 76,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryIcon: { fontSize: 22, marginBottom: 4 },
  categoryName: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

  walletRow: { marginBottom: 16 },
  walletChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletIcon: { fontSize: 16, marginRight: 6 },
  walletText: { fontSize: 13, color: colors.textSecondary },
  walletTextActive: { color: colors.cyan, fontWeight: '600' },

  optionalToggle: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  optionalToggleText: { fontSize: 13, color: colors.textMuted },
  noteInput: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  saveWrap: { marginTop: 8 },
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 16, fontWeight: '700', color: colors.black },

  moodChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  moodChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  moodEmoji: { fontSize: 16, marginRight: 4 },
  moodLabel: { fontSize: 13, color: colors.textSecondary },
  moodLabelActive: { color: colors.cyan, fontWeight: '600' },

  impulseToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface2, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  impulseText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.expense, borderColor: colors.expense },
  checkboxCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },

  recurringBox: { backgroundColor: colors.surface1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.cyan + '50', marginBottom: 12 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  dayChipActive: { backgroundColor: colors.cyanGlow, borderColor: colors.cyan },
  dayChipText: { fontSize: 13, color: colors.textMuted },
  dayChipTextActive: { color: colors.cyan, fontWeight: '600' },
});
