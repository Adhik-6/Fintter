/**
 * Transaction Detail Modal — view, edit, and delete a transaction.
 */
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount, parseAmountToSmallestUnit } from '@src/utils/currency';
import { formatTransactionDate, formatTime } from '@src/utils/date';
import { transactionRepository } from '@src/db/repositories/transactionRepository';
import type { TransactionWithDetails, TransactionType } from '@src/features/transactions/types';

const TYPES: { label: string; value: TransactionType; color: string }[] = [
  { label: 'Expense', value: 'expense', color: colors.expense },
  { label: 'Income', value: 'income', color: colors.income },
  { label: 'Transfer', value: 'transfer', color: colors.transfer },
];

const TRANSFER_CATEGORIES = [
  { id: -1, name: 'Wallet Transfer', icon: '🔄', color: colors.transfer },
];

export default function TransactionDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [tx, setTx] = useState<TransactionWithDetails | null>(null);
  
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const fetchWallets = useStore((s) => s.fetchWallets);
  const fetchTransactions = useStore((s) => s.fetchTransactions);
  const categories = useStore((s) => s.categories);
  const wallets = useStore((s) => s.wallets);

  // Edit state
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
  const [moods, setMoods] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    import('@src/db/repositories/moodRepository').then(m => {
      m.moodRepository.getAll().then(setMoods);
    });
  }, []);

  useEffect(() => {
    if (params.id) {
      transactionRepository.getById(Number(params.id)).then((t) => {
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
        }
      });
    }
  }, [params.id]);

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (tx) {
            await deleteTransaction(tx.id);
            await fetchWallets();
            router.back();
          }
        }
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!tx || !editAmount || saving) return;
    if (editType !== 'transfer' && !editCategoryId) return;

    setSaving(true);
    try {
      let categoryId = editCategoryId ?? categories[0]?.id;
      if (editType === 'transfer' || categoryId === -1) {
        categoryId = categories[0]?.id ?? 1;
      }
      await updateTransaction(tx.id, {
        amount: parseAmountToSmallestUnit(editAmount),
        note: editNote || undefined,
        type: editType,
        categoryId,
        walletId: editWalletId,
        toWalletId: editType === 'transfer' ? editToWalletId : undefined,
        merchant: editMerchant || undefined,
        moodId: editMoodId,
        isImpulse: editIsImpulse ? 1 : 0,
      });
      await fetchWallets();
      await fetchTransactions({ limit: 50 });
      // Refresh local tx
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

  const filteredCategories = editType === 'transfer'
    ? TRANSFER_CATEGORIES
    : categories.filter((c) => c.type === editType);

  const activeType = TYPES.find((t) => t.value === editType);
  const canSave = !!editAmount && !saving && (editType === 'transfer' || !!editCategoryId);

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
        <View style={[styles.iconWrap, { backgroundColor: (tx.categoryColor ?? colors.cyan) + '20' }]}>
          <Text style={styles.bigIcon}>{tx.categoryIcon}</Text>
        </View>

        <Text style={[styles.amount, { color: amountColor }]}>
          {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
        </Text>
        <Text style={styles.type}>{tx.type.toUpperCase()}</Text>

        <View style={styles.detailCard}>
          <DetailRow label="Category" value={`${tx.categoryIcon} ${tx.categoryName}`} />
          <DetailRow label="Wallet" value={tx.walletName} />
          {tx.toWalletId && <DetailRow label="To Wallet" value={wallets.find(w => w.id === tx.toWalletId)?.name ?? 'Unknown'} />}
          <DetailRow label="Date" value={formatTransactionDate(tx.date)} />
          <DetailRow label="Time" value={formatTime(tx.date)} />
          {tx.merchant && <DetailRow label="Merchant" value={tx.merchant} />}
          {tx.note && <DetailRow label="Note" value={tx.note} />}
          {tx.moodEmoji && <DetailRow label="Mood" value={`${tx.moodEmoji} ${tx.moodLabel ?? ''}`} />}
          <DetailRow label="Source" value={tx.source} />
          {tx.isImpulse === 1 && <DetailRow label="Impulse" value="⚠️ Yes" />}
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
            <Text style={styles.editTitle}>Edit Transaction</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <View style={styles.typeRow}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => {
                      setEditType(t.value);
                      if (t.value !== 'transfer') {
                         const firstCat = categories.find(c => c.type === t.value);
                         setEditCategoryId(firstCat ? firstCat.id : null);
                      } else {
                         setEditCategoryId(-1);
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
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={styles.categoryGrid}>
                  {filteredCategories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setEditCategoryId(cat.id)}
                      style={[
                        styles.categoryChip,
                        editCategoryId === cat.id && { backgroundColor: (cat.color ?? colors.cyan) + '25', borderColor: cat.color ?? colors.cyan },
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={[styles.categoryName, editCategoryId === cat.id && { color: colors.textPrimary }]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>{editType === 'transfer' ? 'From Wallet' : 'Wallet'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
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

              {editType === 'transfer' && (
                <>
                  <Text style={styles.fieldLabel}>To Wallet</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {wallets.filter(w => w.id !== editWalletId).map((w) => (
                      <Pressable
                        key={w.id}
                        onPress={() => setEditToWalletId(w.id)}
                        style={[styles.walletChip, editToWalletId === w.id && styles.walletChipActive]}
                      >
                        <Text style={styles.walletIcon}>{w.icon ?? '💳'}</Text>
                        <Text style={[styles.walletText, editToWalletId === w.id && styles.walletTextActive]}>{w.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.fieldLabel}>Merchant</Text>
              <TextInput
                style={[styles.editInput, { marginBottom: 12 }]}
                value={editMerchant}
                onChangeText={setEditMerchant}
                placeholder="Merchant (e.g. Starbucks)"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Note</Text>
              <TextInput
                style={[styles.editInput, styles.editNoteInput, { marginBottom: 12 }]}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add a note..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Text style={styles.fieldLabel}>Mood</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {moods.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setEditMoodId(m.id)}
                    style={[styles.moodChip, editMoodId === m.id && styles.moodChipActive]}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, editMoodId === m.id && styles.moodLabelActive]}>{m.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                onPress={() => setEditIsImpulse(!editIsImpulse)}
                style={styles.impulseToggle}
              >
                <Text style={styles.impulseText}>Is this an impulse purchase?</Text>
                <View style={[styles.checkbox, editIsImpulse && styles.checkboxActive]}>
                  {editIsImpulse && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
              </Pressable>

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
  headerBtn: { padding: 8 },
  headerActions: { flexDirection: 'row', gap: 4 },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },

  scroll: { flex: 1 },
  content: { alignItems: 'center', padding: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bigIcon: { fontSize: 36 },
  amount: { fontSize: 36, fontWeight: '700', fontFamily: 'SpaceMono-Regular', marginBottom: 4 },
  type: { fontSize: 13, color: colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: 24 },

  detailCard: { width: '100%', backgroundColor: colors.surface1, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 14, color: colors.textMuted },
  detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },

  // Edit Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  editSheetContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '90%' },
  editSheet: { backgroundColor: colors.surface1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 20, height: '100%' },
  editHandle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  editTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  editInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  editNoteInput: { minHeight: 80, textAlignVertical: 'top', marginBottom: 4 },
  
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  
  categoryGrid: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  categoryChip: { alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 14, padding: 10, width: 76, borderWidth: 1, borderColor: colors.border },
  categoryIcon: { fontSize: 22, marginBottom: 4 },
  categoryName: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  
  walletChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  walletIcon: { fontSize: 16, marginRight: 6 },
  walletText: { fontSize: 13, color: colors.textSecondary },
  walletTextActive: { color: colors.cyan, fontWeight: '600' },
  
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },

  // Optional fields styles
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
