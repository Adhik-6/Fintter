/**
 * FChip — selectable pill-shaped chip with icon.
 */
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@src/theme';

interface FChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  activeColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function FChip({ label, icon, selected, activeColor = colors.cyan, onPress, style }: FChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { borderColor: activeColor, backgroundColor: activeColor + '18' },
        style,
      ]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, selected && { color: activeColor, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  icon: { fontSize: 14 },
  label: { fontSize: 13, color: colors.textSecondary },
});
