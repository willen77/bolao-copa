// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for the Bolão da Copa app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // Bolão da Copa icons
  "sportscourt.fill": "sports-soccer",
  "trophy.fill": "emoji-events",
  "person.3.fill": "group",
  "person.fill": "person",
  "gear": "settings",
  "star.fill": "star",
  "clock.fill": "access-time",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "plus.circle.fill": "add-circle",
  "pencil": "edit",
  "trash.fill": "delete",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "arrow.right.circle.fill": "arrow-circle-right",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "shield.fill": "shield",
  "crown.fill": "workspace-premium",
  "medal.fill": "military-tech",
  "chart.bar.fill": "bar-chart",
  "list.bullet": "list",
  "arrow.left": "arrow-back",
  "xmark": "close",
  "checkmark": "check",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "photo.fill": "photo",
  "person.crop.circle.fill": "account-circle",
  "calendar": "calendar-today",
  "location.fill": "location-on",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
