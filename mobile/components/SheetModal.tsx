import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSizes, spacing } from '../theme';

type SheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // Botones fijos abajo (ej. "Limpiar" / "Aplicar"). Quedan sobre la safe area inferior.
  footer?: ReactNode;
  // true: la hoja ocupa casi toda la pantalla (listas largas). false: se ajusta al contenido.
  fill?: boolean;
};

const CLOSE_DISTANCE = 100;
const CLOSE_VELOCITY = 0.8;

// Hoja inferior para filtros y formularios cortos. Reemplaza al <Modal> a pantalla
// completa con SafeAreaView adentro: en Android ese Modal vive en otra ventana nativa y
// no recibe los insets, así que la X quedaba pegada bajo la barra de estado. Acá los
// insets se leen con useSafeAreaInsets() en el componente (que está dentro del árbol de
// la pantalla) y se aplican como padding explícito. Se cierra con la X, tocando el fondo,
// deslizando hacia abajo el encabezado, o con el botón atrás de Android (onRequestClose).
export default function SheetModal({ visible, onClose, title, children, footer, fill = true }: SheetModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  // Solo el encabezado captura el gesto, así no compite con el scroll del contenido.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <Animated.View
          style={[
            styles.sheet,
            fill && styles.sheetFill,
            { transform: [{ translateY }], marginTop: insets.top + spacing.lg },
          ]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={24} color={colors.asphalt} />
              </Pressable>
            </View>
          </View>
          <View style={fill ? styles.bodyFill : undefined}>{children}</View>
          {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>{footer}</View>}
          {!footer && <View style={{ height: insets.bottom }} />}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28,27,26,0.5)',
  },
  sheet: {
    backgroundColor: colors.chalk,
    maxHeight: '100%',
    borderTopWidth: 3,
    borderTopColor: colors.asphalt,
  },
  sheetFill: {
    flex: 1,
  },
  bodyFill: {
    flex: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.lg,
    color: colors.asphalt,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: colors.chalk,
  },
});
