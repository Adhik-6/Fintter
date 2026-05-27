/**
 * Transaction Detail Modal — polished view & full-height edit with improved UX.
 */
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert,
  TextInput, Modal, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount, parseAmountToSmallestUnit, formatAmountCompact } from '@src/utils/currency';
import { formatTransactionDate, formatTime } from '@src/utils/date';
import { transactionRepository } from '@src/db/repositories/transactionRepository';
import type { TransactionWithDetails, TransactionType } from '@src/features/transactions/types';
import { format, addDays } from 'date-fns';

const TYPES: { label: string; value: TransactionType; color: string; icon: string }[] = [
  { label: 'Expense', value: 'expense', color: colors.expense, icon: '↑' },
  { label: 'Income', value: 'income', color: colors.income, icon: '↓' },
  { label: 'Transfer', value: 'transfer', color: colors.transfer, icon: '⇄' },
];

const TRANSFER_CATEGORIES = [{ id: -1, name: 'Wallet Transfer', icon: '🔄', color: colors.transfer }] as any[];

const TYPE_ICONS: Record<TransactionType, string> = {
  expense: 'arrow-up-circle',
  income: 'arrow-down-circle',
  transfer: 'swap-horizontal',
};

export default function TransactionDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [tx, setTx] = useState<TransactionWithDetails | null>(null);
  const [linkedRecurring, setLinkedRecurring] = useState<any | null>(null);

  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const fetchWallets = useStore((s) => s.fetchWallets);
  const fetchTransactions = useStore((s) => s.fetchTransactions);
  const computeBudgetProgress = useStore((s) => s.computeBudgetProgress);
  const categories = useStore((s) => s.categories);
  const wallets = useStore((s) => s.wallets);
  const addTransaction = useStore((s) => s.addTransaction);

  const [showEdit, setShowEdit] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editWalletId, setEditWalletId] = useState<number>(0);
  const [editToWalletId, setEditToWalletId] = useState<number | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editMoodId, setEditMoodId] = useState<number | null>(null);
  const [editIsImpulse, setEditIsImpulse] = useState(false);
  const [editMakeRecurring, setEditMakeRecurring] = useState(false);
  const [editRecurringDays, setEditRecurringDays] = useState('30');
  const [moods, setMoods] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    import('@src/db/repositories/moodRepository').then(m => {
      m.moodRepository.getAll().then(setMoods);
    });
  }, []);

  useEffect(() => {
    if (params.id) {
      transactionRepository.getById(Number(params.id)).then(async (t) => {
        setTx(t);
        if (t) {
          setEditAmount((t.amount / 100).toFixed(2));
          setEditNote(t.note ?? '');
          setEditType(t.type);
          setEditCategoryId(t.categoryId);
          setEditWalletId(t.walletId);
          setEditToWalletId(t.toWalletId ?? null);
          setEditMerchant(t.merchant ?? '');
          setEditMoodId(t.moodId ?? null);
          setEditIsImpulse(t.isImpulse === 1);
          setEditMakeRecurring(t.isRecurring === 1);
          setEditRecurringDays(t.recurringDays?.toString() ?? '30');

        }
      });
    }
  }, [params.id]);

  // Fix toWalletId when fromWallet changes
  useEffect(() => {
    if (editToWalletId === editWalletId) setEditToWalletId(null);
  }, [editWalletId]);

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (tx) {
            await deleteTransaction(tx.id);
            await fetchWallets();
            computeBudgetProgress();
            router.back();
          }
        }
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!tx || !editAmount || saving) return;

    setSaving(true);
    try {
      let categoryId = editCategoryId ?? categories[0]?.id;
      if (editType === 'transfer' || categoryId === -1) {
        categoryId = categories[0]?.id ?? 1;
      }

      // Create or Update recurring next node if checked
      let nextTransactionId: number | null = tx.nextTransactionId ?? null;
      if (editMakeRecurring && editType !== 'transfer') {
        const { format, addDays } = await import('date-fns');
        const days = parseInt(editRecurringDays, 10);
        const safeDays = isNaN(days) || days < 1 ? 30 : days;
        
        const currentDate = new Date(tx.date);
        const nextDate = addDays(currentDate, safeDays);
        const nextDateStr = format(nextDate, 'yyyy-MM-dd');
        
        if (nextTransactionId) {
          // The next node exists, update its date and details
          await updateTransaction(nextTransactionId, {
            amount: parseAmountToSmallestUnit(editAmount),
            type: editType as 'expense' | 'income',
            categoryId: categoryId!,
            walletId: editWalletId,
            note: editNote || undefined,
            merchant: editType === 'expense' ? (editMerchant || undefined) : undefined,
            moodId: editType === 'expense' ? editMoodId : null,
            isImpulse: editType === 'expense' && editIsImpulse ? 1 : 0,
            recurringDays: safeDays,
            date: nextDateStr,
          });
        } else {
          // Create new next node
          nextTransactionId = await addTransaction({
            amount: parseAmountToSmallestUnit(editAmount),
            type: editType as 'expense' | 'income',
            categoryId: categoryId!,
            walletId: editWalletId,
            note: editNote || undefined,
            merchant: editType === 'expense' ? (editMerchant || undefined) : undefined,
            moodId: editType === 'expense' ? editMoodId : null,
            isImpulse: editType === 'expense' && editIsImpulse ? 1 : 0,
            isRecurring: 1,
            recurringDays: safeDays,
            source: 'manual',
            date: nextDateStr,
          });
        }
      }

      await updateTransaction(tx.id, {
        amount: parseAmountToSmallestUnit(editAmount),
        note: editNote || undefined,
        type: editType,
        categoryId,
        walletId: editWalletId,
        toWalletId: editType === 'transfer' ? editToWalletId : undefined,
        merchant: editType === 'expense' ? (editMerchant || undefined) : undefined,
        moodId: editType === 'expense' ? editMoodId : null,
        isImpulse: editType === 'expense' && editIsImpulse ? 1 : 0,
        isRecurring: editMakeRecurring ? 1 : 0,
        recurringDays: editMakeRecurring ? (parseInt(editRecurringDays, 10) || 30) : null,
        nextTransactionId: editMakeRecurring ? nextTransactionId : null,
      });

      // Immediate refresh
      await fetchWallets();
      await fetchTransactions({ limit: 500 });
      computeBudgetProgress();

      // Refresh local state
      const updated = await transactionRepository.getById(tx.id);
      setTx(updated);
      setShowEdit(false);
    } catch (e) {
      console.error('[TxDetail] Update error:', e);
    }
    setSaving(false);
  };

  if (!tx) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const amountColor = tx.type === 'income' ? colors.income : tx.type === 'transfer' ? colors.transfer : colors.expense;
  const typeInfo = TYPES.find(t => t.value === tx.type)!;
  const filteredCategories = editType === 'transfer' ? TRANSFER_CATEGORIES : categories.filter(c => c.type === editType);
  const toWallets = wallets.filter(w => w.id !== editWalletId);
  const canSave = !!editAmount && !saving && (
    editType === 'transfer' ? (editToWalletId !== null && editToWalletId !== editWalletId) : !!editCategoryId
  );

  // Find recurring template linked to this transaction — loaded directly from DB above

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Transaction</Text>
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
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.heroSection}>
          <View style={[styles.iconWrap, { backgroundColor: (tx.categoryColor ?? colors.cyan) + '20' }]}>
            <Text style={styles.bigIcon}>{tx.categoryIcon}</Text>
          </View>
          <Text style={[styles.amount, { color: amountColor }]}>
            {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatAmount(tx.amount)}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={TYPE_ICONS[tx.type] as any} size={14} color={typeInfo.color} />
            <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{tx.type.toUpperCase()}</Text>
          </View>
          {/* Recurring badge */}
          {tx.isRecurring === 1 && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat" size={14} color={colors.cyan} />
              <Text style={styles.recurringBadgeText}>Recurring</Text>
            </View>
          )}
        </Animated.View>

        {/* Detail Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.detailCard}>
          <DetailRow icon="grid-outline" label="Category" value={`${tx.categoryIcon} ${tx.categoryName}`} />
          <DetailRow icon="wallet-outline" label="Wallet" value={tx.walletName} />
          {tx.toWalletId && <DetailRow icon="arrow-forward-outline" label="To Wallet" value={wallets.find(w => w.id === tx.toWalletId)?.name ?? 'Unknown'} />}
          <DetailRow icon="calendar-outline" label="Date" value={formatTransactionDate(tx.date)} />
          {tx.isRecurring === 1 && tx.recurringDays && (
            <DetailRow icon="repeat-outline" label="Next Due" value={formatTransactionDate(addDays(new Date(tx.date), tx.recurringDays).toISOString())} />
          )}
          <DetailRow icon="time-outline" label="Time" value={formatTime(tx.date)} />
          {tx.merchant && <DetailRow icon="storefront-outline" label="Merchant" value={tx.merchant} />}
          {tx.note && <DetailRow icon="document-text-outline" label="Note" value={tx.note} />}
          {tx.moodEmoji && <DetailRow icon="happy-outline" label="Mood" value={`${tx.moodEmoji} ${tx.moodLabel ?? ''}`} />}
          <DetailRow icon="information-circle-outline" label="Source" value={tx.source} />
          {tx.isImpulse === 1 && <DetailRow icon="flash-outline" label="Impulse" value="⚠️ Yes" valueColor={colors.warning} />}
        </Animated.View>
      </ScrollView>

      {/* Full-height Edit Modal */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <KeyboardAvoidingView
          style={styles.editModalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editSheet}>
            <View style={styles.editHeader}>
              <Pressable onPress={() => setShowEdit(false)} style={styles.headerBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
              <Text style={styles.editTitle}>Edit Transaction</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {/* Type */}
              <View style={styles.typeRow}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => {
                      setEditType(t.value);
                      if (t.value !== 'transfer') {
                        const firstCat = categories.find(c => c.type === t.value);
                        setEditCategoryId(firstCat?.id ?? null);
                      } else {
                        setEditCategoryId(-1);
                        setEditMakeRecurring(false);
                      }
                    }}
                    style={[styles.typeChip, editType === t.value && { backgroundColor: t.color + '20', borderColor: t.color }]}
                  >
                    <Text style={[styles.typeText, editType === t.value && { color: t.color }]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.editInput}
                value={editAmount}
                onChangeText={(v) => setEditAmount(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <FlatList
                data={filteredCategories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item: cat }) => (
                  <Pressable
                    onPress={() => setEditCategoryId(cat.id)}
                    style={[styles.categoryChip, editCategoryId === cat.id && { backgroundColor: (cat.color ?? colors.cyan) + '25', borderColor: cat.color ?? colors.cyan }]}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryName, editCategoryId === cat.id && { color: colors.textPrimary }]}>{cat.name}</Text>
                  </Pressable>
                )}
              />

              <Text style={styles.fieldLabel}>{editType === 'transfer' ? 'From Wallet' : 'Wallet'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {wallets.map((w) => (
                  <Pressable key={w.id} onPress={() => setEditWalletId(w.id)} style={[styles.walletChip, editWalletId === w.id && styles.walletChipActive]}>
                    <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                    <Text style={[styles.walletText, editWalletId === w.id && styles.walletTextActive]}>
                      {w.name} <Text style={{ color: w.balance < 0 ? colors.expense : (editWalletId === w.id ? colors.cyan : colors.textSecondary) }}>· {formatAmountCompact(w.balance)}</Text>
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {editType === 'transfer' && (
                <>
                  <Text style={styles.fieldLabel}>To Wallet</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {toWallets.map((w) => (
                      <Pressable key={w.id} onPress={() => setEditToWalletId(w.id)} style={[styles.walletChip, editToWalletId === w.id && styles.walletChipActive]}>
                        <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                        <Text style={[styles.walletText, editToWalletId === w.id && styles.walletTextActive]}>
                          {w.name} <Text style={{ color: w.balance < 0 ? colors.expense : (editToWalletId === w.id ? colors.cyan : colors.textSecondary) }}>· {formatAmountCompact(w.balance)}</Text>
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Expense-only fields */}
              {editType === 'expense' && (
                <>
                  <Text style={styles.fieldLabel}>Merchant</Text>
                  <TextInput
                    style={[styles.editInput, { marginBottom: 12 }]}
                    value={editMerchant}
                    onChangeText={setEditMerchant}
                    placeholder="Merchant (e.g. Starbucks)"
                    placeholderTextColor={colors.textMuted}
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>Note</Text>
              <TextInput
                style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 12 }]}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add a note..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              {/* Expense-only: Mood & Impulse */}
              {editType === 'expense' && (
                <>
                  <Text style={styles.fieldLabel}>Mood</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {moods.map((m) => (
                      <Pressable key={m.id} onPress={() => setEditMoodId(m.id)} style={[styles.moodChip, editMoodId === m.id && styles.moodChipActive]}>
                        <Text style={styles.moodEmoji}>{m.emoji}</Text>
                        <Text style={[styles.moodLabel, editMoodId === m.id && styles.moodLabelActive]}>{m.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Pressable onPress={() => setEditIsImpulse(!editIsImpulse)} style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Ionicons name="flash-outline" size={18} color={colors.warning} style={{ marginRight: 10 }} />
                      <Text style={styles.toggleText}>Impulse purchase?</Text>
                    </View>
                    <View style={[styles.checkbox, editIsImpulse && styles.checkboxActive]}>
                      {editIsImpulse && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                  </Pressable>
                </>
              )}

              {/* Recurring option (not for transfer) */}
              {editType !== 'transfer' && (
                <>
                  <Pressable
                    onPress={() => setEditMakeRecurring(!editMakeRecurring)}
                    style={[styles.toggleRow, editMakeRecurring && { borderColor: colors.cyan, backgroundColor: colors.cyanGlow }]}
                  >
                    <View style={styles.toggleLeft}>
                      <Ionicons name="repeat-outline" size={18} color={colors.cyan} style={{ marginRight: 10 }} />
                      <Text style={styles.toggleText}>Make recurring</Text>
                    </View>
                    <View style={[styles.checkbox, editMakeRecurring && { backgroundColor: colors.cyan, borderColor: colors.cyan }]}>
                      {editMakeRecurring && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                  </Pressable>

                  {editMakeRecurring && (
                    <View style={styles.recurringBox}>
                      <Text style={styles.fieldLabel}>Next occurrence in how many days?</Text>
                      <View style={styles.daysRow}>
                        {['7', '14', '30', '60', '90', '365'].map(d => (
                          <Pressable key={d} onPress={() => setEditRecurringDays(d)} style={[styles.dayChip, editRecurringDays === d && styles.dayChipActive]}>
                            <Text style={[styles.dayChipText, editRecurringDays === d && styles.dayChipTextActive]}>{d}d</Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                        <Text style={[styles.fieldLabel, { marginBottom: 0, marginTop: 0, flex: 1 }]}>Custom days:</Text>
                        <TextInput
                          style={[styles.editInput, { flex: 1, paddingVertical: 10, textAlign: 'center' }]}
                          value={editRecurringDays}
                          onChangeText={(v) => setEditRecurringDays(v.replace(/[^0-9]/g, ''))}
                          keyboardType="number-pad"
                          placeholder="30"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                      {(() => {
                        const d = parseInt(editRecurringDays, 10);
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
                    </View>
                  )}
                </>
              )}

              <Pressable
                onPress={handleSaveEdit}
                disabled={!canSave}
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
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

function DetailRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon as any} size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
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

  heroSection: { alignItems: 'center', marginBottom: 24, width: '100%' },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bigIcon: { fontSize: 40 },
  amount: { fontSize: 40, fontWeight: '700', fontFamily: 'SpaceMono-Regular', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cyanGlow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.cyan + '50' },
  recurringBadgeText: { fontSize: 12, color: colors.cyan, fontWeight: '600' },

  detailCard: { width: '100%', backgroundColor: colors.surface1, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLeft: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: colors.textMuted },
  detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },

  // Edit Modal
  editModalWrapper: { flex: 1 },
  editSheet: { flex: 1, backgroundColor: colors.surface0, marginTop: 0 },
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  editTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  saveHeaderBtn: { backgroundColor: colors.cyan, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveHeaderBtnText: { fontSize: 14, fontWeight: '700', color: colors.black },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  editInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },

  categoryChip: { alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 14, padding: 10, width: 76, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  categoryIcon: { fontSize: 22, marginBottom: 4 },
  categoryName: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

  walletChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletIcon: { fontSize: 16, marginRight: 6 },
  walletText: { fontSize: 13, color: colors.textSecondary },
  walletTextActive: { color: colors.cyan, fontWeight: '600' },

  moodChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  moodChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  moodEmoji: { fontSize: 16, marginRight: 4 },
  moodLabel: { fontSize: 13, color: colors.textSecondary },
  moodLabelActive: { color: colors.cyan, fontWeight: '600' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface2, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center' },
  toggleText: { fontSize: 14, color: colors.textPrimary },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.expense, borderColor: colors.expense },
  checkboxCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },

  recurringBox: { backgroundColor: colors.surface1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.cyan + '50', marginBottom: 12 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  dayChipActive: { backgroundColor: colors.cyanGlow, borderColor: colors.cyan },
  dayChipText: { fontSize: 13, color: colors.textMuted },
  dayChipTextActive: { color: colors.cyan, fontWeight: '600' },

  saveBtn: { backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
