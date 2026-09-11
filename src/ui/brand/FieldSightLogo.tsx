import Svg, { Path } from 'react-native-svg';
import { Text, View } from 'react-native';
import { spacing, typography, useTheme } from '../tokens';

export function FieldSightMark({ size = 36 }: { readonly size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1254 1254">
      <Path d="M8862 8492 c-9 -6 -12 -44 -10 -153 l3 -144 145 0 145 0 0 150 0 150 -135 3 c-74 1 -141 -2 -148 -6z M4212 7957 l-532 -532 0 -1620 0 -1620 515 515 515 515 0 1102 0 1103 1263 0 1262 0 233 233 232 232 0 303 0 302 -1478 0 -1477 0 -533 -533z M8105 7887 c-3 -7 -4 -140 -3 -297 l3 -285 284 -3 c167 -1 289 2 294 7 12 12 17 538 6 569 l-9 22 -285 0 c-221 0 -287 -3 -290 -13z M7265 7147 c-3 -7 -4 -152 -3 -322 l3 -310 325 0 325 0 3 300 c1 165 0 310 -3 323 l-5 22 -321 0 c-248 0 -321 -3 -324 -13z M5412 6522 c-10 -7 -12 -99 -10 -428 l3 -419 423 -3 422 -2 8 22 c4 13 7 83 6 156 l-1 132 497 0 497 0 -2 -532 -2 -533 -1128 -3 -1129 -2 -403 -402 -403 -402 0 -103 0 -103 1568 0 1567 0 493 491 492 491 0 664 0 664 -1022 2 -1023 3 -2 144 c-1 80 -4 150 -7 158 -4 10 -84 13 -418 13 -227 0 -419 -4 -426 -8z" fill={useTheme().colors.primary} transform="translate(0,1254) scale(0.1,-0.1)" />
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
