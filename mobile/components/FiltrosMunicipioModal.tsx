import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import areasData from '../data/areas.json';
import barriosData from '../data/barrios.json';
import { categoryLabels, categoryOrder } from '../constants/categories';
import { FILTROS_VACIOS } from '../lib/filtrosMunicipio';
import type { FiltrosMunicipio } from '../lib/filtrosMunicipio';
import type { Area } from '../types/area';
import type { Barrio } from '../types/estadisticas';
import type { Categoria } from '../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../theme';
import SheetModal from './SheetModal';

const areas = areasData as Area[];
const barrios = barriosData as Barrio[];

type Props = {
  visible: boolean;
  municipioId: string;
  filtros: FiltrosMunicipio;
  onClose: () => void;
  onApply: (filtros: FiltrosMunicipio) => void;
};

// Modal de filtros compartido por la Bandeja y el Mapa del municipio. Se edita un
// borrador: los cambios solo valen al tocar "Aplicar"; cerrar sin aplicar los descarta.
export default function FiltrosMunicipioModal({ visible, municipioId, filtros, onClose, onApply }: Props) {
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
          <Pressable
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            onPress={() => setBorrador(FILTROS_VACIOS)}
            accessibilityRole="button"
            accessibilityLabel="Limpiar filtros"
          >
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}
            onPress={() => {
              onApply(borrador);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Aplicar filtros"
          >
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </Pressable>
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
        <FiltroSeccion
          titulo="Área"
          opciones={areas.map((a) => ({ id: a.id, label: a.nombre }))}
          valor={borrador.area}
          onChange={(valor) => setBorrador((prev) => ({ ...prev, area: valor }))}
        />
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
          <Pressable
            key={opcion.id}
            onPress={() => onChange(valor === opcion.id ? null : opcion.id)}
            accessibilityRole="button"
            accessibilityLabel={opcion.label}
            style={[styles.chip, valor === opcion.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, valor === opcion.id && styles.chipTextActive]}>{opcion.label}</Text>
          </Pressable>
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
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.concrete,
  },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.asphalt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.asphalt,
  },
  chipText: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    color: colors.asphalt,
  },
  chipTextActive: {
    color: colors.chalk,
  },
  pressed: {
    opacity: 0.7,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.rust,
    padding: spacing.md,
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.rust,
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.asphalt,
    padding: spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    color: colors.chalk,
  },
});
