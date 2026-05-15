/**
 * FCard — glass-morphism card with optional glow accent.
 */
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@src/theme';

interface FCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glow';
  glowColor?: string;
  animated?: boolean;
  delay?: number;
  style?: ViewStyle;
}

export function FCard({
  children, variant = 'default', glowColor, animated = true, delay = 0, style,
}: FCardProps) {
  const cardStyle = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'glow' && styles.glow,
    style,
  ];

  const Wrapper = animated ? Animated.View : View;
  const animProps = animated ? { entering: FadeInDown.delay(delay).duration(300) } : {};

  return (
    <Wrapper {...animProps} style={cardStyle}>
      {variant === 'glow' && glowColor && (
        <View style={[styles.glowCircle, { backgroundColor: glowColor }]} />
      )}
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  elevated: {
    backgroundColor: colors.surface2,
    borderColor: colors.borderStrong,
  },
  glow: {
    backgroundColor: colors.surface1,
    borderColor: colors.glassBorder,
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.15,
  },
});
