import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Text, View } from 'react-native';
import { spacing, typography, useTheme } from '../tokens';

export function FieldSightMark({ size = 36 }: { readonly size?: number }) {
  const { resolvedMode } = useTheme();
  const lowerFill = resolvedMode === 'dark' ? '#FFFFFF' : '#252B31';

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityRole="image" accessibilityLabel="FieldSight logo">
      <Defs>
        <LinearGradient id="fieldsight-blue" x1="14" y1="106" x2="95" y2="18" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#06396E" />
          <Stop offset="0.62" stopColor="#0B58B7" />
          <Stop offset="1" stopColor="#0D75FF" />
        </LinearGradient>
      </Defs>
      <Path d="M14 52 L46 20 H97 V36 L82 51 H41 V80 L14 108 Z" fill="url(#fieldsight-blue)" />
      <Path d="M34 91 H80 L101 70 V58 H75 V69 H58 V80 H45 Z" fill={lowerFill} />
      <Path d="M46 80 H74 V67 H50 V57 H100 V78 L82 98 H28 Z" fill={lowerFill} opacity={0.96} />
      <Rect x="50" y="60" width="18" height="18" rx="3" fill="url(#fieldsight-blue)" />
      <Rect x="76" y="46" width="15" height="15" rx="2.5" fill="url(#fieldsight-blue)" />
      <Rect x="92" y="30" width="11" height="11" rx="2" fill="url(#fieldsight-blue)" />
    </Svg>
  );
}

export function FieldSightLockup({ markSize = 36 }: { readonly markSize?: number }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <FieldSightMark size={markSize} />
      <Text style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold }}>FieldSight</Text>
    </View>
  );
}
