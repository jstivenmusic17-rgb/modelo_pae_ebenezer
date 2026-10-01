import { type JSX, type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Download, Target } from "lucide-react";

import {
  ApiError,
  CursoApi,
  EntregaRacionApi,
  IndicadoresApi,
  PlanRacionApi,
  planesVigentes,
  type Curso,
  type EntregaRacion,
  type EstadisticasResumen,
  type PlanRacion,
  type ResumenPeriodo,
} from "../services/api.ts";
import type { ReporteExportData } from "../services/reporteExport.ts";
import EmptyState from "../components/EmptyState";
import { Aviso, Cargando, EncabezadoVista, Tarjeta, TituloSeccion } from "../components/Ui";
import type { Navegar } from "../components/Navegacion";
import { cargarParametros } from "../lib/datos";
import { FORMULAS, fechaISO, formatoCOP } from "../lib/modelo";

const DIA_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const PALETA = ["#1E3A8A", "#3B82F6", "#10B981", "#F97316", "#8B5CF6", "#EC4899", "#0EA5E9", "#EAB308"];

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
    if (dow !== 0 && dow !== 6) fechas.unshift(fechaISO(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return fechas;
}

function rangoMesActual(): RangoFechas {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { desde: fechaISO(desde), hasta: fechaISO(hoy) };
}

function rangoMesAnterior(): RangoFechas {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
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
        const costoUnitario = planMasReciente ? planMasReciente.costoProduccionUnitario : 0;

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

function TarjetaKpi({ etiqueta, formula, valor, detalle, children }: {
  etiqueta: string;
  formula?: string;
  valor: string;
  detalle: string;
  children?: ReactNode;
}): JSX.Element {
  return (
    <Tarjeta>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#64748B" }}>{etiqueta}</span>
        {formula && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}>
            {formula}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight mt-2" style={{ color: "#0F172A" }}>{valor}</p>
      <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{detalle}</p>
      {children}
    </Tarjeta>
  );
}

export default function ReportesView({ navegar }: { navegar: Navegar }): JSX.Element {
  const [exportLoading, setExportLoading] = useState<"pdf" | "excel" | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<ReporteDatos | null>(null);
  const [costoParametro, setCostoParametro] = useState(0);

  useEffect(function cargarAlMontar() {
    Promise.all([cargarReporte(), cargarParametros()])
      .then(function aplicarDatos([reporte, parametros]): void {
        setDatos(reporte);
        setCostoParametro(parametros.costoProduccionUnitario);
      })
      .catch(function manejarError(err: unknown): void {
        setError(err instanceof ApiError ? err.message : "No fue posible cargar los reportes.");
      })
      .finally(function detenerCarga(): void {
        setCargando(false);
      });
  }, []);

  const estadisticas = datos?.estadisticas ?? ESTADISTICAS_VACIAS;
  const costoUnitario = datos && datos.costoUnitario > 0 ? datos.costoUnitario : costoParametro;
  const precision = datos?.precision ?? PRECISION_VACIA;

  const eficienciaPresupuestal = useMemo(
    function calcularEficienciaPresupuestal(): number {
      if (!datos || datos.costoProduccionTotal <= 0) return 0;
      const desviacion = estadisticas.costoTotalSobrante + estadisticas.costoTotalFaltante;
      return Math.max(0, 100 - (desviacion / datos.costoProduccionTotal) * 100);
    },
    [datos, estadisticas]
  );

  const totalRaciones = estadisticas.totalRacionesServidas;
  const desperdicioTotal = estadisticas.totalRacionesSobrantes;
  const tasaDesperdicio =
    estadisticas.totalRacionesPlanificadas > 0 ? (desperdicioTotal / estadisticas.totalRacionesPlanificadas) * 100 : 0;
  const eficienciaEntrega = estadisticas.totalRacionesPlanificadas > 0 ? Math.max(0, 100 - tasaDesperdicio) : 0;
  const sinDatos = estadisticas.totalPlanes === 0;

  function buildExportData(): ReporteExportData {
    return {
      generadoEn: new Date(),
      ahorroAcumulado: datos?.ahorroAcumulado ?? 0,
      eficienciaPresupuestal,
      racionesSemana: datos?.racionesSemana ?? 0,
      totalRaciones,
      desperdicioTotal,
      eficienciaEntrega,
      costoUnitario,
      donutData: datos?.donutData ?? [],
      tendencia: datos?.tendencia ?? [],
      errorAbsolutoMedio: precision.errorAbsolutoMedio,
      diasConDatosPronostico: precision.diasConDatos,
    };
  }

  function handleExport(type: "pdf" | "excel"): void {
    setExportLoading(type);
    const exportData = buildExportData();
    import("../services/reporteExport.ts")
      .then(function generarArchivo(modulo): void {
        if (type === "excel") modulo.exportarReporteExcel(exportData);
        else modulo.exportarReportePdf(exportData);
      })
      .catch(function manejarErrorDeExportacion(): void {
        setError("No fue posible generar el archivo de exportación.");
      })
      .finally(function detenerExportacion(): void {
        setExportLoading(null);
      });
  }

  const botonExportar = (tipo: "excel" | "pdf", etiqueta: string) => (
    <button
      onClick={() => handleExport(tipo)}
      disabled={exportLoading !== null || cargando || sinDatos}
      className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
      style={
        tipo === "pdf"
          ? { background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", color: "#FFFFFF" }
          : { backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" }
      }
    >
      {exportLoading === tipo ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      {exportLoading === tipo ? "Generando..." : etiqueta}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <EncabezadoVista
        titulo="Reportes e indicadores"
        descripcion="Compara lo planificado con lo que realmente se sirvió. Cada indicador lleva el número de su fórmula en el documento del modelo (F1–F20)."
      >
        <div className="flex gap-2">
          {botonExportar("excel", "Excel")}
          {botonExportar("pdf", "Informe PDF")}
        </div>
      </EncabezadoVista>

      {error && <Aviso tono="error">{error}</Aviso>}

      {cargando ? (
        <Cargando texto="Cargando reportes..." />
      ) : sinDatos ? (
        <EmptyState
          titulo="Aún no hay datos para reportar"
          mensaje="Los indicadores aparecen cuando hay planes calculados y raciones registradas en el comedor."
          accion={{ etiqueta: "Ir a Plan del día", onClick: () => navegar("plan") }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TarjetaKpi
              etiqueta="Ahorro vs. mes anterior"
              formula="F20"
              valor={formatoCOP(datos?.ahorroAcumulado ?? 0)}
              detalle={(datos?.ahorroAcumulado ?? 0) >= 0 ? "ahorro por tener menos sobrantes que el mes pasado" : "este mes hubo más sobrantes que el mes pasado (o el mes pasado no tiene datos)"}
            />
            <TarjetaKpi
              etiqueta="Error del pronóstico"
              formula="F16"
              valor={precision.diasConDatos > 0 ? precision.errorAbsolutoMedio.toFixed(1) : "—"}
              detalle={precision.diasConDatos > 0 ? `raciones de diferencia promedio por curso y día (${precision.diasConDatos} registros este mes)` : "sin comedor registrado este mes"}
            />
            <TarjetaKpi
              etiqueta="Costo real por ración"
              formula="F13"
              valor={precision.diasConDatos > 0 ? formatoCOP(precision.costoPromedioPorRacion) : "—"}
              detalle={`costo de producción configurado: ${formatoCOP(costoUnitario)}`}
            />
            <TarjetaKpi etiqueta="Tasa de desperdicio" formula="F3" valor={`${tasaDesperdicio.toFixed(1)}%`} detalle={`${desperdicioTotal.toLocaleString("es-CO")} raciones sobrantes en total`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-4">
              <TarjetaKpi
                etiqueta="Eficiencia presupuestal"
                formula="F8÷F5"
                valor={`${eficienciaPresupuestal.toFixed(1)}%`}
                detalle="100% − (costo de desviación ÷ costo de producción)"
              >
                <div className="h-2 w-full rounded-full overflow-hidden mt-3" style={{ backgroundColor: "#E2E8F0" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${eficienciaPresupuestal}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #1E3A8A, #3B82F6)" }}
                  />
                </div>
                <p className="text-[11px] mt-3" style={{ color: "#94A3B8" }}>Tendencia de los últimos días hábiles</p>
                <div className="mt-2">
                  <TrendMiniChart data={datos?.tendencia ?? []} />
                </div>
              </TarjetaKpi>
              <TarjetaKpi
                etiqueta="Raciones servidas (semana)"
                formula="F15"
                valor={(datos?.racionesSemana ?? 0).toLocaleString("es-CO")}
                detalle={`costo de producción de la semana: ${formatoCOP(datos?.costoProduccionTotal ?? 0)}`}
              />
            </div>

            <Tarjeta className="md:col-span-2 flex flex-col">
              <TituloSeccion titulo="Raciones servidas por curso" ayuda="Pasa el cursor sobre cada segmento para ver el detalle." />
              <div className="flex-1 flex items-center">
                <DonutChart data={datos?.donutData ?? []} total={totalRaciones} totalLabel="Total raciones" />
              </div>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5" style={{ borderTop: "1px solid #F1F5F9" }}>
                {[
                  { label: "Servidas", value: totalRaciones.toLocaleString("es-CO"), color: "#1E3A8A" },
                  { label: "Sobrantes (F6)", value: desperdicioTotal.toLocaleString("es-CO"), color: "#F97316" },
                  { label: "Faltantes (F7)", value: estadisticas.totalRacionesFaltantes.toLocaleString("es-CO"), color: "#DC2626" },
                  { label: "Rendimiento (F17)", value: `${eficienciaEntrega.toFixed(1)}%`, color: "#10B981" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#94A3B8" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </Tarjeta>
          </div>
        </>
      )}

      {/* Catálogo: las fórmulas del documento y cómo se calculan */}
      <Tarjeta>
        <TituloSeccion
          titulo="Las 20 fórmulas del modelo"
          ayuda="Referencia rápida de los indicadores del documento Modelo Analítico PAE."
          accion={<BookOpen className="w-4 h-4" style={{ color: "#1E3A8A" }} />}
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(FORMULAS).map((f) => (
            <div key={f.codigo} className="rounded-lg px-3 py-2" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-xs font-bold" style={{ color: "#0F172A" }}>
                <span style={{ color: "#1E3A8A" }}>{f.codigo}</span> · {f.nombre}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>{f.descripcion}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: "#94A3B8" }}>
          <Target className="w-3.5 h-3.5" /> El pedido diario usa F1 con el modelo del vendedor de periódicos; F2 se muestra solo como comparación.
        </p>
      </Tarjeta>
    </motion.div>
  );
}
