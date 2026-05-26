/**
 * Configuración del pipeline — espejo de proyecto_madrina/config.py.
 * Todos los umbrales en un solo lugar.
 */
export const UMBRAL_SOBRECARGA_H_SEMANA = 40;
export const UMBRAL_SUBUTILIZACION_H_SEMANA = 4;
export const UMBRAL_SECCION_GRANDE = 30;
export const UMBRAL_BLOQUE_LARGO_MIN = 5 * 60;

export const HOJAS_CONSOLIDADAS = new Set([
  "PREGRADO-IA",
  "PROGRAMACION GENERAL",
]);

export const LIMITE_FILAS_VACIAS_SEGUIDAS = 3;
export const MAX_FILAS_BUSCAR_ENCABEZADO = 15;
