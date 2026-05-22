/**
 * Parser Rules Management Screen — view, toggle, and manage SMS parser rules.
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@src/theme';
import { parserRuleRepository, type ParserRule } from '@src/db/repositories/parserRuleRepository';

export default function ParserRulesScreen() {
  const router = useRouter();
  const [rules, setRules] = useState<ParserRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = async () => {
    setLoading(true);
    try {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Parser Rules</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8, marginRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textPrimary },
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
});
