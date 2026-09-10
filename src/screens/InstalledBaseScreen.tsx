import { useMemo, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
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
import { colors, radius, spacing, typography } from "../ui/tokens";

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
      ? `${age.min} años`
      : `${age.min}-${age.max} años`;
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
  onClear,
}: Props) {
  const width = useWindowDimensions().width;
  const compact = width < 768;
  const tablet = width >= 768 && width < 1200;
  const [filtersOpen, setFiltersOpen] = useState(!compact);
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
    : "Sin ubicación disponible";
  const filter = (
    label: string,
    options: readonly (string | null)[],
    value: string | null,
    onSelect: (next: string | null) => void,
  ) => (
    <View style={{ flex: 1, minWidth: compact ? "100%" : 150 }}>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.sizes.xs,
          marginBottom: spacing.xs,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        {options.map((option) => (
          <TouchableOpacity
            key={option ?? "all"}
            onPress={() => onSelect(option)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.sm,
              backgroundColor:
                value === option ? colors.primarySoft : colors.surface,
              borderWidth: 1,
              borderColor: value === option ? colors.primary : colors.border,
            }}
          >
            <Text
              style={{
                color: value === option ? colors.primary : colors.textSecondary,
                fontSize: typography.sizes.xs,
              }}
            >
              {option ?? "Todos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
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
          BASE INSTALADA
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
          ],
          [
            "Equipos",
            rows.reduce((sum, row) => sum + row.quantity, 0),
            colors.success,
          ],
          ["Modalidades", modalitiesCount, colors.primary],
        ].map(([label, value, accent]) => (
          <MetricCard
            key={String(label)}
            label={String(label)}
            value={value as number}
            accent={String(accent)}
            style={{ flex: 1, minWidth: tablet ? "48%" : undefined }}
          />
        ))}
      </View>
      <Card style={{ marginBottom: spacing.xl }}>
        <SectionHeader
          title="Filtros"
          subtitle="Refina la vista de Installed equipment"
          action={
            <TouchableOpacity onPress={() => (compact ? setFiltersOpen(!filtersOpen) : onClear())}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: typography.sizes.xs,
                  fontWeight: typography.weights.semibold,
                }}
              >
                {compact ? (filtersOpen ? "Cerrar" : "Abrir filtros") : "Limpiar"}
              </Text>
            </TouchableOpacity>
          }
        />
        {(!compact || filtersOpen) && <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}
        >
          {filter(
            "País",
            [...new Set(rows.map((row) => row.country))],
            null,
            () => undefined,
          )}
          {filter(
            "Cliente",
            [...new Set(rows.map((row) => row.clientName))],
            null,
            () => undefined,
          )}
          {filter(
            "Sede",
            [...new Set(rows.map((row) => row.siteName))],
            null,
            () => undefined,
          )}
          {filter("Modalidad", modalities, selectedModality, onModality)}
          {filter("Marca", brandOptions, selectedBrand, onBrand)}
          {filter("Modelo", modelOptions, selectedModel, onModel)}
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
                title="Inventario de equipos"
                subtitle={`${rows.length} registros de Installed equipment`}
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
                Equipo / Modelo
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
                Estado
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
              <SectionHeader title="Evidencia y observaciones" />
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
                      Observaciones vinculadas
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
                      Cantidad {selected.quantity} · Edad{" "}
                      {ageLabel(selected.age)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: colors.textSecondary }}>
                  Selecciona un equipo para revisar su evidencia.
                </Text>
              )}
            </Card>
          </View>
        </View>
      )}
    </View>
  );
}
