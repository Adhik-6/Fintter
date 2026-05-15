/**
 * Smart Scan — paste SMS/UPI messages to extract transactions.
 * User pastes message text → regex parser extracts amount/merchant/type
 * → pre-filled transaction for quick confirmation.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { parseSmsText, isFinancialMessage, type ParsedTransaction } from '@src/services/smsParser';
import { formatAmount, parseAmountToSmallestUnit } from '@src/utils/currency';
import { FButton } from '@src/components/ui';

export default function SmartScanScreen() {
  const router = useRouter();
  const categories = useStore((s) => s.categories);
  const wallets = useStore((s) => s.wallets);
  const activeWalletId = useStore((s) => s.activeWalletId);
  const addTransaction = useStore((s) => s.addTransaction);
  const fetchWallets = useStore((s) => s.fetchWallets);

  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields after parsing
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'expense' | 'income'>('expense');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editWalletId, setEditWalletId] = useState<number>(activeWalletId ?? wallets[0]?.id ?? 0);
  const [editMerchant, setEditMerchant] = useState('');

  const handleScan = async () => {
    if (!rawText.trim()) return;
    setScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await parseSmsText(rawText);
      if (result) {
        setParsed(result);
        setEditAmount(result.displayAmount);
        setEditType(result.type);
        setEditMerchant(result.merchant ?? '');
        // Try to match category
        if (result.suggestedCategoryId) {
          setEditCategoryId(result.suggestedCategoryId);
        } else {
          // Default to first expense/income category
          const matchingCats = categories.filter((c) => c.type === result.type);
          setEditCategoryId(matchingCats[0]?.id ?? null);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          'No Transaction Found',
          'Could not detect a financial transaction in this text. Try pasting a bank SMS or UPI notification.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[SmartScan] Parse error:', error);
    }
    setScanning(false);
  };

  const handleSave = async () => {
    if (!editCategoryId || !editAmount) return;

    try {
      const amountInSmallest = parseAmountToSmallestUnit(editAmount);
      await addTransaction({
        amount: amountInSmallest,
        type: editType,
        categoryId: editCategoryId,
        walletId: editWalletId,
        merchant: editMerchant || undefined,
        source: 'sms',
        note: `Scanned: ${parsed?.originalText.substring(0, 60)}...`,
      });
      await fetchWallets();
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => router.back(), 1200);
    } catch (error) {
      console.error('[SmartScan] Save error:', error);
    }
  };

  const handleReset = () => {
    setParsed(null);
    setRawText('');
    setSaved(false);
  };

  const filteredCategories = categories.filter((c) => c.type === editType);

  // Success state
  if (saved) {
    return (
      <View style={styles.container}>
        <Animated.View entering={ZoomIn.duration(300)} style={styles.successWrap}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>Transaction Saved!</Text>
          <Text style={styles.successSub}>From scanned SMS</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Smart Scan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Input Phase */}
        {!parsed && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={styles.subtitle}>
              Paste a bank SMS, UPI notification, or any transaction message below
            </Text>

            <TextInput
              style={styles.textArea}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Paste your SMS here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {rawText.length > 0 && (
              <View style={styles.hintRow}>
                <Text style={styles.hintDot}>
                  {isFinancialMessage(rawText) ? '🟢' : '🔴'}
                </Text>
                <Text style={styles.hintText}>
                  {isFinancialMessage(rawText) ? 'Looks like a financial message' : 'No financial keywords detected'}
                </Text>
              </View>
            )}

            <FButton
              title={scanning ? 'Scanning...' : '🔍 Scan Message'}
              onPress={handleScan}
              loading={scanning}
              disabled={!rawText.trim() || scanning}
              style={styles.scanBtn}
            />

            {/* Example messages */}
            <Text style={styles.exampleTitle}>Example messages that work:</Text>
            {[
              'Rs.1500.00 debited from A/c XX1234 on 15-May to UPI/SWIGGY',
              'INR 25000 credited to your account ending 5678 from SALARY',
              'You have spent Rs 350 at Amazon. Txn ref 123456',
            ].map((ex, i) => (
              <Pressable key={i} onPress={() => setRawText(ex)} style={styles.exampleChip}>
                <Text style={styles.exampleText} numberOfLines={2}>{ex}</Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Result Phase */}
        {parsed && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Parsed Info Card */}
            <View style={styles.parsedCard}>
              <View style={styles.parsedHeader}>
                <Text style={styles.parsedIcon}>
                  {parsed.confidence === 'high' ? '🎯' : '🔍'}
                </Text>
                <View>
                  <Text style={styles.parsedLabel}>
                    {parsed.confidence === 'high' ? 'High Confidence Match' : 'Partial Match'}
                  </Text>
                  <Text style={styles.parsedRule}>Rule: {parsed.matchedRule}</Text>
                </View>
              </View>
              <Text style={styles.originalText} numberOfLines={3}>{parsed.originalText}</Text>
            </View>

            {/* Editable Fields */}
            <Text style={styles.sectionLabel}>Verify & Edit</Text>

            {/* Type */}
            <View style={styles.typeRow}>
              {(['expense', 'income'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setEditType(t)}
                  style={[styles.typeChip, editType === t && { borderColor: t === 'expense' ? colors.expense : colors.income, backgroundColor: (t === 'expense' ? colors.expense : colors.income) + '18' }]}
                >
                  <Text style={[styles.typeText, editType === t && { color: t === 'expense' ? colors.expense : colors.income }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currencySymbol, { color: editType === 'expense' ? colors.expense : colors.income }]}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Merchant */}
            {editMerchant ? (
              <>
                <Text style={styles.fieldLabel}>Merchant</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editMerchant}
                  onChangeText={setEditMerchant}
                />
              </>
            ) : null}

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {filteredCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setEditCategoryId(cat.id)}
                  style={[styles.catChip, editCategoryId === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '25' }]}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catName, editCategoryId === cat.id && { color: colors.textPrimary }]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Wallet */}
            <Text style={styles.fieldLabel}>Wallet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
              {wallets.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => setEditWalletId(w.id)}
                  style={[styles.walletChip, editWalletId === w.id && styles.walletChipActive]}
                >
                  <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                  <Text style={[styles.walletText, editWalletId === w.id && styles.walletTextActive]}>{w.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <FButton title="Try Another" variant="secondary" onPress={handleReset} style={{ flex: 1 }} />
              <FButton
                title="Save Transaction"
                onPress={handleSave}
                disabled={!editAmount || !editCategoryId}
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
  close: { fontSize: 20, color: colors.textSecondary, padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  scroll: { flex: 1, padding: 20 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },

  textArea: { backgroundColor: colors.surface2, borderRadius: 14, padding: 16, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, minHeight: 120, marginBottom: 12 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  hintDot: { fontSize: 12 },
  hintText: { fontSize: 13, color: colors.textMuted },
  scanBtn: { marginBottom: 24 },

  exampleTitle: { fontSize: 13, color: colors.textMuted, marginBottom: 8, fontWeight: '500' },
  exampleChip: { backgroundColor: colors.surface2, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  exampleText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

  // Result Phase
  parsedCard: { backgroundColor: colors.surface1, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.income + '30', marginBottom: 24 },
  parsedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  parsedIcon: { fontSize: 28 },
  parsedLabel: { fontSize: 14, fontWeight: '600', color: colors.income },
  parsedRule: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  originalText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18 },

  sectionLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8, marginTop: 12 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface1 },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },

  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  currencySymbol: { fontSize: 24, fontWeight: '300', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: colors.textPrimary, fontFamily: 'SpaceMono-Regular', paddingVertical: 12 },

  fieldInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },

  catScroll: { marginBottom: 8 },
  catChip: { alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 12, padding: 10, width: 72, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  catIcon: { fontSize: 20, marginBottom: 4 },
  catName: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

  walletScroll: { marginBottom: 20 },
  walletChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletIcon: { fontSize: 16, marginRight: 6 },
  walletText: { fontSize: 13, color: colors.textSecondary },
  walletTextActive: { color: colors.cyan, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successText: { fontSize: 24, fontWeight: '700', color: colors.income },
  successSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
});
