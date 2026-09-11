import type { PropsWithChildren, RefObject } from "react";
import { Animated, ScrollView, View, useWindowDimensions } from "react-native";
import { spacing, useTheme } from "../ui/tokens";
import { DesktopSidebar, type AppSection } from "./DesktopSidebar";
import { DesktopTopbar } from "./DesktopTopbar";
import { MobileHeader } from "./MobileHeader";
import { COPY } from "../i18n/copy";

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
  readonly language?: "en" | "es" | "pt";
  readonly onLanguage?: (language: "en" | "es" | "pt") => void;
}>) {
  const { colors } = useTheme();
  const width = useWindowDimensions().width;
  const desktop = width >= 1200;
  const currentLanguage = language ?? "es";
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
            copy={COPY[currentLanguage]}
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
