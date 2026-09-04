// ============================================================================
// Centralizador de peticiones al backend PAE (Spring Boot / Clean Architecture)
// Base URL: http://localhost:8082/api/pae
// ============================================================================

export const API_BASE_URL = "http://localhost:8082/api/pae";

// ----------------------------------------------------------------------------
// Error tipado para respuestas no exitosas del backend
// ----------------------------------------------------------------------------
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiErrorBody {
  mensaje?: string;
  message?: string;
  detalles?: string[];
}

// ----------------------------------------------------------------------------
// DTOs — Insumo / Movimiento de Insumo
// ----------------------------------------------------------------------------
export interface Insumo {
  idInsumo: number;
  nombreInsumo: string;
  unidadMedida: string;
  gramosPorRacion: number;
  stockInicialConfigurado: number;
  stockReserva: number;
  diasEntregaProveedor: number;
}

export interface MovimientoInsumo {
  idMovimiento: number;
  idInsumo: number;
  fecha: string; // ISO yyyy-MM-dd
  stockInicialKg: number;
  cantidadRecibidaKg: number;
  consumoDelDiaKg: number;
  stockFinalKg: number;
}

export interface RegistrarMovimientoRequest {
  fecha: string; // ISO yyyy-MM-dd
  cantidadRecibidaKg: number;
}

export interface CrearInsumoRequest {
  nombreInsumo: string;
  unidadMedida: string;
  gramosPorRacion: number;
  stockInicialConfigurado: number;
  stockReserva: number;
  diasEntregaProveedor: number;
}

// ----------------------------------------------------------------------------
// DTOs — Curso / Jornada / Estudiante
// ----------------------------------------------------------------------------
export interface Curso {
  idCurso: number;
  nombreCurso: string;
  idJornada: number;
}

export interface CrearCursoRequest {
  nombreCurso: string;
  idJornada: number;
}

export interface Jornada {
  idJornada: number;
  nombreJornada: string;
}

export interface CrearJornadaRequest {
  nombreJornada: string;
}

export interface Estudiante {
  idEstudiante: number;
  documentoIdentidad: string;
  nombreCompleto: string;
  idCurso: number;
}

export interface CrearEstudianteRequest {
  documentoIdentidad: string;
  nombreCompleto: string;
  idCurso: number;
}

// ----------------------------------------------------------------------------
// DTOs — Planificación de Raciones
// ----------------------------------------------------------------------------
export interface CalcularPlanRequest {
  idCurso: number;
  fecha: string; // ISO yyyy-MM-dd
  tasaAsistenciaEstimada: number;
  costoSobranteUnitario: number;
  costoFaltanteUnitario: number;
  coeficienteVariacion?: number;
  costoProduccionUnitario?: number;
  margenSeguridad?: number;
}

export interface PlanRacion {
  idPlan: number;
  fecha: string;
  idCurso: number;
  matriculaTotalRegistrada: number;
  tasaAsistenciaEstimada: number;
  demandaBase: number;
  racionesPlanificadas: number;
  costoSobranteUnitario: number;
  costoFaltanteUnitario: number;
  razonCritica: number;
  costoProduccionUnitario: number;
  costoTotalProduccion: number;
  margenSeguridadUsado: number;
  racionesSugeridasMargen: number;
}

export interface EstadisticasResumen {
  totalPlanes: number;
  totalRacionesPlanificadas: number;
  totalRacionesServidas: number;
  totalRacionesSobrantes: number;
  totalRacionesFaltantes: number;
  costoTotalSobrante: number;
  costoTotalFaltante: number;
  costoTotal: number;
}

// ----------------------------------------------------------------------------
// DTOs — Entregas en Comedor
// ----------------------------------------------------------------------------
export interface RegistrarEntregaRequest {
  idPlan: number;
  racionesServidas: number;
}

export interface EntregaRacion {
  idEntrega: number;
  idPlan: number;
  racionesServidas: number;
  racionesSobrantes: number;
  racionesFaltantes: number;
  costoTotalDesviacion: number;
}

// ----------------------------------------------------------------------------
// DTOs — Indicadores y KPIs
// ----------------------------------------------------------------------------
export interface IndicadoresOperativos {
  idPlan: number;
  tasaDesperdicio: number;
  tasaFaltante: number;
  coberturaEfectiva: number;
  porcentajeAusentismo: number;
  rendimientoCocina: number;
  umbralCoberturaMinima: number;
  alertaCoberturaBaja: boolean;
}

export interface ResumenPeriodo {
  diasConDatos: number;
  costoTotalEjecutado: number;
  costoPromedioPorRacion: number;
  errorAbsolutoMedio: number;
}

export interface ValorCalculado {
  nombre: string;
  valor: number;
}

// ----------------------------------------------------------------------------
// DTOs — Cocina (Turnos y Personal) — capacidad máxima de preparación
// ----------------------------------------------------------------------------
export interface Turno {
  idTurno: number;
  nombreTurno: string;
  horasDuracion: number;
}

export interface CrearTurnoRequest {
  nombreTurno: string;
  horasDuracion: number;
}

export interface PersonalCocina {
  idPersonal: number;
  nombreCompleto: string;
  racionesPorHoraCapacidad: number;
  idTurno: number;
}

export interface CrearPersonalCocinaRequest {
  nombreCompleto: string;
  racionesPorHoraCapacidad: number;
  idTurno: number;
}

// ----------------------------------------------------------------------------
// Cliente HTTP genérico — sin try/catch: los fallos se propagan como
// rechazos de promesa (`.catch`) para que cada vista decida cómo mostrarlos.
// ----------------------------------------------------------------------------
function rejectAsConnectionError(): never {
  throw new ApiError(0, "No fue posible conectar con el servidor PAE.");
}

function parseJsonBody(response: Response): Promise<unknown> {
  const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
  if (!isJson) {
    return Promise.resolve(null);
  }
  return response.json().catch(() => null);
}

function resolveResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return Promise.resolve(undefined as T);
  }
  return parseJsonBody(response).then(function toTypedBody(body: unknown): T {
    if (!response.ok) {
      const errorBody = body as ApiErrorBody | null;
      const message =
        errorBody?.detalles && errorBody.detalles.length > 0
          ? errorBody.detalles.join(" — ")
          : (errorBody?.mensaje ?? errorBody?.message ?? `Error ${response.status} al consultar el servidor.`);
      throw new ApiError(response.status, message);
    }
    return body as T;
  });
}

function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = { "Content-Type": "application/json", ...(options.headers ?? {}) };
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    .catch(rejectAsConnectionError)
    .then(resolveResponseBody<T>);
}

function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });
}

function apiPut<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(data) });
}

function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" });
}

// Un curso puede recalcular su plan varias veces el mismo día (ej. al
// ajustar la asistencia); nos quedamos solo con el más reciente (idPlan
// mayor) por cada combinación curso+fecha para no contar planes duplicados.
export function planesVigentes(planes: PlanRacion[]): PlanRacion[] {
  const masReciente = new Map<string, PlanRacion>();
  for (const plan of planes) {
    const clave = `${plan.idCurso}|${plan.fecha}`;
    const actual = masReciente.get(clave);
    if (!actual || plan.idPlan > actual.idPlan) masReciente.set(clave, plan);
  }
  return Array.from(masReciente.values());
}

// ----------------------------------------------------------------------------
// Insumos / Inventario
// ----------------------------------------------------------------------------
export const InsumoApi = {
  listar(): Promise<Insumo[]> {
    return apiGet<Insumo[]>("/insumo");
  },
  crear(data: CrearInsumoRequest): Promise<Insumo> {
    return apiPost<Insumo>("/insumo", data);
  },
  actualizar(idInsumo: number, data: CrearInsumoRequest): Promise<Insumo> {
    return apiPut<Insumo>(`/insumo/${idInsumo}`, data);
  },
  eliminar(idInsumo: number): Promise<void> {
    return apiDelete(`/insumo/${idInsumo}`);
  },
  consultar(idInsumo: number): Promise<Insumo> {
    return apiGet<Insumo>(`/insumo/${idInsumo}`);
  },
  listarMovimientos(idInsumo: number): Promise<MovimientoInsumo[]> {
    return apiGet<MovimientoInsumo[]>(`/insumo/${idInsumo}/movimiento`);
  },
  registrarMovimiento(idInsumo: number, data: RegistrarMovimientoRequest): Promise<MovimientoInsumo> {
    return apiPost<MovimientoInsumo>(`/insumo/${idInsumo}/movimiento`, data);
  },
  consumoDiario(idInsumo: number, fecha: string): Promise<ValorCalculado> {
    return apiGet<ValorCalculado>(`/insumo/${idInsumo}/consumo-diario?fecha=${fecha}`);
  },
  puntoReorden(idInsumo: number): Promise<ValorCalculado> {
    return apiGet<ValorCalculado>(`/insumo/${idInsumo}/punto-reorden`);
  },
};

// ----------------------------------------------------------------------------
// Cursos y Jornadas
// ----------------------------------------------------------------------------
export const CursoApi = {
  listar(): Promise<Curso[]> {
    return apiGet<Curso[]>("/curso");
  },
  listarPorJornada(idJornada: number): Promise<Curso[]> {
    return apiGet<Curso[]>(`/curso/jornada/${idJornada}`);
  },
  crear(data: CrearCursoRequest): Promise<Curso> {
    return apiPost<Curso>("/curso", data);
  },
  actualizar(idCurso: number, data: CrearCursoRequest): Promise<Curso> {
    return apiPut<Curso>(`/curso/${idCurso}`, data);
  },
  eliminar(idCurso: number): Promise<void> {
    return apiDelete(`/curso/${idCurso}`);
  },
};

export const JornadaApi = {
  listar(): Promise<Jornada[]> {
    return apiGet<Jornada[]>("/jornada");
  },
  crear(data: CrearJornadaRequest): Promise<Jornada> {
    return apiPost<Jornada>("/jornada", data);
  },
  actualizar(idJornada: number, data: CrearJornadaRequest): Promise<Jornada> {
    return apiPut<Jornada>(`/jornada/${idJornada}`, data);
  },
  eliminar(idJornada: number): Promise<void> {
    return apiDelete(`/jornada/${idJornada}`);
  },
};

export const EstudianteApi = {
  listarPorCurso(idCurso: number): Promise<Estudiante[]> {
    return apiGet<Estudiante[]>(`/estudiante/curso/${idCurso}`);
  },
  matricular(data: CrearEstudianteRequest): Promise<Estudiante> {
    return apiPost<Estudiante>("/estudiante", data);
  },
  actualizar(idEstudiante: number, data: CrearEstudianteRequest): Promise<Estudiante> {
    return apiPut<Estudiante>(`/estudiante/${idEstudiante}`, data);
  },
  eliminar(idEstudiante: number): Promise<void> {
    return apiDelete(`/estudiante/${idEstudiante}`);
  },
};

// ----------------------------------------------------------------------------
// Planificación de Raciones
// ----------------------------------------------------------------------------
export const PlanRacionApi = {
  calcular(data: CalcularPlanRequest): Promise<PlanRacion> {
    return apiPost<PlanRacion>("/plan/calcular", data);
  },
  consultar(idPlan: number): Promise<PlanRacion> {
    return apiGet<PlanRacion>(`/plan/${idPlan}`);
  },
  listarPorCurso(idCurso: number): Promise<PlanRacion[]> {
    return apiGet<PlanRacion[]>(`/plan/curso/${idCurso}`);
  },
  estadisticasPorCurso(idCurso: number): Promise<EstadisticasResumen> {
    return apiGet<EstadisticasResumen>(`/plan/curso/${idCurso}/estadisticas`);
  },
  estadisticasPorJornada(idJornada: number): Promise<EstadisticasResumen> {
    return apiGet<EstadisticasResumen>(`/plan/jornada/${idJornada}/estadisticas`);
  },
};

// ----------------------------------------------------------------------------
// Entregas en Comedor
// ----------------------------------------------------------------------------
function nullIfNotFound(err: unknown): null {
  if (err instanceof ApiError && err.status === 404) return null;
  throw err;
}

export const EntregaRacionApi = {
  registrar(data: RegistrarEntregaRequest): Promise<EntregaRacion> {
    return apiPost<EntregaRacion>("/entrega/registrar", data);
  },
  consultarPorPlan(idPlan: number): Promise<EntregaRacion | null> {
    return apiGet<EntregaRacion>(`/entrega/plan/${idPlan}`).catch(nullIfNotFound);
  },
};

// ----------------------------------------------------------------------------
// Indicadores y KPIs
// ----------------------------------------------------------------------------
export const IndicadoresApi = {
  porPlan(idPlan: number, umbralCobertura?: number): Promise<IndicadoresOperativos> {
    const query = umbralCobertura !== undefined ? `?umbralCobertura=${umbralCobertura}` : "";
    return apiGet<IndicadoresOperativos>(`/indicadores/plan/${idPlan}${query}`);
  },
  proporcionMatriculaPorJornada(idJornada: number): Promise<ValorCalculado> {
    return apiGet<ValorCalculado>(`/indicadores/jornada/${idJornada}/proporcion-matricula`);
  },
  resumenPeriodo(idCurso: number, desde: string, hasta: string): Promise<ResumenPeriodo> {
    return apiGet<ResumenPeriodo>(`/indicadores/curso/${idCurso}/resumen-periodo?desde=${desde}&hasta=${hasta}`);
  },
  ahorroPorOptimizacion(
    idCurso: number,
    desdeAntes: string,
    hastaAntes: string,
    desdeAhora: string,
    hastaAhora: string
  ): Promise<ValorCalculado> {
    return apiGet<ValorCalculado>(
      `/indicadores/curso/${idCurso}/ahorro-optimizacion?desdeAntes=${desdeAntes}&hastaAntes=${hastaAntes}&desdeAhora=${desdeAhora}&hastaAhora=${hastaAhora}`
    );
  },
};

// ----------------------------------------------------------------------------
// Cocina — Turnos y Personal (capacidad máxima de preparación, fórmula #19)
// ----------------------------------------------------------------------------
export const CocinaApi = {
  listarTurnos(): Promise<Turno[]> {
    return apiGet<Turno[]>("/cocina/turno");
  },
  crearTurno(data: CrearTurnoRequest): Promise<Turno> {
    return apiPost<Turno>("/cocina/turno", data);
  },
  capacidadMaxima(idTurno: number): Promise<ValorCalculado> {
    return apiGet<ValorCalculado>(`/cocina/turno/${idTurno}/capacidad-maxima`);
  },
  listarPersonalPorTurno(idTurno: number): Promise<PersonalCocina[]> {
    return apiGet<PersonalCocina[]>(`/cocina/turno/${idTurno}/personal`);
  },
  registrarPersonal(data: CrearPersonalCocinaRequest): Promise<PersonalCocina> {
    return apiPost<PersonalCocina>("/cocina/personal", data);
  },
};
