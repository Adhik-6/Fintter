/**
 * Onboarding — Setup Categories
 */
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@src/theme';
import { useStore } from '@src/store';

export default function SetupCategoriesScreen() {
  const router = useRouter();
  const categories = useStore((s) => s.categories);
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const handleComplete = () => {
    // TODO: save onboarding complete flag to KV store
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.step}>Step 2 of 2</Text>
        <Text style={styles.title}>Your categories</Text>
        <Text style={styles.subtitle}>These are pre-configured. You can customize later.</Text>
      </Animated.View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Expense Categories</Text>
        <View style={styles.grid}>
          {expenseCategories.map((cat) => (
            <View key={cat.id} style={styles.catItem}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Income Categories</Text>
        <View style={styles.grid}>
          {incomeCategories.map((cat) => (
            <View key={cat.id} style={styles.catItem}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable onPress={handleComplete} style={styles.doneBtn}>
        <Text style={styles.doneText}>Start Using Fintter 🚀</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0, padding: 24, paddingTop: 60 },
  step: { fontSize: 13, color: colors.cyan, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  list: { flex: 1 },
  sectionLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  catItem: { width: '22%', alignItems: 'center' },
  catIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catEmoji: { fontSize: 24 },
  catName: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  doneBtn: { backgroundColor: colors.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  doneText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
