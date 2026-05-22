/**
 * Wallet Management Screen — Create, edit, delete wallets and set default.
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';
import type { Wallet, WalletType } from '@src/features/wallets/types';

const WALLET_ICONS: Record<WalletType, string> = {
  cash: '💵', bank: '🏦', credit: '💳', upi: '📱', crypto: '₿', other: '💼',
};

const WALLET_TYPES: WalletType[] = ['cash', 'bank', 'credit', 'upi', 'other'];

interface WalletFormState {
  name: string;
  type: WalletType;
  icon: string;
  balance: string;
}

const defaultForm: WalletFormState = { name: '', type: 'bank', icon: '🏦', balance: '0' };

export default function WalletsScreen() {
  const router = useRouter();
  const wallets = useStore((s) => s.wallets);
  const addWallet = useStore((s) => s.addWallet);
  const deleteWallet = useStore((s) => s.deleteWallet);
  const setDefaultWallet = useStore((s) => s.setDefaultWallet);
  const fetchWallets = useStore((s) => s.fetchWallets);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WalletFormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchWallets(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addWallet({
        name: form.name.trim(),
        type: form.type,
        icon: form.icon,
        currency: 'INR',
        balance: Math.round(parseFloat(form.balance || '0') * 100),
      });
      setForm(defaultForm);
      setShowForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = (wallet: Wallet) => {
    if (wallet.isDefault) { Alert.alert('Cannot Delete', 'Set another wallet as default first.'); return; }
    Alert.alert('Delete Wallet', `Delete "${wallet.name}"? This will not affect transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWallet(wallet.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Wallets</Text>
        <Pressable onPress={() => setShowForm(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.cyan} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {wallets.map((w, i) => (
          <Animated.View key={w.id} entering={FadeInDown.delay(i * 60).duration(300)}>
            <View style={styles.walletCard}>
              <Text style={styles.walletIcon}>{w.icon ?? WALLET_ICONS[w.type]}</Text>
              <View style={styles.walletInfo}>
                <View style={styles.walletNameRow}>
                  <Text style={styles.walletName}>{w.name}</Text>
                  {!!w.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.walletMeta}>{w.type.toUpperCase()} • {formatAmount(w.balance)}</Text>
              </View>
              <View style={styles.walletActions}>
                {!w.isDefault && (
                  <Pressable onPress={() => setDefaultWallet(w.id)} style={styles.actionBtn}>
                    <Ionicons name="star-outline" size={18} color={colors.cyan} />
                  </Pressable>
                )}
                <Pressable onPress={() => handleDelete(w)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.expense} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Wallet Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowForm(false)} />
        <View style={styles.formSheet}>
          <View style={styles.formHandle} />
          <Text style={styles.formTitle}>New Wallet</Text>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. HDFC Savings"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
            {WALLET_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setForm({ ...form, type: t, icon: WALLET_ICONS[t] })}
                style={[styles.typeChip, form.type === t && styles.typeChipActive]}
              >
                <Text style={styles.typeChipIcon}>{WALLET_ICONS[t]}</Text>
                <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Opening Balance (₹)</Text>
          <TextInput
            style={styles.input}
            value={form.balance}
            onChangeText={(v) => setForm({ ...form, balance: v })}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable
            onPress={handleSave}
            disabled={!form.name.trim() || saving}
            style={[styles.saveBtn, (!form.name.trim() || saving) && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Add Wallet'}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  addBtn: { padding: 8 },
  content: { padding: 16 },

  walletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  walletIcon: { fontSize: 28, marginRight: 14 },
  walletInfo: { flex: 1 },
  walletNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  walletName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  defaultBadge: { backgroundColor: colors.cyanGlow, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  defaultText: { fontSize: 10, color: colors.cyan, fontWeight: '700' },
  walletMeta: { fontSize: 12, color: colors.textMuted },
  walletActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },

  // Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  formSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  formHandle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  typeRow: { marginBottom: 4 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  typeChipIcon: { fontSize: 16 },
  typeChipText: { fontSize: 13, color: colors.textSecondary },
  typeChipTextActive: { color: colors.cyan, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
