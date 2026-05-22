/**
 * AnimatedNumber — count-up animation for displaying amounts.
 */
import { useEffect } from 'react';
import { TextInput, type TextStyle, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { config } from '@src/constants/config';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formatFn(animated.value),
      defaultValue: formatFn(animated.value), // for some older RN versions
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      animatedProps={animatedProps}
      style={[styles.base, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 0,
    margin: 0,
    color: Platform.OS === 'ios' ? undefined : '#000',
  }
});
