import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { haceCuanto } from '../lib/verificacion';
import type { ResumenVerificacion } from '../lib/verificacion';
import type { Reclamo, TipoVoto } from '../types/reclamo';
import { colors, fonts, fontSizes, spacing } from '../theme';

type Props = {
  reclamo: Reclamo;
  resumen: ResumenVerificacion;
  esAutor: boolean;
  // Sin vecino logueado o con el reclamo cerrado: se muestran los números sin botones.
  puedeVotar: boolean;
  votando: boolean;
  error?: string | null;
  onVotar: (voto: TipoVoto) => void;
};

// Bloque "¿Sigue ahí?" estilo Waze del Detalle del vecino.
export default function VerificacionReclamo({ reclamo, resumen, esAutor, puedeVotar, votando, error, onVotar }: Props) {
  const { sigue, yaNoEsta, miVoto, posiblementeResuelto } = resumen;
  const sigueDeshabilitado = !puedeVotar || esAutor || votando;
  const yaNoEstaDeshabilitado = !puedeVotar || votando;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>¿Sigue ahí?</Text>

      <View style={styles.buttons}>
        <Pressable
          disabled={sigueDeshabilitado}
          onPress={() => onVotar('sigue')}
          accessibilityRole="button"
          accessibilityLabel={`Sigue ahí, ${sigue} ${sigue === 1 ? 'voto' : 'votos'}${miVoto === 'sigue' ? ', es tu voto' : ''}`}
          style={({ pressed }) => [
            styles.button,
            miVoto === 'sigue' && { backgroundColor: colors.mango, borderColor: colors.mango },
            sigueDeshabilitado && styles.buttonDisabled,
            pressed && !sigueDeshabilitado && styles.pressed,
          ]}
        >
          <Ionicons
            name={miVoto === 'sigue' ? 'thumbs-up' : 'thumbs-up-outline'}
            size={22}
            color={miVoto === 'sigue' ? colors.ink : colors.mango}
          />
          <Text style={styles.buttonLabel}>Sigue ahí</Text>
          <Text style={styles.count}>{sigue}</Text>
        </Pressable>

        <Pressable
          disabled={yaNoEstaDeshabilitado}
          onPress={() => onVotar('yaNoEsta')}
          accessibilityRole="button"
          accessibilityLabel={`Ya no está, ${yaNoEsta} ${yaNoEsta === 1 ? 'voto' : 'votos'}${miVoto === 'yaNoEsta' ? ', es tu voto' : ''}`}
          style={({ pressed }) => [
            styles.button,
            miVoto === 'yaNoEsta' && { backgroundColor: colors.mint, borderColor: colors.mint },
            yaNoEstaDeshabilitado && styles.buttonDisabled,
            pressed && !yaNoEstaDeshabilitado && styles.pressed,
          ]}
        >
          <Ionicons
            name={miVoto === 'yaNoEsta' ? 'thumbs-down' : 'thumbs-down-outline'}
            size={22}
            color={miVoto === 'yaNoEsta' ? colors.bg : colors.mint}
          />
          <Text style={[styles.buttonLabel, miVoto === 'yaNoEsta' && { color: colors.bg }]}>Ya no está</Text>
          <Text style={[styles.count, miVoto === 'yaNoEsta' && { color: colors.bg }]}>{yaNoEsta}</Text>
        </Pressable>
      </View>

      {esAutor && (
        <Text style={styles.hint}>Es tu reclamo, así que no podés votar “Sigue ahí”. Sí podés avisar si ya no está.</Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      {reclamo.ultimoVoto && (
        <Text style={styles.ultimo}>
          Último aviso: {reclamo.ultimoVoto.tipo === 'sigue' ? 'sigue ahí' : 'ya no está'} · {haceCuanto(reclamo.ultimoVoto.fecha)}
        </Text>
      )}

      {posiblementeResuelto && (
        <View style={styles.aviso}>
          <Ionicons name="information-circle" size={18} color={colors.mint} />
          <Text style={styles.avisoText}>Varios vecinos dicen que ya no está. El municipio lo va a revisar.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontFamily: fonts.monoSemiBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  count: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.coral,
  },
  ultimo: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.inkSoft,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.mint,
    paddingLeft: spacing.sm,
  },
  avisoText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.ink,
  },
});
