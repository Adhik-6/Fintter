/**
 * Smart SMS Scan — reads SMS messages from the device inbox (Android),
 * auto-detects financial transactions, and lets the user review and confirm
 * which ones to add to their transaction list.
 *
 * Workflow:
 *  1. Request READ_SMS permission
 *  2. Load recent SMS messages via native module (Android only)
 *  3. Filter and parse financial messages
 *  4. Show a review list — user edits/confirms/skips each transaction
 *  5. Add confirmed transactions in bulk
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert,
  PermissionsAndroid, Platform, ActivityIndicator, NativeModules, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { parseSmsText, isFinancialMessage, type ParsedTransaction } from '@src/services/smsParser';
import { formatAmount, parseAmountToSmallestUnit } from '@src/utils/currency';

interface SmsMessage {
  id: string;
  address: string;
  body: string;
  date: string;
}

interface ReviewItem extends ParsedTransaction {
  smsId: string;
  smsDate: string;
  sender: string;
  selected: boolean;
  editedAmount: string;
  editedNote: string;
  categoryId: number | null;
}

// Try to access native SMS module (available only in development builds, not Expo Go)
const SmsAndroid = NativeModules?.SmsAndroid ?? null;

/**
 * Read SMS messages using native Android module.
 * Returns empty array in Expo Go (no native module).
 */
async function readDeviceSMS(maxCount = 100): Promise<SmsMessage[]> {
  if (Platform.OS !== 'android' || !SmsAndroid?.list) {
    return [];
  }
  return new Promise((resolve) => {
    try {
      SmsAndroid.list(
        JSON.stringify({ box: 'inbox', maxCount }),
        (error: string) => {
          console.warn('[SmartScan] SMS read error:', error);
          resolve([]);
        },
        (_count: number, smsList: string) => {
          try {
            const msgs = JSON.parse(smsList) as Array<{ _id: string; address: string; body: string; date: string }>;
            resolve(msgs.map((m) => ({ id: m._id, address: m.address, body: m.body, date: m.date })));
          } catch {
            resolve([]);
          }
        }
      );
    } catch {
      resolve([]);
    }
  });
}

export default function SmartScanScreen() {
  const router = useRouter();
  const categories = useStore((s) => s.categories);
  const wallets = useStore((s) => s.wallets);
  const activeWalletId = useStore((s) => s.activeWalletId);
  const addTransaction = useStore((s) => s.addTransaction);
  const fetchWallets = useStore((s) => s.fetchWallets);

  const [phase, setPhase] = useState<'idle' | 'scanning' | 'review' | 'done'>('idle');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [noNativeModule, setNoNativeModule] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [selectedWalletId, setSelectedWalletId] = useState<number>(activeWalletId ?? wallets[0]?.id ?? 0);

  const handleScan = useCallback(async () => {
    setPhase('scanning');
    setPermissionDenied(false);

    try {
      // Check if native SMS module is available
      if (!SmsAndroid) {
        setNoNativeModule(true);
        setPhase('idle');
        return;
      }

      // Request permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission',
            message: 'Fintter needs to read your SMS messages to detect financial transactions.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionDenied(true);
          setPhase('idle');
          return;
        }
      }

      // Read SMS
      const messages = await readDeviceSMS(200);

      if (messages.length === 0) {
        Alert.alert('No Messages', 'Could not read SMS messages. Make sure you are using a development build.');
        setPhase('idle');
        return;
      }

      // Filter and parse financial SMS
      const financialMessages = messages.filter((m) => isFinancialMessage(m.body));
      const parsed: ReviewItem[] = [];

      for (const msg of financialMessages.slice(0, 50)) {
        const result = await parseSmsText(msg.body);
        if (result) {
          const matchingCats = categories.filter((c) => c.type === result.type);
          const catId = result.suggestedCategoryId ?? matchingCats[0]?.id ?? null;
          parsed.push({
            ...result,
            smsId: msg.id,
            smsDate: msg.date,
            sender: msg.address,
            selected: true,
            editedAmount: result.displayAmount,
            editedNote: '',
            categoryId: catId,
          });
        }
      }

      if (parsed.length === 0) {
        Alert.alert('No Financial SMS Found', 'No bank/UPI messages were detected in your recent SMS.');
        setPhase('idle');
        return;
      }

      setReviewItems(parsed);
      setPhase('review');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[SmartScan] Error:', error);
      setPhase('idle');
    }
  }, [categories, activeWalletId]);

  const toggleItem = (index: number) => {
    setReviewItems((prev) =>
      prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item)
    );
  };

  const updateItem = (index: number, changes: Partial<ReviewItem>) => {
    setReviewItems((prev) =>
      prev.map((item, i) => i === index ? { ...item, ...changes } : item)
    );
  };

  const handleSaveAll = async () => {
    const selected = reviewItems.filter((item) => item.selected && item.editedAmount && item.categoryId);
    if (selected.length === 0) {
      Alert.alert('Nothing Selected', 'Please select at least one transaction to add.');
      return;
    }

    setSaving(true);
    let count = 0;

    for (const item of selected) {
      try {
        const amount = parseAmountToSmallestUnit(item.editedAmount);
        await addTransaction({
          amount,
          type: item.type,
          categoryId: item.categoryId!,
          walletId: selectedWalletId,
          merchant: item.merchant ?? undefined,
          note: item.editedNote || `SMS from ${item.sender}`,
          source: 'sms',
        });
        count++;
      } catch (e) {
        console.error('[SmartScan] Save error:', e);
      }
    }

    await fetchWallets();
    setSavedCount(count);
    setPhase('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Done state ───────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <View style={styles.handle} />
        <Animated.View entering={FadeInUp.duration(400)} style={styles.doneWrap}>
          <Ionicons name="checkmark-circle" size={80} color={colors.income} />
          <Text style={styles.doneTitle}>{savedCount} Transaction{savedCount !== 1 ? 's' : ''} Added!</Text>
          <Text style={styles.doneSub}>From your SMS inbox</Text>
          <Pressable onPress={() => router.back()} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ─── Review state ─────────────────────────────────────────────────────────
  if (phase === 'review') {
    const selectedCount = reviewItems.filter((i) => i.selected).length;
    return (
      <View style={styles.container}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => setPhase('idle')} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Review Transactions</Text>
          <Text style={styles.headerCount}>{selectedCount}/{reviewItems.length}</Text>
        </View>

        {/* Wallet selector */}
        <View style={styles.walletSelectorWrap}>
          <Text style={styles.walletSelectorLabel}>Add to wallet:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {wallets.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(w.id)}
                style={[styles.walletChip, selectedWalletId === w.id && styles.walletChipActive]}
              >
                <Text>{w.icon ?? '💳'}</Text>
                <Text style={[styles.walletChipText, selectedWalletId === w.id && styles.walletChipTextActive]}>{w.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
          {reviewItems.map((item, i) => {
            const amountColor = item.type === 'income' ? colors.income : colors.expense;
            const catList = categories.filter((c) => c.type === item.type);
            return (
              <Animated.View key={item.smsId + i} entering={FadeInDown.delay(i * 40).duration(250)}>
                <View style={[styles.reviewCard, !item.selected && styles.reviewCardDimmed]}>
                  <View style={styles.reviewCardTop}>
                    <Pressable onPress={() => toggleItem(i)} style={styles.checkWrap}>
                      <Ionicons
                        name={item.selected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={item.selected ? colors.cyan : colors.textMuted}
                      />
                    </Pressable>
                    <View style={styles.reviewInfo}>
                      <Text style={[styles.reviewAmount, { color: amountColor }]}>
                        {item.type === 'income' ? '+' : '-'}₹{item.editedAmount}
                      </Text>
                      <Text style={styles.reviewSender} numberOfLines={1}>{item.sender}</Text>
                    </View>
                    <View style={[styles.typePill, { backgroundColor: amountColor + '20' }]}>
                      <Text style={[styles.typePillText, { color: amountColor }]}>{item.type}</Text>
                    </View>
                  </View>

                  {item.selected && (
                    <View style={styles.reviewEditArea}>
                      {/* Amount edit */}
                      <View style={styles.reviewRow}>
                        <Text style={styles.reviewFieldLabel}>Amount</Text>
                        <TextInput
                          style={styles.reviewInput}
                          value={item.editedAmount}
                          onChangeText={(v) => updateItem(i, { editedAmount: v })}
                          keyboardType="decimal-pad"
                        />
                      </View>

                      {/* Category picker */}
                      <Text style={styles.reviewFieldLabel}>Category</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {catList.map((cat) => (
                          <Pressable
                            key={cat.id}
                            onPress={() => updateItem(i, { categoryId: cat.id })}
                            style={[
                              styles.catChip,
                              item.categoryId === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '20' }
                            ]}
                          >
                            <Text style={styles.catChipIcon}>{cat.icon}</Text>
                            <Text style={[styles.catChipName, item.categoryId === cat.id && { color: colors.textPrimary }]}>
                              {cat.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>

                      {/* SMS preview */}
                      {item.merchant && (
                        <Text style={styles.merchantTag}>📍 {item.merchant}</Text>
                      )}
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.reviewFooter}>
          <Pressable
            onPress={handleSaveAll}
            disabled={saving || selectedCount === 0}
            style={[styles.saveBtn, (saving || selectedCount === 0) && styles.saveBtnDisabled]}
          >
            {saving
              ? <ActivityIndicator color={colors.black} />
              : <Text style={styles.saveBtnText}>Add {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}</Text>
            }
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Idle / Scanning state ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Smart SMS Scan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.idleContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.illustration}>
          <View style={styles.illustrationCircle}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.cyan} />
          </View>
          <Text style={styles.illustrationTitle}>Auto-Detect Transactions</Text>
          <Text style={styles.illustrationDesc}>
            Fintter scans your SMS inbox to find bank and UPI messages. You review and confirm which ones to add — nothing is added without your approval.
          </Text>
        </Animated.View>

        {noNativeModule && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.warningCard}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Development Build Required</Text>
              <Text style={styles.warningText}>
                SMS reading requires a custom development build. Run{' '}
                <Text style={styles.warningCode}>eas build --profile development</Text>
                {' '}to enable this feature.
              </Text>
            </View>
          </Animated.View>
        )}

        {permissionDenied && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={[styles.warningCard, { borderColor: colors.expense + '40' }]}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.expense} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: colors.expense }]}>Permission Denied</Text>
              <Text style={styles.warningText}>Please grant SMS permission in your device settings to use this feature.</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.howItWorks}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            { icon: 'search-outline', text: 'Scans up to 200 recent SMS messages' },
            { icon: 'filter-outline', text: 'Detects bank and UPI financial messages' },
            { icon: 'create-outline', text: 'You review and edit each transaction' },
            { icon: 'checkmark-circle-outline', text: 'Only confirmed items are added' },
          ].map((step, i) => (
            <View key={i} style={styles.howStep}>
              <Ionicons name={step.icon as any} size={18} color={colors.cyan} />
              <Text style={styles.howStepText}>{step.text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Pressable
            onPress={handleScan}
            disabled={phase === 'scanning'}
            style={[styles.scanBtn, phase === 'scanning' && styles.scanBtnDisabled]}
          >
            {phase === 'scanning' ? (
              <>
                <ActivityIndicator color={colors.black} style={{ marginRight: 10 }} />
                <Text style={styles.scanBtnText}>Scanning SMS...</Text>
              </>
            ) : (
              <>
                <Ionicons name="scan-outline" size={20} color={colors.black} style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>Scan My SMS Inbox</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 20 },
  headerBtn: { padding: 8 },
  headerCount: { fontSize: 14, fontWeight: '700', color: colors.cyan },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'center' },

  // Idle
  idleContent: { padding: 24, paddingTop: 8 },
  illustration: { alignItems: 'center', marginBottom: 32 },
  illustrationCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.cyanGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  illustrationTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  illustrationDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  warningCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.surface1, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.warning + '40', marginBottom: 20 },
  warningTitle: { fontSize: 14, fontWeight: '700', color: colors.warning, marginBottom: 4 },
  warningText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  warningCode: { fontFamily: 'SpaceMono-Regular', fontSize: 12, color: colors.cyan },

  howItWorks: { backgroundColor: colors.surface1, borderRadius: 14, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: colors.border },
  howTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  howStepText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

  scanBtn: { flexDirection: 'row', backgroundColor: colors.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },

  // Review
  walletSelectorWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  walletSelectorLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  walletChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletChipText: { fontSize: 13, color: colors.textSecondary },
  walletChipTextActive: { color: colors.cyan, fontWeight: '600' },

  reviewContent: { padding: 16 },
  reviewCard: { backgroundColor: colors.surface1, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  reviewCardDimmed: { opacity: 0.4 },
  reviewCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  checkWrap: { padding: 2 },
  reviewInfo: { flex: 1 },
  reviewAmount: { fontSize: 18, fontWeight: '700', fontFamily: 'SpaceMono-Regular' },
  reviewSender: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  typePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  typePillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  reviewEditArea: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewFieldLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 8, marginRight: 12, minWidth: 60 },
  reviewInput: { flex: 1, backgroundColor: colors.surface2, borderRadius: 10, padding: 10, color: colors.textPrimary, fontSize: 16, fontFamily: 'SpaceMono-Regular', borderWidth: 1, borderColor: colors.border },

  catChip: { alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 10, padding: 8, width: 68, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  catChipIcon: { fontSize: 18, marginBottom: 2 },
  catChipName: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },

  merchantTag: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  reviewFooter: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface0 },
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },

  // Done
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  doneTitle: { fontSize: 26, fontWeight: '700', color: colors.income, marginTop: 20, textAlign: 'center' },
  doneSub: { fontSize: 15, color: colors.textMuted, marginTop: 8 },
  doneBtn: { marginTop: 40, backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
