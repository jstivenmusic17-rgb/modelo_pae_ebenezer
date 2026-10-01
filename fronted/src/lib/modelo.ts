// ============================================================================
// Lógica de presentación del modelo analítico del PAE.
// El cálculo oficial del pedido lo hace el backend (modelo del vendedor de
// periódicos); aquí solo se explica ese resultado en lenguaje natural y se
// replica la fórmula para vistas previas (ej. al editar parámetros).
// ============================================================================
import type { ParametrosModelo, PlanRacion } from "../services/api";

// Fórmulas del documento "Modelo Analítico PAE" (sección 3.1)
export const FORMULAS = {
  F1: { codigo: "F1", nombre: "Demanda diaria estimada", descripcion: "Matrícula × asistencia esperada" },
  F2: { codigo: "F2", nombre: "Raciones con margen fijo", descripcion: "Demanda × (1 + margen de seguridad)" },
  F3: { codigo: "F3", nombre: "Tasa de desperdicio", descripcion: "Sobrantes ÷ preparadas × 100" },
  F4: { codigo: "F4", nombre: "Tasa de faltantes", descripcion: "Faltantes ÷ demanda real × 100" },
  F5: { codigo: "F5", nombre: "Costo diario de producción", descripcion: "Raciones preparadas × costo por ración" },
  F6: { codigo: "F6", nombre: "Costo por desperdicio", descripcion: "Sobrantes × costo del sobrante" },
  F7: { codigo: "F7", nombre: "Costo por faltantes", descripcion: "Faltantes × costo de comida de urgencia" },
  F8: { codigo: "F8", nombre: "Costo de desviación", descripcion: "Costo por desperdicio + costo por faltantes" },
  F9: { codigo: "F9", nombre: "Cobertura efectiva", descripcion: "Estudiantes atendidos ÷ matrícula × 100" },
  F10: { codigo: "F10", nombre: "Consumo diario de insumo", descripcion: "Raciones × gramos por ración ÷ 1.000" },
  F11: { codigo: "F11", nombre: "Balance de inventario", descripcion: "Stock inicial + recibido − consumo" },
  F12: { codigo: "F12", nombre: "Punto de reorden", descripcion: "Consumo diario × días del proveedor + reserva" },
  F13: { codigo: "F13", nombre: "Costo real por ración", descripcion: "Gasto del periodo ÷ raciones servidas" },
  F14: { codigo: "F14", nombre: "Ausentismo", descripcion: "(Matrícula − presentes) ÷ matrícula × 100" },
  F15: { codigo: "F15", nombre: "Ejecución semanal", descripcion: "Suma de costos diarios de lunes a viernes" },
  F16: { codigo: "F16", nombre: "Error del pronóstico (MAE)", descripcion: "Promedio de |planificadas − reales|" },
  F17: { codigo: "F17", nombre: "Rendimiento de cocina", descripcion: "Servidas ÷ preparadas × 100" },
  F18: { codigo: "F18", nombre: "Proporción por jornada", descripcion: "Matrícula de la jornada ÷ matrícula total" },
  F19: { codigo: "F19", nombre: "Capacidad de cocina", descripcion: "Cocineros × raciones por hora × horas del turno" },
  F20: { codigo: "F20", nombre: "Ahorro por optimización", descripcion: "(Sobrantes antes − ahora) × días × costo" },
} as const;

export type CodigoFormula = keyof typeof FORMULAS;

export function etiquetaFormula(codigo: CodigoFormula): string {
  return `${codigo} · ${FORMULAS[codigo].nombre}`;
}

// Fecha LOCAL en formato ISO yyyy-MM-dd. No usar toISOString(): convierte a
// UTC y en Colombia (UTC-5) después de las 7 p. m. devuelve el día siguiente.
export function fechaISO(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function hoyISO(): string {
  return fechaISO(new Date());
}

export function formatoCOP(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

export function formatoPorcentaje(fraccion: number, decimales = 0): string {
  return `${(fraccion * 100).toFixed(decimales)}%`;
}

// Inversa de la normal estándar (algoritmo de Acklam), igual a la del backend
export function inversaNormal(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pp = Math.min(Math.max(p, 1e-9), 1 - 1e-9);
  const pBajo = 0.02425;
  if (pp < pBajo) {
    const q = Math.sqrt(-2 * Math.log(pp));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (pp <= 1 - pBajo) {
    const q = pp - 0.5;
    const r = q * q;
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - pp));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

// Réplica del cálculo del backend, solo para vistas previas
export function calcularPedido(matricula: number, asistencia: number, p: ParametrosModelo): { demanda: number; pedido: number } {
  const demanda = Math.round(matricula * asistencia);
  const suma = p.costoFaltanteUnitario + p.costoSobranteUnitario;
  const razonCritica = suma === 0 ? 0.5 : p.costoFaltanteUnitario / suma;
  const pedido = Math.max(0, Math.round(demanda + inversaNormal(razonCritica) * demanda * p.coeficienteVariacion));
  return { demanda, pedido };
}

export interface ExplicacionPlan {
  matricula: number;
  esperados: number;
  pedido: number;
  extra: number;
  conMargen: number;
  costoTotal: number;
  frase: string;
}

// Explica en lenguaje natural por qué el modelo sugiere ese pedido.
// Acepta uno o varios planes (ej. todos los cursos de una jornada).
export function explicarPlanes(planes: PlanRacion[]): ExplicacionPlan | null {
  if (planes.length === 0) return null;
  const matricula = planes.reduce((s, p) => s + p.matriculaTotalRegistrada, 0);
  const esperados = planes.reduce((s, p) => s + p.demandaBase, 0);
  const pedido = planes.reduce((s, p) => s + p.racionesPlanificadas, 0);
  const conMargen = planes.reduce((s, p) => s + p.racionesSugeridasMargen, 0);
  const costoTotal = planes.reduce((s, p) => s + p.costoTotalProduccion, 0);
  const extra = pedido - esperados;
  // Los costos del plan calculado más recientemente (un curso puede conservar
  // un plan anterior si su comedor ya se registró)
  const masReciente = planes.reduce((a, b) => (b.idPlan > a.idPlan ? b : a));
  const { costoFaltanteUnitario: faltante, costoSobranteUnitario: sobrante } = masReciente;

  let frase: string;
  if (faltante > sobrante) {
    frase =
      `Que un estudiante se quede sin ración cuesta ${formatoCOP(faltante)} (comida de urgencia) y que sobre una ` +
      `ración cuesta ${formatoCOP(sobrante)}. Como quedarse corto sale más caro, el modelo pide ${extra} ` +
      `${extra === 1 ? "ración" : "raciones"} más de las que se espera que asistan.`;
  } else if (faltante < sobrante) {
    frase =
      `Que sobre una ración cuesta ${formatoCOP(sobrante)} y que falte cuesta ${formatoCOP(faltante)}. Como ` +
      `desperdiciar sale más caro, el modelo pide ${Math.abs(extra)} ${Math.abs(extra) === 1 ? "ración" : "raciones"} ` +
      `menos de las que se espera que asistan.`;
  } else {
    frase = "Faltar y sobrar cuestan lo mismo, así que el modelo pide exactamente las raciones que se espera que asistan.";
  }

  return { matricula, esperados, pedido, extra, conMargen, costoTotal, frase };
}
