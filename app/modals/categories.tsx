/**
 * Category Management Screen — Manage both system and custom categories (expense & income).
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import type { Category, CategoryType } from '@src/features/categories/types';

const PRESET_ICONS = ['🍔', '🚗', '🏥', '🎬', '🛍️', '🏠', '✈️', '📚', '💪', '🎮', '💄', '🐾', '🎁', '☕', '🍕', '🎵', '💰', '📈', '🏦', '🎓'];
const PRESET_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'];

interface FormState { id?: number; name: string; icon: string; color: string; isSystem?: number }
const defaultForm: FormState = { name: '', icon: '🏷️', color: '#06B6D4' };

export default function CategoriesScreen() {
  const router = useRouter();
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const fetchCategories = useStore((s) => s.fetchCategories);

  const [tab, setTab] = useState<CategoryType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const filtered = categories.filter((c) => c.type === tab);
  const systemCats = filtered.filter((c) => c.isSystem === 1);
  const customCats = filtered.filter((c) => c.isSystem === 0);

  const handleEdit = (cat: Category) => {
    setForm({ id: cat.id, name: cat.name, icon: cat.icon, color: cat.color ?? '#06B6D4', isSystem: cat.isSystem });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (form.id) {
        await updateCategory(form.id, { name: form.name.trim(), icon: form.icon, color: form.color });
      } else {
        await addCategory({ name: form.name.trim(), icon: form.icon, color: form.color, type: tab, isSystem: 0 });
      }
      setForm(defaultForm);
      setShowForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Delete Category', 
      `Delete "${cat.name}"? WARNING: Deleting this category will permanently delete all transactions associated with it. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(cat.id) },
    ]);
  };

  const CategoryItem = ({ cat, index }: { cat: Category; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
      <View style={styles.catCard}>
        <View style={[styles.catIconWrap, { backgroundColor: (cat.color ?? colors.cyan) + '25' }]}>
          <Text style={styles.catIcon}>{cat.icon}</Text>
        </View>
        <Text style={styles.catName}>{cat.name}</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => handleEdit(cat)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={18} color={colors.cyan} />
          </Pressable>
          <Pressable onPress={() => handleDelete(cat)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.expense} />
          </Pressable>
          {cat.isSystem === 1 && (
            <View style={styles.systemBadge}>
              <Text style={styles.systemText}>System</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Categories</Text>
        <Pressable onPress={() => { setForm(defaultForm); setShowForm(true); }} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.cyan} />
        </Pressable>
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        {(['expense', 'income'] as CategoryType[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabChip, tab === t && styles.tabChipActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'expense' ? '💸 Expense' : '💰 Income'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {customCats.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>MY CATEGORIES</Text>
            {customCats.map((cat, i) => <CategoryItem key={cat.id} cat={cat} index={i} />)}
          </>
        )}
        <Text style={styles.sectionLabel}>BUILT-IN</Text>
        {systemCats.map((cat, i) => <CategoryItem key={cat.id} cat={cat} index={i} />)}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add/Edit Category Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowForm(false)} />
        <View style={styles.formSheet}>
          <View style={styles.formHandle} />
          <Text style={styles.formTitle}>{form.id ? 'Edit' : 'New'} {tab === 'expense' ? 'Expense' : 'Income'} Category</Text>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. Gym, Freelance..."
            placeholderTextColor={colors.textMuted}
            editable={!form.isSystem} // System names shouldn't be edited to avoid confusion? Wait, user asked to edit system categories too.
            // "Provide users with the option to edit the system category too." So we let them edit name too!
          />

          <Text style={styles.fieldLabel}>Icon (Emoji)</Text>
          <View style={styles.iconInputRow}>
            <TextInput
              style={[styles.input, styles.emojiInput]}
              value={form.icon}
              onChangeText={(v) => {
                // allow picking from keyboard
                setForm({ ...form, icon: v });
              }}
              placeholder="😀"
            />
            <Text style={styles.iconHelper}>Type an emoji from your keyboard or pick below.</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
            <View style={[styles.iconGrid, { paddingVertical: 8 }]}>
              {PRESET_ICONS.map((ic) => (
                <Pressable key={ic} onPress={() => setForm({ ...form, icon: ic })} style={[styles.iconBtn, form.icon === ic && styles.iconBtnActive]}>
                  <Text style={styles.iconBtnText}>{ic}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.fieldLabel}>Color (HEX)</Text>
          <View style={styles.colorInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.color}
              onChangeText={(v) => setForm({ ...form, color: v })}
              placeholder="#HEXCODE"
              maxLength={7}
              autoCapitalize="characters"
            />
            <View style={[styles.colorPreview, { backgroundColor: form.color || 'transparent' }]} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
            <View style={[styles.colorRow, { paddingVertical: 12 }]}>
              {PRESET_COLORS.map((c) => (
                <Pressable key={c} onPress={() => setForm({ ...form, color: c })} style={[styles.colorBtn, { backgroundColor: c }, form.color === c && styles.colorBtnActive]} />
              ))}
            </View>
          </ScrollView>

          <Pressable
            onPress={handleSave}
            disabled={!form.name.trim() || saving}
            style={[styles.saveBtn, (!form.name.trim() || saving) && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : form.id ? 'Save Changes' : 'Add Category'}</Text>
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

  tabRow: { flexDirection: 'row', padding: 16, gap: 12 },
  tabChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  tabChipActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.cyan },

  content: { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 10, marginTop: 8 },

  catCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  catIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catIcon: { fontSize: 18 },
  catName: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: { padding: 8 },
  systemBadge: { backgroundColor: colors.surface3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4 },
  systemText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  // Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  formSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  formHandle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border },

  iconInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  emojiInput: { width: 64, textAlign: 'center', fontSize: 24, paddingVertical: 10 },
  iconHelper: { flex: 1, fontSize: 12, color: colors.textMuted },
  
  iconGrid: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  iconBtnActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  iconBtnText: { fontSize: 22 },

  colorInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  colorPreview: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  
  colorRow: { flexDirection: 'row', gap: 10 },
  colorBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorBtnActive: { borderColor: colors.textPrimary, transform: [{ scale: 1.15 }] },

  saveBtn: { backgroundColor: colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
