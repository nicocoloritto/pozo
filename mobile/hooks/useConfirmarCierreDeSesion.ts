import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Mientras no exista el backend, cerrar sesión de una cuenta registrada con DNI borra esa
// cuenta y sus reclamos (ver AuthContext.cerrarSesion), así que antes se avisa y se pide
// confirmación: sin esto, un toque de más haría perder los reclamos sin explicación. Las
// cuentas de prueba no borran nada, y para ellas se cierra sesión directo.
export function useConfirmarCierreDeSesion(): () => void {
  const { cerrarSesion, cierreBorraDatos } = useAuth();

  const cerrar = () => {
    cerrarSesion().catch((err) => console.warn('[auth] No se pudo cerrar la sesión', err));
  };

  return () => {
    if (!cierreBorraDatos) {
      cerrar();
      return;
    }
    Alert.alert(
      'Cerrar sesión',
      'Todavía no hay servidor: al cerrar sesión se borran tu cuenta y los reclamos que publicaste desde este teléfono.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: cerrar },
      ]
    );
  };
}
