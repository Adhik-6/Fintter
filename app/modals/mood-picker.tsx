/**
 * Mood Picker Modal
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { moodRepository } from '@src/db/repositories/moodRepository';
import type { Mood } from '@src/features/emotional/types';
import { colors } from '@src/theme';

export default function MoodPickerModal() {
  const router = useRouter();
  const [moods, setMoods] = useState<Mood[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => { moodRepository.getAll().then(setMoods); }, []);

  const handleSelect = (id: number) => {
    setSelected(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>Tag your spending mood</Text>

      <View style={styles.moodRow}>
        {moods.map((mood) => (
          <Pressable key={mood.id} onPress={() => handleSelect(mood.id)} style={[styles.moodItem, selected === mood.id && styles.moodItemActive]}>
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[styles.moodLabel, selected === mood.id && styles.moodLabelActive]}>{mood.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => router.back()} style={styles.skipBtn}><Text style={styles.skipText}>Skip</Text></Pressable>
        <Pressable onPress={() => router.back()} style={[styles.doneBtn, !selected && styles.doneBtnDisabled]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0, justifyContent: 'center', padding: 24 },
  handle: { width: 40, height: 4, backgroundColor: colors.surface3, borderRadius: 2, alignSelf: 'center', position: 'absolute', top: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 32 },

  moodRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40 },
  moodItem: { alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface1 },
  moodItemActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  moodEmoji: { fontSize: 36, marginBottom: 6 },
  moodLabel: { fontSize: 12, color: colors.textMuted },
  moodLabelActive: { color: colors.cyan, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 12 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.surface2 },
  skipText: { color: colors.textSecondary, fontWeight: '600' },
  doneBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.cyan },
  doneBtnDisabled: { opacity: 0.4 },
  doneText: { color: colors.black, fontWeight: '700' },
});
