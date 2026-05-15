/**
 * EmptyState — placeholder for screens with no data.
 */
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@src/theme';
import { FButton } from './FButton';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, style }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <FButton title={actionLabel} onPress={onAction} size="sm" style={styles.action} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  action: { marginTop: 8 },
});
