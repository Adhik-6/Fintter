/**
 * CircularProgressArc — Skia-based circular progress bar with dynamic color.
 * Green → Yellow → Orange → Red → Dark Red based on % used.
 * When >100%, shows solid dark red (no animation needed).
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import Animated, { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@src/theme';

interface Props {
  percentage: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b2.toString(16).padStart(2, '0')}`;
}

function getProgressColor(pct: number): string {
  if (pct <= 0) return '#22C55E';
  if (pct <= 60) return lerpColor('#22C55E', '#EAB308', pct / 60);
  if (pct <= 80) return lerpColor('#EAB308', '#F97316', (pct - 60) / 20);
  if (pct <= 100) return lerpColor('#F97316', '#EF4444', (pct - 80) / 20);
  // Exceeded: dark red
  return '#7F1D1D';
}

export function CircularProgressArc({ percentage, color, size = 120, strokeWidth = 10 }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(Math.max(percentage / 100, 0), 1), {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const arcColor = color ?? getProgressColor(percentage);

  const path = Skia.Path.Make();
  path.addArc(
    { x: strokeWidth / 2, y: strokeWidth / 2, width: size - strokeWidth, height: size - strokeWidth },
    135,
    270
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: size, height: size }}>
        <Path path={path} color={colors.surface3} style="stroke" strokeWidth={strokeWidth} strokeCap="round" />
        <Path path={path} color={arcColor} style="stroke" strokeWidth={strokeWidth} strokeCap="round" start={0} end={progress} />
      </Canvas>
    </View>
  );
}
