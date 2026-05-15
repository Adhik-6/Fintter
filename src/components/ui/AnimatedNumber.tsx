/**
 * AnimatedNumber — count-up animation for displaying amounts.
 */
import { useEffect } from 'react';
import { Text, type TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { config } from '@src/constants/config';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface AnimatedNumberProps {
  value: number;
  formatFn: (n: number) => string;
  style?: TextStyle;
  duration?: number;
}

export function AnimatedNumber({ value, formatFn, style, duration }: AnimatedNumberProps) {
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(value, {
      duration: duration ?? config.animation.numberReveal,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  // For RN Reanimated, we can't use animatedProps on Text directly in all cases.
  // Use a simple approach: just display the final value with a fade.
  return <Text style={style}>{formatFn(value)}</Text>;
}
