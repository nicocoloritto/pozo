import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryLabels, categoryOrder } from '../constants/categories';
import { seccionLabels } from '../constants/status';
import { useCatalogo } from '../contexts/CatalogoContext';
import { FILTROS_VACIOS } from '../lib/filtrosMunicipio';
import type { FiltrosMunicipio, Seccion } from '../lib/filtrosMunicipio';
import type { Categoria } from '../types/reclamo';
import { colors, fonts, fontSizes, radii, spacing } from '../theme';
import PressableScale from './PressableScale';
import SheetModal from './SheetModal';

type Props = {
  visible: boolean;
  municipioId: string;
  // Solo el mapa: la bandeja ya tiene sus segmentos.
  conSeccion?: boolean;
  filtros: FiltrosMunicipio;
  onClose: () => void;
  onApply: (filtros: FiltrosMunicipio) => void;
};

// Modal de filtros compartido por la Bandeja y el Mapa del municipio. Se edita un
// borrador: los cambios solo valen al tocar "Aplicar"; cerrar sin aplicar los descarta.
export default function FiltrosMunicipioModal({ visible, municipioId, conSeccion, filtros, onClose, onApply }: Props) {
  const { barrios } = useCatalogo();
  const [borrador, setBorrador] = useState<FiltrosMunicipio>(filtros);

  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  const barriosDelMunicipio = barrios.filter((b) => b.municipioId === municipioId);
  const comunas = Array.from(new Set(barriosDelMunicipio.map((b) => b.comuna))).sort((a, b) => a - b);

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Filtros"
      footer={
        <>
          <PressableScale
            style={styles.clearButton}
            onPress={() => setBorrador(FILTROS_VACIOS)}
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros"
          >
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </PressableScale>
          <PressableScale
            style={styles.applyButton}
            onPress={() => {
              onApply(borrador);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Aplicar filtros"
          >
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </PressableScale>
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <FiltroSeccion
          titulo="Barrio"
          opciones={barriosDelMunicipio.map((b) => ({ id: b.nombre, label: b.nombre }))}
          valor={borrador.barrio}
          onChange={(valor) => setBorrador((prev) => ({ ...prev, barrio: valor }))}
        />
        <FiltroSeccion
          titulo="Comuna"
          opciones={comunas.map((c) => ({ id: String(c), label: `Comuna ${c}` }))}
          valor={borrador.comuna ? String(borrador.comuna) : null}
          onChange={(valor) => setBorrador((prev) => ({ ...prev, comuna: valor ? Number(valor) : null }))}
        />
        <FiltroSeccion
          titulo="Categoría"
          opciones={categoryOrder.map((c) => ({ id: c, label: categoryLabels[c] }))}
          valor={borrador.categoria}
          onChange={(valor) => setBorrador((prev) => ({ ...prev, categoria: valor as Categoria | null }))}
        />
        {conSeccion && (
          <FiltroSeccion
            titulo="Sección"
            opciones={(Object.keys(seccionLabels) as Seccion[]).map((s) => ({ id: s, label: seccionLabels[s] }))}
            valor={borrador.seccion}
            onChange={(valor) => setBorrador((prev) => ({ ...prev, seccion: valor as Seccion | null }))}
          />
        )}
      </ScrollView>
    </SheetModal>
  );
}

type Opcion = { id: string; label: string };

function FiltroSeccion({
  titulo,
  opciones,
  valor,
  onChange,
}: {
  titulo: string;
  opciones: Opcion[];
  valor: string | null;
  onChange: (valor: string | null) => void;
}) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      <View style={styles.opciones}>
        {opciones.map((opcion) => (
          <PressableScale
            key={opcion.id}
            onPress={() => onChange(valor === opcion.id ? null : opcion.id)}
            accessibilityRole="button"
            accessibilityLabel={opcion.label}
            style={[styles.chip, valor === opcion.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, valor === opcion.id && styles.chipTextActive]}>{opcion.label}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  seccion: {
    gap: spacing.sm,
  },
  seccionTitulo: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.cobalt,
  },
  chipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.surface,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cobalt,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  clearButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.cobalt,
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.cobalt,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  applyButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: colors.surface,
  },
});
