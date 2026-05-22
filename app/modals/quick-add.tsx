/**
 * Quick-Add Modal — log a transaction in under 3 seconds.
 */
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { parseAmountToSmallestUnit } from '@src/utils/currency';
import type { TransactionType } from '@src/features/transactions/types';

const TYPES: { label: string; value: TransactionType; color: string }[] = [
  { label: 'Expense', value: 'expense', color: colors.expense },
  { label: 'Income', value: 'income', color: colors.income },
  { label: 'Transfer', value: 'transfer', color: colors.transfer },
];

// Transfer categories are not needed — handled via wallet selection
const TRANSFER_CATEGORIES = [
  { id: -1, name: 'Wallet Transfer', icon: '🔄', color: colors.transfer },
];

// Removed AnimatedDigit component per user request

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
  const [toWalletId, setToWalletId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');
  const [moodId, setMoodId] = useState<number | null>(null);
  const [isImpulse, setIsImpulse] = useState(false);
  const [moods, setMoods] = useState<any[]>([]);
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);

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
  }, [txType]);

  // Auto-focus amount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCategorySelect = (id: number) => {
    setSelectedCategoryId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!amount || saving) return;
    if (txType !== 'transfer' && !selectedCategoryId) return;

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const amountInSmallest = parseAmountToSmallestUnit(amount);
      // For transfer, use a real category (first expense category) or handle gracefully
      let categoryId = selectedCategoryId ?? filteredCategories[0]?.id;
      if (txType === 'transfer' || categoryId === -1) {
        // Use first available category as placeholder for transfers
        categoryId = categories[0]?.id ?? 1;
      }
      await addTransaction({
        amount: amountInSmallest,
        type: txType,
        categoryId,
        walletId: selectedWalletId,
        toWalletId: txType === 'transfer' ? toWalletId : undefined,
        note: note || undefined,
        merchant: merchant || undefined,
        moodId: moodId,
        isImpulse: isImpulse ? 1 : 0,
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
  const canSave = !!amount && !saving && (txType === 'transfer' || !!selectedCategoryId);

  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = context.value.y + event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 1000) {
        translateY.value = withSpring(1000, { velocity: event.velocityY });
        runOnJS(router.back)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    flex: 1,
    backgroundColor: colors.surface0
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
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
        keyboardShouldPersistTaps="always"
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
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
              onBlur={() => {
                if (!selectedCategoryId && txType !== 'transfer') {
                  inputRef.current?.focus();
                }
              }}
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

        {/* Category Grid — only show for expense/income; transfer has fixed chip */}
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
                    selectedCategoryId === cat.id && { backgroundColor: (cat.color ?? colors.cyan) + '25', borderColor: cat.color ?? colors.cyan },
                  ]}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  {/* Issue 8 fix: no numberOfLines limit, allow wrapping */}
                  <Text style={[styles.categoryName, selectedCategoryId === cat.id && { color: colors.textPrimary }]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
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
                  {w.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* To Wallet (Transfer only) */}
        {txType === 'transfer' && (
          <Animated.View entering={FadeInDown.delay(220).duration(250)}>
            <Text style={styles.sectionLabel}>To Wallet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletRow}>
              {wallets
                .filter((w) => w.id !== selectedWalletId)
                .map((w) => (
                  <Pressable
                    key={w.id}
                    onPress={() => setToWalletId(w.id)}
                    style={[styles.walletChip, toWalletId === w.id && styles.walletChipActive]}
                  >
                    <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                    <Text style={[styles.walletText, toWalletId === w.id && styles.walletTextActive]}>
                      {w.name}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Optional Fields Toggle */}
        <Pressable onPress={() => setShowOptional(!showOptional)} style={styles.optionalToggle}>
          <Text style={styles.optionalToggleText}>{showOptional ? 'Hide details ▲' : 'Add details ▼'}</Text>
        </Pressable>

        {showOptional && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <TextInput
              style={[styles.noteInput, { minHeight: 50, marginBottom: 12 }]}
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Merchant (e.g. Starbucks)"
              placeholderTextColor={colors.textMuted}
            />

            {/* Issue 9 fix: note input is inside ScrollView so keyboard won't hide it */}
            <TextInput
              style={[styles.noteInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              multiline
              onFocus={() => {
                // Small delay to allow keyboard to appear, then scroll to bottom
                setTimeout(() => {}, 300);
              }}
            />

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
          </Animated.View>
        )}

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(250).duration(300)} style={styles.saveWrap}>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Transaction'}</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
        </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginTop: 12 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 20, color: colors.textSecondary },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },

  // Type toggle
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface1 },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },

  // Amount
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, paddingVertical: 16 },
  currencySymbol: { fontSize: 36, fontWeight: '300', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '700', fontFamily: 'SpaceMono-Regular', minWidth: 100, textAlign: 'center' },

  // Categories — Issue 8: fixed width chip with text wrapping
  sectionLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 10, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 10,
    width: 76,          // fixed width
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIcon: { fontSize: 22, marginBottom: 4 },
  categoryName: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    // allow wrapping — no numberOfLines constraint
  },

  // Wallets
  walletRow: { marginBottom: 16 },
  walletChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletIcon: { fontSize: 16, marginRight: 6 },
  walletText: { fontSize: 13, color: colors.textSecondary },
  walletTextActive: { color: colors.cyan, fontWeight: '600' },

  // Optional
  optionalToggle: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  optionalToggleText: { fontSize: 13, color: colors.textMuted },
  // Issue 9 fix: note input inside ScrollView — keyboard pushes scroll view up
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

  // Save
  saveWrap: { marginTop: 8 },
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 16, fontWeight: '700', color: colors.black },

  // Added styles for optional fields
  moodChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  moodChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  moodEmoji: { fontSize: 16, marginRight: 4 },
  moodLabel: { fontSize: 13, color: colors.textSecondary },
  moodLabelActive: { color: colors.cyan, fontWeight: '600' },

  impulseToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface2, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  impulseText: { fontSize: 14, color: colors.textPrimary },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.expense, borderColor: colors.expense },
  checkboxCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
});
