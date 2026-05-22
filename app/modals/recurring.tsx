/**
 * Recurring Transactions Management Screen
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { formatAmount } from '@src/utils/currency';
import { format } from 'date-fns';

export default function RecurringScreen() {
  const router = useRouter();
  const recurringTemplates = useStore((s) => s.recurringTemplates);
  const fetchRecurring = useStore((s) => s.fetchRecurring);
  const deleteRecurring = useStore((s) => s.deleteRecurring);
  const updateRecurring = useStore((s) => s.updateRecurring);

  useEffect(() => { fetchRecurring(); }, []);

  const handleToggle = (id: number, isActive: number) => {
    updateRecurring(id, { isActive: isActive ? 0 : 1 });
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Recurring', `Delete "${name}"? This won't remove past transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecurring(id) },
    ]);
  };

  const FREQ_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Recurring Transactions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {recurringTemplates.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No recurring transactions</Text>
            <Text style={styles.emptySubtext}>Recurring transactions are auto-created by the app based on your setup.</Text>
          </View>
        ) : (
          recurringTemplates.map((rt, i) => (
            <Animated.View key={rt.id} entering={FadeInDown.delay(i * 50).duration(280)}>
              <View style={[styles.card, !rt.isActive && styles.cardInactive]}>
                <View style={[styles.iconWrap, { backgroundColor: rt.categoryColor + '25' }]}>
                  <Text style={styles.icon}>{rt.categoryIcon}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{rt.name}</Text>
                  <Text style={styles.meta}>
                    {FREQ_LABELS[rt.frequency]} • {formatAmount(rt.amount)} • {rt.walletName}
                  </Text>
                  <Text style={styles.nextDue}>Next: {format(new Date(rt.nextDue), 'dd MMM yyyy')}</Text>
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => handleToggle(rt.id, rt.isActive)} style={styles.actionBtn}>
                    <Ionicons
                      name={rt.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                      size={22}
                      color={rt.isActive ? colors.warning : colors.income}
                    />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(rt.id, rt.name)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.expense} />
                  </Pressable>
                </View>
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
  content: { padding: 16 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardInactive: { opacity: 0.5 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 3 },
  meta: { fontSize: 12, color: colors.textSecondary },
  nextDue: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
});
