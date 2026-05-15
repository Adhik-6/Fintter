/**
 * Category Picker Modal
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@src/store';
import { colors } from '@src/theme';

export default function CategoryPickerModal() {
  const router = useRouter();
  const categories = useStore((s) => s.categories);
  const [search, setSearch] = useState('');
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>Select Category</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.close}>✕</Text></Pressable>
      </View>
      <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Search categories..." placeholderTextColor={colors.textMuted} />
      <ScrollView contentContainerStyle={styles.grid}>
        {filtered.map((cat) => (
          <Pressable key={cat.id} style={styles.catItem} onPress={() => router.back()}>
            <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}><Text style={styles.catEmoji}>{cat.icon}</Text></View>
            <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  close: { fontSize: 20, color: colors.textSecondary },
  search: { marginHorizontal: 20, backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, gap: 12 },
  catItem: { width: '22%', alignItems: 'center' },
  catIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catEmoji: { fontSize: 24 },
  catName: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
});
