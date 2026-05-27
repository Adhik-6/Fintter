/**
 * Parser Rules Management Screen — view, toggle, and manage SMS parser rules.
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@src/theme';
import { parserRuleRepository, type ParserRule } from '@src/db/repositories/parserRuleRepository';

export default function ParserRulesScreen() {
  const router = useRouter();
  const [rules, setRules] = useState<ParserRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', source: 'sms' as const, pattern: '', type: 'expense' as 'expense' | 'income' });

  const loadRules = async () => {
    setLoading(true);
    try {
      await parserRuleRepository.seedDefaultRules();
      const all = await parserRuleRepository.getAll();
      setRules(all);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadRules(); }, []);

  const handleToggle = async (rule: ParserRule) => {
    await parserRuleRepository.toggleActive(rule.id, rule.isActive ? 0 : 1);
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, isActive: r.isActive ? 0 : 1 } : r));
  };

  const handleDelete = (rule: ParserRule) => {
    Alert.alert('Delete Rule', `Delete "${rule.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await parserRuleRepository.delete(rule.id);
          setRules((prev) => prev.filter((r) => r.id !== rule.id));
        }
      },
    ]);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.pattern.trim()) return;
    setSaving(true);
    try {
      await parserRuleRepository.create({
        name: form.name.trim(),
        source: form.source,
        pattern: form.pattern.trim(),
        amountGroup: null,
        merchantGroup: null,
        type: form.type,
        defaultCategoryId: null,
        isActive: 1,
      });
      await loadRules();
      setShowForm(false);
      setForm({ name: '', source: 'sms', pattern: '', type: 'expense' });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save the rule. Check your pattern.');
    }
    setSaving(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Parser Rules</Text>
        <Pressable onPress={() => setShowForm(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.cyan} />
        </Pressable>
      </View>

      <Text style={styles.description}>
        These regex rules match financial SMS messages and extract transaction details automatically.
      </Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Loading rules…</Text>
        ) : rules.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="code-slash-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No parser rules</Text>
          </View>
        ) : (
          rules.map((rule, i) => (
            <Animated.View key={rule.id} entering={FadeInDown.delay(i * 50).duration(260)}>
              <View style={[styles.card, !rule.isActive && styles.cardInactive]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: rule.type === 'expense' ? colors.expense + '20' : colors.income + '20' }]}>
                      <Text style={[styles.typeText, { color: rule.type === 'expense' ? colors.expense : colors.income }]}>
                        {rule.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.ruleName}>{rule.name}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Switch
                      value={!!rule.isActive}
                      onValueChange={() => handleToggle(rule)}
                      trackColor={{ false: colors.surface3, true: colors.cyanGlow }}
                      thumbColor={rule.isActive ? colors.cyan : colors.textMuted}
                    />
                    <Pressable onPress={() => handleDelete(rule)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color={colors.expense} />
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.pattern} numberOfLines={2}>{rule.pattern}</Text>
                <Text style={styles.source}>Source: {rule.source.toUpperCase()}</Text>
              </View>
            </Animated.View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          style={styles.overlayContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.overlayFlex} onPress={() => setShowForm(false)} />
          <View style={styles.formSheet}>
            <View style={styles.formHandle} />
            <Text style={styles.formTitle}>New Parser Rule</Text>

            <Text style={styles.fieldLabel}>Rule Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. HDFC Credit Card"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setForm({ ...form, type: 'expense' })}
                style={[styles.typeChip, form.type === 'expense' && { borderColor: colors.expense, backgroundColor: colors.expense + '20' }]}
              >
                <Text style={[styles.typeChipText, form.type === 'expense' && { color: colors.expense }]}>Expense</Text>
              </Pressable>
              <Pressable
                onPress={() => setForm({ ...form, type: 'income' })}
                style={[styles.typeChip, form.type === 'income' && { borderColor: colors.income, backgroundColor: colors.income + '20' }]}
              >
                <Text style={[styles.typeChipText, form.type === 'income' && { color: colors.income }]}>Income</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Regex Pattern</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'SpaceMono-Regular', fontSize: 12 }]}
              value={form.pattern}
              onChangeText={(v) => setForm({ ...form, pattern: v })}
              placeholder={`Rs\.?(?<amount>[\d,.]+).*to (?<merchant>\w+)`}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.fieldLabel, { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: 'normal' }]}>
              Use named capture groups (?&lt;amount&gt;...) and (?&lt;merchant&gt;...) to extract values.
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={!form.name.trim() || !form.pattern.trim() || saving}
              style={[styles.saveBtn, (!form.name.trim() || !form.pattern.trim() || saving) && styles.saveBtnDisabled]}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Add Rule'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  description: { fontSize: 13, color: colors.textMuted, padding: 16, lineHeight: 20 },
  content: { padding: 16 },
  loadingText: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginTop: 12 },

  card: { backgroundColor: colors.surface1, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardInactive: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: '700' },
  ruleName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtn: { padding: 8 },
  pattern: { fontSize: 11, color: colors.textMuted, fontFamily: 'SpaceMono-Regular', backgroundColor: colors.surface2, borderRadius: 8, padding: 8, marginBottom: 6 },
  source: { fontSize: 11, color: colors.textMuted },

  // Modal — no scroll, intrinsic height
  overlayContainer: { flex: 1, justifyContent: 'flex-end' },
  overlayFlex: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  formSheet: { backgroundColor: colors.surface1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  formHandle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  typeChipText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  saveBtn: { backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
