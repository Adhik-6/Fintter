/**
 * ConfettiOverlay — Particle system for milestone unlocks.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';
import { useStore } from '@src/store';
import { colors } from '@src/theme';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = [colors.cyan, colors.expense, colors.income, colors.warning, '#FF6B6B', '#4ECDC4'];
const PARTICLE_COUNT = 50;

interface ParticleProps {
  index: number;
  trigger: number;
}

const Particle = ({ index, trigger }: ParticleProps) => {
  const y = useSharedValue(-50);
  const x = useSharedValue(width / 2);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 8 + Math.random() * 8;
  const isCircle = index % 2 === 0;
  
  useEffect(() => {
    if (trigger > 0) {
      // Reset
      y.value = -50;
      x.value = (width / 2) + (Math.random() * 40 - 20); // slightly spread origin
      opacity.value = 1;
      rotation.value = 0;
      
      // Explosion physics
      const angle = Math.random() * Math.PI; // upward hemisphere
      const velocity = 300 + Math.random() * 400;
      const targetX = x.value + Math.cos(angle) * velocity;
      
      const duration = 2500 + Math.random() * 1500;
      const delay = Math.random() * 200;
      
      x.value = withDelay(
        delay,
        withTiming(targetX, { duration, easing: Easing.out(Easing.quad) })
      );
      
      y.value = withDelay(
        delay,
        withTiming(height + 100, { duration, easing: Easing.in(Easing.cubic) })
      );
      
      rotation.value = withDelay(
        delay,
        withTiming(360 * (2 + Math.random() * 4), { duration })
      );
      
      opacity.value = withDelay(
        delay + duration * 0.7,
        withTiming(0, { duration: duration * 0.3 })
      );
    }
  }, [trigger]);
  
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    opacity: opacity.value,
    transform: [
      { rotateZ: `${rotation.value}deg` },
      { rotateX: `${rotation.value * 0.7}deg` },
    ]
  }));
  
  return (
    <Animated.View style={[
      style, 
      { width: size, height: size, backgroundColor: color, borderRadius: isCircle ? size/2 : 0 }
    ]} />
  );
};

export function ConfettiOverlay() {
  const trigger = useStore(s => s.confettiKey);
  
  if (trigger === 0) return null;
  
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={`c-${trigger}-${i}`} index={i} trigger={trigger} />
      ))}
    </View>
  );
}
