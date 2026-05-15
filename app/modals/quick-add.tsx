/**
 * Quick-Add Modal — log an expense in under 3 seconds.
 */
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { parseAmountToSmallestUnit } from '@src/utils/currency';
import type { TransactionType } from '@src/features/transactions/types';

const TYPES: { label: string; value: TransactionType; color: string }[] = [
  { label: 'Expense', value: 'expense', color: colors.expense },
  { label: 'Income', value: 'income', color: colors.income },
  { label: 'Transfer', value: 'transfer', color: colors.transfer },
];

export default function QuickAddModal() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const categories = useStore((s) => s.categories);
  const wallets = useStore((s) => s.wallets);
  const activeWalletId = useStore((s) => s.activeWalletId);
  const addTransaction = useStore((s) => s.addTransaction);
  const fetchWallets = useStore((s) => s.fetchWallets);

  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number>(activeWalletId ?? wallets[0]?.id ?? 0);
  const [note, setNote] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === txType);

  // Auto-select first category
  useEffect(() => {
    if (filteredCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, selectedCategoryId]);

  // Auto-focus amount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleCategorySelect = (id: number) => {
    setSelectedCategoryId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!amount || !selectedCategoryId || saving) return;

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const amountInSmallest = parseAmountToSmallestUnit(amount);
      await addTransaction({
        amount: amountInSmallest,
        type: txType,
        categoryId: selectedCategoryId,
        walletId: selectedWalletId,
        note: note || undefined,
        source: 'manual',
      });
      await fetchWallets();
      router.back();
    } catch (error) {
      console.error('[QuickAdd] Save error:', error);
      setSaving(false);
    }
  };

  const activeType = TYPES.find((t) => t.value === txType);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Type Toggle */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.typeRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => { setTxType(t.value); setSelectedCategoryId(null); }}
              style={[styles.typeChip, txType === t.value && { backgroundColor: t.color + '20', borderColor: t.color }]}
            >
              <Text style={[styles.typeText, txType === t.value && { color: t.color }]}>{t.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Amount Input */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.amountSection}>
          <Text style={[styles.currencySymbol, { color: activeType?.color }]}>₹</Text>
          <TextInput
            ref={inputRef}
            style={[styles.amountInput, { color: activeType?.color }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
            keyboardType="decimal-pad"
            autoFocus
          />
        </Animated.View>

        {/* Category Grid */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryGrid}>
              {filteredCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategorySelect(cat.id)}
                  style={[
                    styles.categoryChip,
                    selectedCategoryId === cat.id && { backgroundColor: cat.color + '25', borderColor: cat.color },
                  ]}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryName, selectedCategoryId === cat.id && { color: colors.textPrimary }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Wallet Selector */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={styles.sectionLabel}>Wallet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(w.id)}
                style={[styles.walletChip, selectedWalletId === w.id && styles.walletChipActive]}
              >
                <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                <Text style={[styles.walletText, selectedWalletId === w.id && styles.walletTextActive]}>
                  {w.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Optional Fields Toggle */}
        <Pressable onPress={() => setShowOptional(!showOptional)} style={styles.optionalToggle}>
          <Text style={styles.optionalToggleText}>{showOptional ? 'Hide details ▲' : 'Add details ▼'}</Text>
        </Pressable>

        {showOptional && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
            />
          </Animated.View>
        )}

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(250).duration(300)} style={styles.saveWrap}>
          <Pressable
            onPress={handleSave}
            disabled={!amount || !selectedCategoryId || saving}
            style={[styles.saveBtn, (!amount || !selectedCategoryId) && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Transaction'}</Text>
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

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 20, color: colors.textSecondary },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },

  scrollView: { flex: 1, padding: 20 },

  // Type toggle
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface1 },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },

  // Amount
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, paddingVertical: 16 },
  currencySymbol: { fontSize: 36, fontWeight: '300', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '700', fontFamily: 'SpaceMono-Regular', minWidth: 100, textAlign: 'center' },

  // Categories
  sectionLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 10, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  categoryChip: { alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 14, padding: 12, width: 80, borderWidth: 1, borderColor: colors.border },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryName: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },

  // Wallets
  walletRow: { marginBottom: 20 },
  walletChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletIcon: { fontSize: 16, marginRight: 6 },
  walletText: { fontSize: 13, color: colors.textSecondary },
  walletTextActive: { color: colors.cyan, fontWeight: '600' },

  // Optional
  optionalToggle: { alignItems: 'center', paddingVertical: 12, marginBottom: 12 },
  optionalToggleText: { fontSize: 13, color: colors.textMuted },
  noteInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },

  // Save
  saveWrap: { marginTop: 8 },
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
