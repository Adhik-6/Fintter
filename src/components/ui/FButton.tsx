/**
 * FButton — primary, secondary, and ghost button variants.
 */
import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@src/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export function FButton({
  title, onPress, variant = 'primary', size = 'md',
  icon, loading, disabled, haptic = true, style,
}: FButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => { scale.value = withSpring(0.96, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }); };
  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const btnStyle = [styles.base, sizeStyles[size], variantStyles[variant], disabled && styles.disabled, style];
  const txtStyle = [styles.text, textSizeStyles[size], textVariantStyles[variant]];

  return (
    <AnimatedPressable
      style={[animStyle, ...btnStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? colors.black : colors.cyan} />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={txtStyle}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, gap: 6 },
  disabled: { opacity: 0.4 },
  text: { fontWeight: '700' },
  icon: { fontSize: 16 },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingHorizontal: 14, paddingVertical: 8 },
  md: { paddingHorizontal: 20, paddingVertical: 14 },
  lg: { paddingHorizontal: 24, paddingVertical: 18 },
};

const textSizeStyles: Record<string, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
};

const variantStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: colors.cyan },
  secondary: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.expenseGlow, borderWidth: 1, borderColor: colors.expense },
};

const textVariantStyles: Record<string, TextStyle> = {
  primary: { color: colors.black },
  secondary: { color: colors.textPrimary },
  ghost: { color: colors.cyan },
  danger: { color: colors.expense },
};
