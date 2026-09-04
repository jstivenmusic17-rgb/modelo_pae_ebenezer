import { type FormEvent, type JSX, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChefHat,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { blurInput, FormField, focusInput, INPUT_CLASS, INPUT_STYLE, SubmitButton } from "../components/FormField.tsx";
import Modal from "../components/Modal.tsx";
import {
  ApiError,
  CocinaApi,
  CursoApi,
  EntregaRacionApi,
  IndicadoresApi,
  PlanRacionApi,
  planesVigentes,
  type Curso,
  type EntregaRacion,
  type EstadisticasResumen,
  type PersonalCocina,
  type PlanRacion,
  type ResumenPeriodo,
  type Turno,
} from "../services/api.ts";
import type { ReporteExportData } from "../services/reporteExport.ts";

const DIA_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const PALETA = ["#1E3A8A", "#3B82F6", "#10B981", "#F97316", "#8B5CF6", "#EC4899", "#0EA5E9", "#EAB308"];
const COSTO_RACION_DEFECTO = 4350;

const ESTADISTICAS_VACIAS: EstadisticasResumen = {
  totalPlanes: 0,
  totalRacionesPlanificadas: 0,
  totalRacionesServidas: 0,
  totalRacionesSobrantes: 0,
  totalRacionesFaltantes: 0,
  costoTotalSobrante: 0,
  costoTotalFaltante: 0,
  costoTotal: 0,
};

interface PuntoTendencia {
  day: string;
  efficiency: number;
}

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface RangoFechas {
  desde: string;
  hasta: string;
}

interface PrecisionPronostico {
  diasConDatos: number;
  errorAbsolutoMedio: number;
  costoPromedioPorRacion: number;
}

const PRECISION_VACIA: PrecisionPronostico = { diasConDatos: 0, errorAbsolutoMedio: 0, costoPromedioPorRacion: 0 };

interface ReporteDatos {
  ahorroAcumulado: number;
  estadisticas: EstadisticasResumen;
  donutData: DonutSlice[];
  tendencia: PuntoTendencia[];
  racionesSemana: number;
  costoUnitario: number;
  costoProduccionTotal: number;
  precision: PrecisionPronostico;
}

function ultimosDiasHabiles(cantidad: number): string[] {
  const fechas: string[] = [];
  const cursor = new Date();
  while (fechas.length < cantidad) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) fechas.unshift(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() - 1);
  }
  return fechas;
}

function rangoMesActual(): RangoFechas {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { desde: desde.toISOString().slice(0, 10), hasta: hoy.toISOString().slice(0, 10) };
}

function rangoMesAnterior(): RangoFechas {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

function sumarEstadisticas(acc: EstadisticasResumen, e: EstadisticasResumen | null): EstadisticasResumen {
  if (!e) return acc;
  return {
    totalPlanes: acc.totalPlanes + e.totalPlanes,
    totalRacionesPlanificadas: acc.totalRacionesPlanificadas + e.totalRacionesPlanificadas,
    totalRacionesServidas: acc.totalRacionesServidas + e.totalRacionesServidas,
    totalRacionesSobrantes: acc.totalRacionesSobrantes + e.totalRacionesSobrantes,
    totalRacionesFaltantes: acc.totalRacionesFaltantes + e.totalRacionesFaltantes,
    costoTotalSobrante: acc.costoTotalSobrante + e.costoTotalSobrante,
    costoTotalFaltante: acc.costoTotalFaltante + e.costoTotalFaltante,
    costoTotal: acc.costoTotal + e.costoTotal,
  };
}

// ----------------------------------------------------------------------------
// Carga de datos — cada bloque analítico se resuelve en paralelo y se
// combina al final; sin try/catch, los fallos parciales caen a valores
// neutros mediante `.catch()` y solo un fallo total del listado de cursos
// se propaga como error visible.
// ----------------------------------------------------------------------------
function cargarEstadisticasYDistribucion(
  cursos: Curso[]
): Promise<{ estadisticas: EstadisticasResumen; donutData: DonutSlice[] }> {
  return Promise.all(
    cursos.map((c) => PlanRacionApi.estadisticasPorCurso(c.idCurso).catch((): null => null))
  ).then(function combinar(estadisticasPorCurso: (EstadisticasResumen | null)[]) {
    const estadisticas = estadisticasPorCurso.reduce(sumarEstadisticas, ESTADISTICAS_VACIAS);
    const donutData = cursos
      .map(
        (c, i): DonutSlice => ({
          name: c.nombreCurso,
          value: estadisticasPorCurso[i]?.totalRacionesServidas ?? 0,
          color: PALETA[i % PALETA.length],
        })
      )
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
    return { estadisticas, donutData };
  });
}

function cargarAhorroAcumulado(cursos: Curso[]): Promise<number> {
  const antes = rangoMesAnterior();
  const ahora = rangoMesActual();
  return Promise.all(
    cursos.map((c) =>
      IndicadoresApi.ahorroPorOptimizacion(c.idCurso, antes.desde, antes.hasta, ahora.desde, ahora.hasta)
        .then((v) => v.valor)
        .catch((): number => 0)
    )
  ).then((valores) => valores.reduce((s, v) => s + v, 0));
}

// Fórmula #16 del modelo analítico (Error Absoluto Medio del pronóstico):
// se promedia el MAE de cada curso ponderado por sus días con datos, ya que
// el backend solo expone el MAE ya agregado por curso (no la serie diaria).
function cargarPrecisionPronostico(cursos: Curso[]): Promise<PrecisionPronostico> {
  const { desde, hasta } = rangoMesActual();
  return Promise.all(
    cursos.map((c) => IndicadoresApi.resumenPeriodo(c.idCurso, desde, hasta).catch((): null => null))
  ).then(function combinar(resumenes: (ResumenPeriodo | null)[]): PrecisionPronostico {
    const validos = resumenes.filter(function tieneDatos(r): r is ResumenPeriodo {
      return r !== null && r.diasConDatos > 0;
    });
    const totalDias = validos.reduce((s, r) => s + r.diasConDatos, 0);
    if (totalDias === 0) return PRECISION_VACIA;

    const errorAbsolutoMedio = validos.reduce((s, r) => s + r.errorAbsolutoMedio * r.diasConDatos, 0) / totalDias;
    const costoPromedioPorRacion =
      validos.reduce((s, r) => s + r.costoPromedioPorRacion * r.diasConDatos, 0) / totalDias;

    return { diasConDatos: totalDias, errorAbsolutoMedio, costoPromedioPorRacion };
  });
}

interface TendenciaYSemana {
  tendencia: PuntoTendencia[];
  racionesSemana: number;
  costoUnitario: number;
  costoProduccionTotal: number;
}

function cargarTendenciaYSemana(cursos: Curso[]): Promise<TendenciaYSemana> {
  const fechas = ultimosDiasHabiles(6);

  return Promise.all(cursos.map((c) => PlanRacionApi.listarPorCurso(c.idCurso).catch((): PlanRacion[] => [])))
    .then(function conPlanes(planesPorCursoBruto: PlanRacion[][]): Promise<TendenciaYSemana> {
      // Si un curso recalculó su plan varias veces el mismo día, solo el
      // más reciente cuenta (evita duplicar demanda/entregas en la tendencia).
      const todosLosPlanes = planesPorCursoBruto.flatMap(planesVigentes);
      const idsRelevantes = Array.from(
        new Set(todosLosPlanes.filter((p) => fechas.includes(p.fecha)).map((p) => p.idPlan))
      );

      return Promise.all(
        idsRelevantes.map((idPlan) =>
          EntregaRacionApi.consultarPorPlan(idPlan).then((entrega) => [idPlan, entrega] as const)
        )
      ).then(function conEntregas(pares): TendenciaYSemana {
        const entregasPorPlan = new Map<number, EntregaRacion | null>(pares);

        const tendencia = fechas.map(function calcularPunto(fecha: string): PuntoTendencia {
          const planesDelDia = todosLosPlanes.filter((p) => p.fecha === fecha);
          const esperadas = planesDelDia.reduce((s, p) => s + p.racionesPlanificadas, 0);
          const sobrantes = planesDelDia.reduce(
            (s, p) => s + (entregasPorPlan.get(p.idPlan)?.racionesSobrantes ?? 0),
            0
          );
          const dow = new Date(`${fecha}T00:00:00`).getDay();
          const efficiency = esperadas > 0 ? Math.max(0, 100 - (sobrantes / esperadas) * 100) : 100;
          return { day: DIA_LABEL[dow], efficiency };
        });

        const racionesSemana = todosLosPlanes
          .filter((p) => fechas.includes(p.fecha))
          .reduce((s, p) => s + (entregasPorPlan.get(p.idPlan)?.racionesServidas ?? 0), 0);

        const planMasReciente = [...todosLosPlanes].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
        const costoUnitario = planMasReciente ? planMasReciente.costoProduccionUnitario : COSTO_RACION_DEFECTO;

        // "costoTotal" de EstadisticasResumen es el costo de la desviación
        // (sobrante+faltante), NO el presupuesto ejecutado — para medir
        // eficiencia presupuestal se compara contra el costo de producción
        // total real de los planes (costoTotalProduccion).
        const costoProduccionTotal = todosLosPlanes.reduce((s, p) => s + p.costoTotalProduccion, 0);

        return { tendencia, racionesSemana, costoUnitario, costoProduccionTotal };
      });
    });
}

function cargarReporte(): Promise<ReporteDatos> {
  return CursoApi.listar().then(function conCursos(cursos: Curso[]): Promise<ReporteDatos> {
    return Promise.all([
      cargarEstadisticasYDistribucion(cursos),
      cargarAhorroAcumulado(cursos),
      cargarTendenciaYSemana(cursos),
      cargarPrecisionPronostico(cursos),
    ]).then(function combinarTodo([
      estadisticasYDistribucion,
      ahorroAcumulado,
      tendenciaYSemana,
      precision,
    ]): ReporteDatos {
      return {
        ahorroAcumulado,
        estadisticas: estadisticasYDistribucion.estadisticas,
        donutData: estadisticasYDistribucion.donutData,
        precision,
        ...tendenciaYSemana,
      };
    });
  });
}

interface TurnoConCapacidad extends Turno {
  personal: PersonalCocina[];
  capacidadMaximaRaciones: number;
}

// Fórmula #19 del modelo analítico (Capacidad Máxima de Preparación):
// suma de raciones/hora de todo el personal de un turno × horas del turno.
function cargarCapacidadCocina(): Promise<TurnoConCapacidad[]> {
  return CocinaApi.listarTurnos().then(function conTurnos(turnos: Turno[]): Promise<TurnoConCapacidad[]> {
    return Promise.all(
      turnos.map(function conCapacidadYPersonal(turno: Turno): Promise<TurnoConCapacidad> {
        return Promise.all([
          CocinaApi.capacidadMaxima(turno.idTurno)
            .then((v) => v.valor)
            .catch((): number => 0),
          CocinaApi.listarPersonalPorTurno(turno.idTurno).catch((): PersonalCocina[] => []),
        ]).then(function combinar([capacidadMaximaRaciones, personal]): TurnoConCapacidad {
          return { ...turno, capacidadMaximaRaciones, personal };
        });
      })
    );
  });
}

interface DonutChartProps {
  data: DonutSlice[];
  total: number;
  totalLabel: string;
}

function DonutChart({ data, total, totalLabel }: DonutChartProps): JSX.Element {
  const [hovered, setHovered] = useState<number | null>(null);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 80;
  const innerR = 54;
  const sumaValores = data.reduce((s, d) => s + d.value, 0) || 1;
  const gap = 2;

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const fraction = d.value / sumaValores;
    const sweep = fraction * 2 * Math.PI - (gap * Math.PI) / 180;
    const startA = cumAngle + (gap * Math.PI) / 360;
    const endA = cumAngle + sweep + (gap * Math.PI) / 360;
    cumAngle += fraction * 2 * Math.PI;

    const x1 = cx + outerR * Math.cos(startA);
    const y1 = cy + outerR * Math.sin(startA);
    const x2 = cx + outerR * Math.cos(endA);
    const y2 = cy + outerR * Math.sin(endA);
    const x3 = cx + innerR * Math.cos(endA);
    const y3 = cy + innerR * Math.sin(endA);
    const x4 = cx + innerR * Math.cos(startA);
    const y4 = cy + innerR * Math.sin(startA);
    const largeArc = sweep > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");

    return { ...d, path, i, percent: Math.round(fraction * 100) };
  });

  const hov = hovered !== null ? slices[hovered] : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s) => (
            <path
              key={s.name}
              d={s.path}
              fill={s.color}
              opacity={hovered === null || hovered === s.i ? 1 : 0.35}
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={() => setHovered(s.i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                transform: hovered === s.i ? "scale(1.04)" : "scale(1)",
                transformOrigin: `${cx}px ${cy}px`,
                transition: "transform 0.15s, opacity 0.15s",
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hov ? (
            <>
              <span className="text-2xl font-bold" style={{ color: hov.color }}>{hov.percent}%</span>
              <span className="text-[10px] font-semibold text-center leading-tight mt-0.5" style={{ color: "#64748B", maxWidth: 70 }}>
                {hov.name}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold" style={{ color: "#0F172A" }}>{total.toLocaleString("es-CO")}</span>
              <span className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>{totalLabel}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {slices.map((d, i) => (
          <div
            key={d.name}
            className="flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors duration-150"
            style={{ backgroundColor: hovered === i ? "#F8FAFC" : "transparent" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-sm flex-1 font-medium truncate" style={{ color: "#475569" }}>{d.name}</span>
            <span className="text-sm font-bold" style={{ color: "#0F172A" }}>{d.percent}%</span>
          </div>
        ))}
        {slices.length === 0 && (
          <p className="text-xs" style={{ color: "#94A3B8" }}>Aún no hay raciones servidas registradas.</p>
        )}
      </div>
    </div>
  );
}

interface TrendMiniChartProps {
  data: PuntoTendencia[];
}

function TrendMiniChart({ data }: TrendMiniChartProps): JSX.Element | null {
  if (data.length < 2) return null;
  const w = 200;
  const h = 48;
  const max = Math.max(100, ...data.map((d) => d.efficiency));
  const min = Math.min(80, ...data.map((d) => d.efficiency));
  const range = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.efficiency - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const fillPts = `0,${h} ${pts} ${w},${h}`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#trendFill)" />
      <polyline points={pts} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((d.efficiency - min) / range) * h;
        return (
          <g key={`${d.day}-${i}`}>
            <circle cx={x} cy={y} r={3} fill="#3B82F6" />
            <text x={x} y={h + 14} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="Plus Jakarta Sans, sans-serif">
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ReportesView(): JSX.Element {
  const [exportLoading, setExportLoading] = useState<"pdf" | "excel" | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ahorroAcumulado, setAhorroAcumulado] = useState(0);
  const [estadisticas, setEstadisticas] = useState<EstadisticasResumen | null>(null);
  const [tendencia, setTendencia] = useState<PuntoTendencia[]>([]);
  const [racionesSemana, setRacionesSemana] = useState(0);
  const [donutData, setDonutData] = useState<DonutSlice[]>([]);
  const [costoUnitario, setCostoUnitario] = useState(COSTO_RACION_DEFECTO);
  const [costoProduccionTotal, setCostoProduccionTotal] = useState(0);
  const [precision, setPrecision] = useState<PrecisionPronostico>(PRECISION_VACIA);

  const [turnos, setTurnos] = useState<TurnoConCapacidad[]>([]);
  const [cargandoCocina, setCargandoCocina] = useState(true);
  const [errorCocina, setErrorCocina] = useState<string | null>(null);
  const [mostrarNuevoTurno, setMostrarNuevoTurno] = useState(false);
  const [registrandoTurno, setRegistrandoTurno] = useState(false);
  const [turnoParaPersonal, setTurnoParaPersonal] = useState<number | null>(null);
  const [registrandoPersonalDe, setRegistrandoPersonalDe] = useState<number | null>(null);
  const [errorFormularioCocina, setErrorFormularioCocina] = useState<string | null>(null);

  useEffect(function cargarAlMontar() {
    setCargando(true);
    setError(null);
    cargarReporte()
      .then(function aplicarDatos(datos: ReporteDatos): void {
        setAhorroAcumulado(datos.ahorroAcumulado);
        setEstadisticas(datos.estadisticas);
        setDonutData(datos.donutData);
        setTendencia(datos.tendencia);
        setRacionesSemana(datos.racionesSemana);
        setCostoUnitario(datos.costoUnitario);
        setCostoProduccionTotal(datos.costoProduccionTotal);
        setPrecision(datos.precision);
      })
      .catch(function manejarError(err: unknown): void {
        setError(err instanceof ApiError ? err.message : "No fue posible cargar los reportes.");
      })
      .finally(function detenerCarga(): void {
        setCargando(false);
      });
  }, []);

  // Independiente del resto del reporte: la capacidad de cocina no depende
  // de los cursos, así que se carga y refresca por separado.
  const cargarTurnos = useCallback(function cargarTurnosImpl(): Promise<void> {
    setCargandoCocina(true);
    setErrorCocina(null);
    return cargarCapacidadCocina()
      .then(setTurnos)
      .catch(function manejarErrorDeCocina(err: unknown): void {
        setErrorCocina(err instanceof ApiError ? err.message : "No fue posible cargar la capacidad de cocina.");
      })
      .finally(function detenerCargaDeCocina(): void {
        setCargandoCocina(false);
      });
  }, []);

  useEffect(
    function cargarCocinaAlMontar() {
      cargarTurnos();
    },
    [cargarTurnos]
  );

  const eficienciaPresupuestal = useMemo(
    function calcularEficienciaPresupuestal(): number {
      if (!estadisticas || costoProduccionTotal <= 0) return 0;
      const desviacion = estadisticas.costoTotalSobrante + estadisticas.costoTotalFaltante;
      return Math.max(0, 100 - (desviacion / costoProduccionTotal) * 100);
    },
    [estadisticas, costoProduccionTotal]
  );

  const totalRaciones = estadisticas?.totalRacionesServidas ?? 0;
  const desperdicioTotal = estadisticas?.totalRacionesSobrantes ?? 0;
  const eficienciaEntrega =
    estadisticas && estadisticas.totalRacionesPlanificadas > 0
      ? Math.max(0, 100 - (desperdicioTotal / estadisticas.totalRacionesPlanificadas) * 100)
      : 0;

  function buildExportData(): ReporteExportData {
    return {
      generadoEn: new Date(),
      ahorroAcumulado,
      eficienciaPresupuestal,
      racionesSemana,
      totalRaciones,
      desperdicioTotal,
      eficienciaEntrega,
      costoUnitario,
      donutData,
      tendencia,
      errorAbsolutoMedio: precision.errorAbsolutoMedio,
      diasConDatosPronostico: precision.diasConDatos,
    };
  }

  function handleExport(type: "pdf" | "excel"): void {
    setExportLoading(type);
    const datos = buildExportData();

    import("../services/reporteExport.ts")
      .then(function generarArchivo(modulo): void {
        if (type === "excel") {
          modulo.exportarReporteExcel(datos);
        } else {
          modulo.exportarReportePdf(datos);
        }
      })
      .catch(function manejarErrorDeExportacion(): void {
        setError("No fue posible generar el archivo de exportación.");
      })
      .finally(function detenerExportacion(): void {
        setExportLoading(null);
      });
  }

  function abrirNuevoTurno(): void {
    setErrorFormularioCocina(null);
    setMostrarNuevoTurno(true);
  }

  function abrirRegistrarPersonal(idTurno: number): void {
    setErrorFormularioCocina(null);
    setTurnoParaPersonal(idTurno);
  }

  function handleSubmitTurno(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombreTurno = String(formData.get("nombreTurno") ?? "").trim();
    const horasDuracion = Number(formData.get("horasDuracion"));

    if (!nombreTurno || !Number.isFinite(horasDuracion) || horasDuracion <= 0) {
      setErrorFormularioCocina("Ingresa un nombre y unas horas de duración mayores a 0.");
      return;
    }

    setRegistrandoTurno(true);
    setErrorFormularioCocina(null);
    CocinaApi.crearTurno({ nombreTurno, horasDuracion })
      .then(function alCrear(): Promise<void> {
        setMostrarNuevoTurno(false);
        return cargarTurnos();
      })
      .catch(function manejarErrorDeTurno(): void {
        setErrorFormularioCocina("No fue posible registrar el turno.");
      })
      .finally(function detenerRegistroDeTurno(): void {
        setRegistrandoTurno(false);
      });
  }

  function handleSubmitPersonal(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (turnoParaPersonal === null) return;

    const formData = new FormData(e.currentTarget);
    const nombreCompleto = String(formData.get("nombreCompleto") ?? "").trim();
    const racionesPorHoraCapacidad = Number(formData.get("racionesPorHoraCapacidad"));

    if (!nombreCompleto || !Number.isFinite(racionesPorHoraCapacidad) || racionesPorHoraCapacidad <= 0) {
      setErrorFormularioCocina("Ingresa un nombre y una capacidad mayor a 0 raciones/hora.");
      return;
    }

    const idTurno = turnoParaPersonal;
    setRegistrandoPersonalDe(idTurno);
    setErrorFormularioCocina(null);
    CocinaApi.registrarPersonal({ nombreCompleto, racionesPorHoraCapacidad, idTurno })
      .then(function alRegistrar(): Promise<void> {
        setTurnoParaPersonal(null);
        return cargarTurnos();
      })
      .catch(function manejarErrorDePersonal(): void {
        setErrorFormularioCocina("No fue posible registrar al personal de cocina.");
      })
      .finally(function detenerRegistroDePersonal(): void {
        setRegistrandoPersonalDe(null);
      });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "#0F172A" }}>
            <FileText className="w-5 h-5" style={{ color: "#1E3A8A" }} />
            Reportes y KPIs
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Análisis de eficiencia presupuestal y distribución de consumos
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport("excel")}
            disabled={exportLoading !== null || cargando}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-sm active:scale-95"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" }}
          >
            {exportLoading === "excel" ? (
              <CheckCircle2 className="w-4 h-4" style={{ color: "#10B981" }} />
            ) : (
              <Download className="w-4 h-4" style={{ color: "#64748B" }} />
            )}
            {exportLoading === "excel" ? "Generando..." : "Excel"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exportLoading !== null || cargando}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
              boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
            }}
          >
            {exportLoading === "pdf" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exportLoading === "pdf" ? "Generando..." : "PDF Report"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
        >
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: "#94A3B8" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando reportes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                  Ahorro Acumulado (Mes)
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
                  <DollarSign className="w-4 h-4" style={{ color: "#10B981" }} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-bold tracking-tight" style={{ color: "#0F172A" }}>
                  $ {Math.round(ahorroAcumulado).toLocaleString("es-CO")}
                </h3>
                <span
                  className="flex items-center text-xs font-bold px-2 py-0.5 rounded-full"
                  style={
                    ahorroAcumulado >= 0
                      ? { backgroundColor: "#ECFDF5", color: "#059669" }
                      : { backgroundColor: "#FFF7ED", color: "#EA580C" }
                  }
                >
                  {ahorroAcumulado >= 0 ? (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  )}
                  vs. mes anterior
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                Optimización de insumos vs. presupuesto
              </p>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                  Eficiencia Presupuestal
                </span>
              </div>
              <h3 className="text-4xl font-bold tracking-tight mb-3" style={{ color: "#0F172A" }}>
                {eficienciaPresupuestal.toFixed(1)}%
              </h3>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${eficienciaPresupuestal}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #1E3A8A, #3B82F6)" }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>Tendencia últimos días hábiles</p>
              <div className="mt-3">
                <TrendMiniChart data={tendencia} />
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                Raciones Servidas (Semana)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-bold tracking-tight" style={{ color: "#0F172A" }}>
                  {racionesSemana.toLocaleString("es-CO")}
                </h3>
              </div>
              <div className="mt-3 flex gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10B981" }} />
                  Últimos {tendencia.length || 6} días hábiles
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                  Precisión del Pronóstico (MAE)
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
                  <Target className="w-4 h-4" style={{ color: "#3B82F6" }} />
                </div>
              </div>
              {precision.diasConDatos > 0 ? (
                <>
                  <h3 className="text-4xl font-bold tracking-tight" style={{ color: "#0F172A" }}>
                    {precision.errorAbsolutoMedio.toFixed(1)}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                    raciones de error promedio/día · {precision.diasConDatos} días con datos este mes
                  </p>
                  <div
                    className="mt-3 rounded-lg px-3 py-2 flex justify-between items-center"
                    style={{ backgroundColor: "#F8FAFC" }}
                  >
                    <span className="text-xs font-medium" style={{ color: "#475569" }}>Costo real / ración</span>
                    <span className="text-sm font-bold" style={{ color: "#0F172A" }}>
                      ${Math.round(precision.costoPromedioPorRacion).toLocaleString("es-CO")}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>
                  Aún no hay entregas registradas este mes para calcular el error del pronóstico.
                </p>
              )}
            </div>
          </div>

          <div
            className="col-span-1 md:col-span-2 rounded-2xl p-6 flex flex-col"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}
          >
            <div className="mb-6">
              <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>
                Distribución de Raciones Servidas por Curso
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                Pase el cursor sobre cada segmento para ver detalles
              </p>
            </div>
            <div className="flex-1 flex items-center">
              <DonutChart data={donutData} total={totalRaciones} totalLabel="Total raciones" />
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5" style={{ borderTop: "1px solid #F1F5F9" }}>
              {[
                { label: "Total Raciones", value: totalRaciones.toLocaleString("es-CO"), color: "#1E3A8A" },
                { label: "Desperdicio", value: `${desperdicioTotal.toLocaleString("es-CO")} rac.`, color: "#F97316" },
                { label: "Eficiencia", value: `${eficienciaEntrega.toFixed(1)}%`, color: "#10B981" },
                { label: "Costo Unitario", value: `$${Math.round(costoUnitario).toLocaleString("es-CO")}`, color: "#8B5CF6" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fórmula #19: capacidad máxima de preparación por turno de cocina */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}
      >
        <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "#0F172A" }}>
              <ChefHat className="w-4 h-4" style={{ color: "#1E3A8A" }} />
              Capacidad Operativa de Cocina
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              Personal × raciones/hora × horas de turno — límite máximo de preparación
            </p>
          </div>
          <button
            onClick={abrirNuevoTurno}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-sm active:scale-95 flex-shrink-0"
            style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo turno
          </button>
        </div>

        <div className="p-5">
          {errorCocina && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
            >
              {errorCocina}
            </div>
          )}

          {cargandoCocina ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: "#94A3B8" }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando turnos de cocina...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {turnos.map((turno) => (
                <div
                  key={turno.idTurno}
                  className="p-4 rounded-xl flex flex-col gap-3"
                  style={{ backgroundColor: "#F8FAFC", border: "1px solid #F1F5F9" }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#0F172A" }}>{turno.nombreTurno}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#94A3B8" }}>
                        {turno.horasDuracion}h de turno · {turno.personal.length} en cocina
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold tracking-tight" style={{ color: "#1E3A8A" }}>
                        {Math.round(turno.capacidadMaximaRaciones)}
                      </p>
                      <p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>raciones máx.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => abrirRegistrarPersonal(turno.idTurno)}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200"
                    style={{ backgroundColor: "#FFFFFF", color: "#1E3A8A", border: "1px solid #E2E8F0" }}
                  >
                    <UserPlus className="w-3 h-3" />
                    Registrar personal
                  </button>
                </div>
              ))}
              {turnos.length === 0 && (
                <div className="col-span-1 md:col-span-2 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                  No hay turnos de cocina registrados. Usa "Nuevo turno" para calcular su capacidad máxima.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mostrarNuevoTurno && (
        <Modal
          title="Nuevo Turno de Cocina"
          description="Define un turno para calcular su capacidad máxima de preparación."
          onClose={() => setMostrarNuevoTurno(false)}
        >
          <form onSubmit={handleSubmitTurno} className="flex flex-col gap-4">
            <FormField label="Nombre del turno">
              <input
                name="nombreTurno"
                required
                autoFocus
                placeholder="Ej. Mañana, Tarde"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <FormField label="Horas de duración">
              <input
                name="horasDuracion"
                type="number"
                min="0.5"
                step="0.5"
                required
                defaultValue={5}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorFormularioCocina && (
              <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorFormularioCocina}</p>
            )}
            <SubmitButton submitting={registrandoTurno} submittingLabel="Creando..." label="Crear Turno" />
          </form>
        </Modal>
      )}

      {turnoParaPersonal !== null && (
        <Modal
          title="Registrar Personal de Cocina"
          description="Su capacidad en raciones/hora se suma al límite máximo del turno."
          onClose={() => setTurnoParaPersonal(null)}
        >
          <form onSubmit={handleSubmitPersonal} className="flex flex-col gap-4">
            <FormField label="Nombre completo">
              <input
                name="nombreCompleto"
                required
                autoFocus
                placeholder="Ej. Ana Torres"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <FormField label="Raciones que prepara por hora">
              <input
                name="racionesPorHoraCapacidad"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={50}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorFormularioCocina && (
              <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorFormularioCocina}</p>
            )}
            <SubmitButton
              submitting={registrandoPersonalDe === turnoParaPersonal}
              submittingLabel="Registrando..."
              label="Registrar Personal"
            />
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
