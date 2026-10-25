// Texto para mostrarle a la persona cuando falla algo que depende del servidor. Los errores de
// los servicios (sin conexión, sin permiso, reclamo inexistente…) ya traen un mensaje pensado
// para eso; cualquier otro error es genérico.
export function mensajeDeError(err: unknown, porDefecto = 'No pudimos cargar los datos. Probá de nuevo.'): string {
  return err instanceof Error && 'code' in err && err.message ? err.message : porDefecto;
}
