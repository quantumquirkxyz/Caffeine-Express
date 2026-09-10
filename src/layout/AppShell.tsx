import type { PropsWithChildren, RefObject } from "react";
import { Animated, ScrollView, View, useWindowDimensions } from "react-native";
import { colors, spacing } from "../ui/tokens";
import { DesktopSidebar, type AppSection } from "./DesktopSidebar";
import { DesktopTopbar } from "./DesktopTopbar";
import { MobileHeader } from "./MobileHeader";

export function AppShell({
  children,
  activeSection,
  onNavigate,
  scrollRef,
  opacity,
  offset,
  language,
  onLanguage,
}: PropsWithChildren<{
  readonly activeSection: AppSection;
  readonly onNavigate: (section: AppSection) => void;
  readonly scrollRef: RefObject<ScrollView | null>;
  readonly opacity: Animated.Value;
  readonly offset: Animated.Value;
  readonly language?: "en" | "es";
  readonly onLanguage?: (language: "en" | "es") => void;
}>) {
  const width = useWindowDimensions().width;
  const desktop = width >= 1200;
  const currentLanguage = language ?? "en";
  const changeLanguage = onLanguage ?? (() => undefined);
  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        opacity,
        transform: [{ translateY: offset }],
      }}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop ? (
          <DesktopSidebar
            activeSection={activeSection}
            onNavigate={onNavigate}
          />
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {desktop ? (
            <DesktopTopbar
              language={currentLanguage}
              onLanguage={changeLanguage}
            />
          ) : (
            <MobileHeader
              language={currentLanguage}
              onLanguage={changeLanguage}
            />
          )}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{
              paddingVertical: width < 768 ? spacing.lg : spacing.xxl,
              paddingHorizontal: width < 768 ? spacing.lg : spacing.xxl,
            }}
          >
            <View
              style={{ width: "100%", maxWidth: 1240, alignSelf: "center" }}
            >
              {children}
            </View>
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}
