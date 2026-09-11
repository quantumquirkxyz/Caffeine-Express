import { useMemo, useState } from "react";
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Boxes, Building2, CalendarClock, ChevronDown, Filter, Link, MapPin, PackageOpen, ScanLine, Tag, X } from "lucide-react-native";
import type {
  DashboardEquipmentRow,
  DashboardView,
} from "../dashboard/dashboard";
import type { Modality } from "../domain/modality";
import { Badge } from "../ui/components/Badge";
import { Card } from "../ui/components/Card";
import { MetricCard } from "../ui/components/MetricCard";
import { SectionHeader } from "../ui/components/SectionHeader";
import { StatusBadge } from "../ui/components/StatusBadge";
import { radius, spacing, typography, useTheme } from "../ui/tokens";

type Props = {
  readonly view: DashboardView;
  readonly status: { title: string; detail: string };
  readonly copy: any;
  readonly demo: string;
  readonly modalities: readonly (Modality | null)[];
  readonly selectedModality: Modality | null;
  readonly onModality: (value: string | null) => void;
  readonly brandOptions: readonly string[];
  readonly selectedBrand: string | null;
  readonly onBrand: (value: string | null) => void;
  readonly modelOptions: readonly string[];
  readonly selectedModel: string | null;
  readonly onModel: (value: string | null) => void;
  readonly countryOptions: readonly string[];
  readonly selectedCountry: string | null;
  readonly onCountry: (value: string | null) => void;
  readonly clientOptions: readonly string[];
  readonly selectedClient: string | null;
  readonly onClient: (value: string | null) => void;
  readonly siteOptions: readonly string[];
  readonly selectedSite: string | null;
  readonly onSite: (value: string | null) => void;
  readonly onClear: () => void;
};

function stateStatus(state: DashboardEquipmentRow["state"]) {
  return state === "Confirmed"
    ? "confirmed"
    : state === "Reported"
      ? "reported"
      : state === "Estimated"
        ? "estimated"
        : "unknown";
}
function ageLabel(age: DashboardEquipmentRow["age"]) {
  return age === null
    ? "Unknown"
    : age.min === age.max
      ? `${age.min} years`
      : `${age.min}-${age.max} years`;
}

export function InstalledBaseScreen({
  view,
  status,
  copy,
  demo,
  modalities,
  selectedModality,
  onModality,
  brandOptions,
  selectedBrand,
  onBrand,
  modelOptions,
  selectedModel,
  onModel,
  countryOptions,
  selectedCountry,
  onCountry,
  clientOptions,
  selectedClient,
  onClient,
  siteOptions,
  selectedSite,
  onSite,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const inventoryCopy = copy.inventory ?? { filters: "Filters", filter: "Filter", close: "Close", all: "All", country: "Country", client: "Client", site: "Site", modality: "Modality", brand: "Brand", model: "Model", equipment: "Equipment inventory", evidence: "Evidence and observations", linked: "Linked observations", select: "Select equipment to review its evidence.", unknownLocation: "No location available", unknownBrand: "Unknown brand", unknownModel: "Unknown model", years: "years", ageUnknown: "Unknown" };
  const width = useWindowDimensions().width;
  const compact = width < 768;
  const tablet = width >= 768 && width < 1200;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      view.clients.flatMap((client) =>
        client.sites.flatMap((site) =>
          site.equipment.map((equipment) => ({
            ...equipment,
            clientName: client.clientName,
          })),
        ),
      ),
    [view],
  );
  const selected =
    rows.find(
      (row) =>
        `${row.clientName}/${row.siteName}/${row.modality}/${row.model ?? ""}` ===
        selectedKey,
    ) ?? rows[0];
  const modalitiesCount = new Set(rows.map((row) => row.modality)).size;
  const client = view.clients[0];
  const location = selected
    ? `${selected.city}, ${selected.country}`
    : "No location available";
  const filter = (
    key: string,
    label: string,
    icon: typeof Filter,
    options: readonly (string | null)[],
    value: string | null,
    onSelect: (next: string | null) => void,
  ) => {
    const Icon = icon;
     const selectedLabel = value ?? inventoryCopy.all;
    return <View style={{ flex: 1, minWidth: compact ? "100%" : 180, zIndex: openFilter === key ? 2 : 1 }}>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginBottom: spacing.xs }}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selectedLabel}`} onPress={() => setOpenFilter(openFilter === key ? null : key)} style={{ minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: value === null ? colors.border : colors.primary, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon size={16} color={value === null ? colors.textSecondary : colors.primary} />
        <Text numberOfLines={1} style={{ flex: 1, color: value === null ? colors.textSecondary : colors.text, fontSize: typography.sizes.sm }}>{selectedLabel}</Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>
       {openFilter === key && <View style={{ marginTop: spacing.xs, padding: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: `0px 3px 8px ${colors.text}1A` }}>
         {[null, ...options.filter((option): option is string => option !== null)].filter((option, index, all) => all.indexOf(option) === index).map((option) => <Pressable key={option ?? "all"} onPress={() => { onSelect(option); setOpenFilter(null); }} style={{ minHeight: 40, justifyContent: "center", paddingHorizontal: spacing.sm, borderRadius: radius.sm, backgroundColor: value === option ? colors.primarySoft : "transparent" }}><Text style={{ color: value === option ? colors.primary : colors.text, fontSize: typography.sizes.sm }}>{option ?? inventoryCopy.all}</Text></Pressable>)}
      </View>}
    </View>;
  };
  return (
    <View style={{ paddingBottom: spacing.xxl }}>
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={{
            color: colors.primary,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.bold,
            letterSpacing: 1.2,
          }}
        >
          INSTALLED BASE
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: typography.sizes.display,
            fontWeight: typography.weights.bold,
            marginTop: spacing.sm,
          }}
        >
          {client?.clientName ?? status.title}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.sizes.md,
            marginTop: spacing.xs,
          }}
        >
          {location}
        </Text>
      </View>
      <View
        style={{
          flexDirection: compact ? "column" : "row",
          flexWrap: tablet ? "wrap" : undefined,
          gap: spacing.md,
          marginBottom: spacing.xl,
        }}
      >
        {[
          [
            copy.sites,
            new Set(rows.map((row) => `${row.clientName}/${row.siteName}`))
              .size,
            colors.primary,
            MapPin,
          ],
          [
            copy.units ?? "Units",
            rows.reduce((sum, row) => sum + row.quantity, 0),
            colors.success,
            PackageOpen,
          ],
          [copy.modality ?? "Modalities", modalitiesCount, colors.primary, ScanLine],
        ].map(([label, value, accent, Icon]) => (
          <MetricCard
            key={String(label)}
            label={String(label)}
            value={value as number}
            accent={String(accent)}
            icon={Icon as typeof Filter}
            style={{ flex: 1, minWidth: tablet ? "48%" : undefined }}
          />
        ))}
      </View>
      <Card style={{ marginBottom: spacing.xl }}>
          <SectionHeader
            title={inventoryCopy.filters}
          subtitle="Refine the Installed equipment view"
            action={
            <TouchableOpacity onPress={() => setFiltersOpen(!filtersOpen)} accessibilityRole="button" accessibilityLabel="Show filters">
              <Text
                style={{
                  color: colors.primary,
                  fontSize: typography.sizes.xs,
                  fontWeight: typography.weights.semibold,
                }}
              >
                {filtersOpen ? inventoryCopy.close : inventoryCopy.filter}
              </Text>
            </TouchableOpacity>
          }
        />
        {filtersOpen && <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}
        >
          {filter("country", "Country", MapPin,
            countryOptions,
            selectedCountry,
            onCountry,
          )}
          {filter("client", "Client", Building2,
            clientOptions,
            selectedClient,
            onClient,
          )}
          {filter("site", "Site", MapPin,
            siteOptions,
            selectedSite,
            onSite,
          )}
          {filter("modality", "Modality", ScanLine, modalities, selectedModality, onModality)}
          {filter("brand", "Brand", Tag, brandOptions, selectedBrand, onBrand)}
          {filter("model", "Model", Tag, modelOptions, selectedModel, onModel)}
        </View>}
      </Card>
      {view.status !== "ready" ? (
        <Card>
          <Text
            style={{
              color: colors.text,
              fontWeight: typography.weights.semibold,
            }}
          >
            {status.title}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
            {status.detail}
          </Text>
        </Card>
      ) : (
          <View
            style={{
              flexDirection: compact || tablet ? "column" : "row",
            gap: spacing.lg,
            alignItems: "stretch",
          }}
        >
          <Card padded={false} style={{ flex: 1, overflow: "hidden" }}>
            <View style={{ padding: spacing.xl }}>
              <SectionHeader
                title="Equipment inventory"
                subtitle={`${rows.length} Installed equipment records`}
              />
            </View>
            {!compact && <View
              style={{
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                flexDirection: "row",
              }}
            >
              <Text
                style={{
                  flex: 2,
                  color: colors.textSecondary,
                  fontSize: typography.sizes.xs,
                  fontWeight: typography.weights.bold,
                }}
              >
                Equipment / Model
              </Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.textSecondary,
                  fontSize: typography.sizes.xs,
                  fontWeight: typography.weights.bold,
                }}
              >
                Modalidad
              </Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.textSecondary,
                  fontSize: typography.sizes.xs,
                  fontWeight: typography.weights.bold,
                }}
              >
                State
              </Text>
            </View>}
            {rows.map((row) => {
              const key = `${row.clientName}/${row.siteName}/${row.modality}/${row.model ?? ""}`;
              const active =
                key === selectedKey ||
                (selectedKey === null && row === selected);
              return (
                <TouchableOpacity
                  key={key}
                  accessibilityRole="button"
                  onPress={() => setSelectedKey(key)}
                  style={{
                    padding: spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: active
                      ? colors.primarySoft
                      : colors.surface,
                    flexDirection: compact ? "column" : "row",
                    alignItems: compact ? "stretch" : "center",
                  }}
                >
                  <View style={{ flex: 2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}><Boxes size={17} color={active ? colors.primary : colors.textSecondary} />
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: typography.sizes.sm,
                        fontWeight: typography.weights.semibold,
                      }}
                    >
                      {row.brand ?? "Unknown brand"}{" "}
                      {row.model ?? "Unknown model"}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: typography.sizes.xs,
                        marginTop: spacing.xs,
                      }}
                    >
                      {row.siteName}
                    </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: colors.textSecondary,
                      fontSize: typography.sizes.xs,
                    }}
                  >
                    {row.modality}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <StatusBadge status={stateStatus(row.state)} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
          <View style={{ width: compact || tablet ? "100%" : 320, gap: spacing.lg }}>
            <Card>
              <SectionHeader title="Evidence and observations" />
              {selected ? (
                <>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: typography.weights.semibold,
                    }}
                  >
                    {selected.brand ?? "Unknown brand"}{" "}
                    {selected.model ?? "Unknown model"}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.sizes.sm,
                      marginTop: spacing.xs,
                    }}
                  >
                    {selected.siteName} · {selected.city}, {selected.country}
                  </Text>
                  <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: typography.sizes.xs,
                      }}
                    >
                      <Link size={14} color={colors.textSecondary} /> Linked observations
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: typography.weights.semibold,
                      }}
                    >
                      {selected.observationIds.length}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: typography.sizes.xs,
                      }}
                    >
                      <CalendarClock size={14} color={colors.textSecondary} /> Quantity {selected.quantity} · Age{" "}
                      {ageLabel(selected.age)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: colors.textSecondary }}>
                  Select equipment to review its evidence.
                </Text>
              )}
            </Card>
          </View>
        </View>
      )}
    </View>
  );
}
