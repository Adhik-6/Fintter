/**
 * CircularProgressArc — Skia-based circular progress bar.
 */
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@src/theme';

interface Props {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgressArc({ percentage, color, size = 120, strokeWidth = 10 }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(percentage / 100, 1), {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const path = Skia.Path.Make();
  // Draw an arc starting at 135 degrees and sweeping for 270 degrees (leaving a gap at bottom)
  path.addArc(
    { x: strokeWidth / 2, y: strokeWidth / 2, width: size - strokeWidth, height: size - strokeWidth },
    135,
    270
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: size, height: size }}>
        {/* Background Arc */}
        <Path 
          path={path} 
          color={colors.surface3} 
          style="stroke" 
          strokeWidth={strokeWidth} 
          strokeCap="round" 
        />
        {/* Foreground Arc */}
        <Path 
          path={path} 
          color={color} 
          style="stroke" 
          strokeWidth={strokeWidth} 
          strokeCap="round" 
          start={0} 
          end={progress} 
        />
      </Canvas>
    </View>
  );
}
