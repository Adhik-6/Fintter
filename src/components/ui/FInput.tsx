/**
 * FInput — themed text input with label and error state.
 */
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors } from '@src/theme';

interface FInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
}

export function FInput({ label, error, icon, style, ...rest }: FInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, error && styles.inputError]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[styles.input, icon && { paddingLeft: 0 }, style]}
          placeholderTextColor={colors.textMuted}
          cursorColor={colors.cyan}
          selectionColor={colors.cyanGlow}
          {...rest}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputError: { borderColor: colors.expense },
  icon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 14 },
  error: { fontSize: 12, color: colors.expense, marginTop: 4, marginLeft: 2 },
});
