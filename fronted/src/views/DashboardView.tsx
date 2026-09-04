import { type CSSProperties, type FormEvent, type JSX, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  type LucideIcon,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Package,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { blurInput, FormField, focusInput, INPUT_CLASS, INPUT_STYLE, SubmitButton } from "../components/FormField.tsx";
import Modal from "../components/Modal.tsx";
import {
  ApiError,
  CursoApi,
  EntregaRacionApi,
  PlanRacionApi,
  planesVigentes,
  type Curso,
  type EntregaRacion,
  type PlanRacion,
} from "../services/api.ts";
import { cn } from "../utils.ts";

const COSTO_RACION_DEFECTO = 4350;
const MARGEN_SEGURIDAD_DEFECTO = 0.007;

interface DiaResumen {
  day: string;
  fecha: string;
  entregadas: number;
  esperadas: number;
  sobrantes: number;
  pedidoRecomendado: number;
}

interface FilaCurso {
  idCurso: number;
  idPlan: number | null;
  grade: string;
  students: number | null;
  delivered: number;
  status: "Completado" | "Pendiente";
}

interface DashboardResumen {
  cursos: Curso[];
  diasResumen: DiaResumen[];
  filasCursos: FilaCurso[];
}

type BadgeType = "success" | "warning" | "info";

interface KpiCardData {
  label: string;
  value: string;
  badge: string;
  badgeType: BadgeType;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  sparkData: number[];
  sparkColor: string;
}

const DIA_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CARD_BASE = "bg-white rounded-2xl p-5 transition-all duration-300 hover:shadow-md";
const CARD_BORDER: CSSProperties = { border: "1px solid #E2E8F0" };

function ultimosDiasHabiles(cantidad: number): string[] {
  const fechas: string[] = [];
  const cursor = new Date();
  while (fechas.length < cantidad) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      fechas.unshift(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return fechas;
}

// ----------------------------------------------------------------------------
// Carga de datos — orquestada como una sola cadena de promesas (sin
// try/catch): cursos → planes vigentes por curso → entregas de esos planes.
// ----------------------------------------------------------------------------
function construirResumenDiario(
  fechas: string[],
  todosLosPlanes: PlanRacion[],
  entregasPorPlan: Map<number, EntregaRacion | null>
): DiaResumen[] {
  return fechas.map(function resumenDelDia(fecha: string): DiaResumen {
    const planesDelDia = todosLosPlanes.filter((p) => p.fecha === fecha);
    const esperadas = planesDelDia.reduce((s, p) => s + p.racionesPlanificadas, 0);
    const pedidoRecomendado = planesDelDia.reduce((s, p) => s + p.racionesSugeridasMargen, 0);
    const entregasDelDia = planesDelDia.map((p) => entregasPorPlan.get(p.idPlan) ?? null);
    const entregadas = entregasDelDia.reduce((s, e) => s + (e?.racionesServidas ?? 0), 0);
    const sobrantes = entregasDelDia.reduce((s, e) => s + (e?.racionesSobrantes ?? 0), 0);
    const dow = new Date(`${fecha}T00:00:00`).getDay();
    return { day: DIA_LABEL[dow], fecha, entregadas, esperadas, sobrantes, pedidoRecomendado };
  });
}

function construirFilasCursos(
  cursos: Curso[],
  planesPorCurso: PlanRacion[][],
  entregasPorPlan: Map<number, EntregaRacion | null>,
  hoyISO: string
): FilaCurso[] {
  return cursos.map(function filaDelCurso(curso: Curso, idx: number): FilaCurso {
    const planHoy = planesPorCurso[idx].find((p) => p.fecha === hoyISO) ?? null;
    const entregaHoy = planHoy ? entregasPorPlan.get(planHoy.idPlan) ?? null : null;
    const delivered = entregaHoy?.racionesServidas ?? 0;
    return {
      idCurso: curso.idCurso,
      idPlan: planHoy ? planHoy.idPlan : null,
      grade: curso.nombreCurso,
      students: planHoy ? planHoy.matriculaTotalRegistrada : null,
      delivered,
      status: entregaHoy && delivered > 0 ? "Completado" : "Pendiente",
    };
  });
}

function cargarEntregasDePlanes(planes: PlanRacion[]): Promise<Map<number, EntregaRacion | null>> {
  const idsUnicos = Array.from(new Set(planes.map((p) => p.idPlan)));
  return Promise.all(
    idsUnicos.map((idPlan) =>
      EntregaRacionApi.consultarPorPlan(idPlan).then((entrega) => [idPlan, entrega] as const)
    )
  ).then((pares) => new Map(pares));
}

function cargarResumenDashboard(): Promise<DashboardResumen> {
  const fechas = ultimosDiasHabiles(5);
  const hoyISO = new Date().toISOString().slice(0, 10);

  return CursoApi.listar().then(function conCursos(cursos: Curso[]): Promise<DashboardResumen> {
    const planesPorCursoPromesa = Promise.all(
      cursos.map((c) => PlanRacionApi.listarPorCurso(c.idCurso).catch((): PlanRacion[] => []))
    );

    return planesPorCursoPromesa.then(function conPlanes(planesPorCursoBruto: PlanRacion[][]): Promise<DashboardResumen> {
      // Si un curso recalculó su plan varias veces el mismo día, solo el
      // más reciente cuenta (evita duplicar demanda/entregas en el resumen).
      const planesPorCurso = planesPorCursoBruto.map(planesVigentes);
      const todosLosPlanes = planesPorCurso.flat();
      const planesEnRango = todosLosPlanes.filter((p) => fechas.includes(p.fecha));

      return cargarEntregasDePlanes(planesEnRango).then(function conEntregas(
        entregasPorPlan: Map<number, EntregaRacion | null>
      ): DashboardResumen {
        return {
          cursos,
          diasResumen: construirResumenDiario(fechas, todosLosPlanes, entregasPorPlan),
          filasCursos: construirFilasCursos(cursos, planesPorCurso, entregasPorPlan, hoyISO),
        };
      });
    });
  });
}

function badgeStyle(type: BadgeType): CSSProperties {
  switch (type) {
    case "success":
      return { backgroundColor: "#ECFDF5", color: "#059669" };
    case "warning":
      return { backgroundColor: "#FFF7ED", color: "#EA580C" };
    default:
      return { backgroundColor: "#EFF6FF", color: "#2563EB" };
  }
}

interface SparklineProps {
  data: number[];
  color: string;
}

function Sparkline({ data, color }: SparklineProps): JSX.Element | null {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface WeeklyBarChartProps {
  data: DiaResumen[];
}

function WeeklyBarChart({ data }: WeeklyBarChartProps): JSX.Element {
  const [hovered, setHovered] = useState<number | null>(null);
  const chartH = 200;
  const chartW = 480;
  const barW = 36;
  const gap = (chartW - barW * data.length) / (data.length + 1);
  const maxVal = Math.max(50, ...data.map((d) => Math.max(d.entregadas, d.esperadas))) * 1.1;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW} ${chartH + 40}`}
        width="100%"
        className="select-none"
        style={{ minWidth: 320 }}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = chartH - t * chartH;
          const val = Math.round(t * maxVal);
          return (
            <g key={t}>
              <line x1={40} y1={y} x2={chartW} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={34} y={y + 4} textAnchor="end" fontSize={10} fill="#94A3B8" fontFamily="Plus Jakarta Sans, sans-serif">
                {val}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = gap + i * (barW + gap) + gap / 2 + 20;
          const barH = (d.entregadas / maxVal) * chartH;
          const isHov = hovered === i;

          return (
            <g key={d.fecha}>
              <rect
                x={x}
                y={chartH - (d.esperadas / maxVal) * chartH}
                width={barW}
                height={(d.esperadas / maxVal) * chartH}
                rx={4}
                fill="#E2E8F0"
              />
              <rect
                x={x}
                y={chartH - barH}
                width={barW}
                height={barH}
                rx={4}
                fill={isHov ? "url(#barGradHover)" : "url(#barGrad)"}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={x + barW / 2}
                y={chartH + 18}
                textAnchor="middle"
                fontSize={11}
                fill="#64748B"
                fontWeight="600"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {d.day}
              </text>
              {isHov && (
                <g>
                  <rect
                    x={x + barW / 2 - 42}
                    y={chartH - barH - 44}
                    width={84}
                    height={36}
                    rx={6}
                    fill="white"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    filter="drop-shadow(0 4px 12px rgba(0,0,0,0.1))"
                  />
                  <text
                    x={x + barW / 2}
                    y={chartH - barH - 27}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#64748B"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    Entregadas
                  </text>
                  <text
                    x={x + barW / 2}
                    y={chartH - barH - 14}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="700"
                    fill="#0F172A"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {d.entregadas} / {d.esperadas}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function DashboardView(): JSX.Element {
  const [matricula, setMatricula] = useState(500);
  const [asistencia, setAsistencia] = useState(90);

  const raciones = Math.round(matricula * (asistencia / 100) * 1.007);
  const costo = (raciones * 4350).toLocaleString("es-CO");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [diasResumen, setDiasResumen] = useState<DiaResumen[]>([]);
  const [filasCursos, setFilasCursos] = useState<FilaCurso[]>([]);

  const [generandoPedido, setGenerandoPedido] = useState(false);
  const [pedidoGenerado, setPedidoGenerado] = useState<PlanRacion | null>(null);
  const [errorPedido, setErrorPedido] = useState<string | null>(null);

  const [filaParaEntrega, setFilaParaEntrega] = useState<FilaCurso | null>(null);
  const [registrandoEntrega, setRegistrandoEntrega] = useState(false);
  const [errorEntrega, setErrorEntrega] = useState<string | null>(null);

  function aplicarResumen(resumen: DashboardResumen): void {
    setCursos(resumen.cursos);
    setDiasResumen(resumen.diasResumen);
    setFilasCursos(resumen.filasCursos);
  }

  useEffect(function cargarAlMontar() {
    setCargando(true);
    setError(null);
    cargarResumenDashboard()
      .then(aplicarResumen)
      .catch(function manejarError(err: unknown): void {
        setError(err instanceof ApiError ? err.message : "No fue posible cargar los datos del dashboard.");
      })
      .finally(function detenerCarga(): void {
        setCargando(false);
      });
  }, []);

  // El curso objetivo es el primero registrado: el Dashboard no tiene
  // selector propio de curso (a diferencia de Planificación), así que este
  // botón demuestra el modelo de optimización (vendedor de periódicos)
  // sobre el primer curso disponible, usando la asistencia del slider.
  function handleGenerarPedido(): void {
    const cursoObjetivo = cursos[0];
    if (!cursoObjetivo) {
      setErrorPedido("No hay cursos registrados para generar un pedido.");
      return;
    }

    setGenerandoPedido(true);
    setErrorPedido(null);
    PlanRacionApi.calcular({
      idCurso: cursoObjetivo.idCurso,
      fecha: new Date().toISOString().slice(0, 10),
      tasaAsistenciaEstimada: asistencia / 100,
      costoSobranteUnitario: Math.round(COSTO_RACION_DEFECTO * 0.3),
      costoFaltanteUnitario: COSTO_RACION_DEFECTO,
      costoProduccionUnitario: COSTO_RACION_DEFECTO,
      margenSeguridad: MARGEN_SEGURIDAD_DEFECTO,
    })
      .then(function aplicarPedido(plan: PlanRacion): Promise<void> {
        setPedidoGenerado(plan);
        return cargarResumenDashboard().then(aplicarResumen);
      })
      .catch(function manejarErrorDePedido(err: unknown): void {
        setErrorPedido(err instanceof ApiError ? err.message : "No fue posible generar el pedido óptimo.");
      })
      .finally(function detenerGeneracion(): void {
        setGenerandoPedido(false);
      });
  }

  function abrirRegistrarEntrega(fila: FilaCurso): void {
    setErrorEntrega(null);
    setFilaParaEntrega(fila);
  }

  function handleSubmitEntrega(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!filaParaEntrega || filaParaEntrega.idPlan === null) return;

    const formData = new FormData(e.currentTarget);
    const racionesServidas = Number(formData.get("racionesServidas"));
    if (!Number.isFinite(racionesServidas) || racionesServidas < 0) {
      setErrorEntrega("Ingresa una cantidad de raciones servidas válida.");
      return;
    }

    setRegistrandoEntrega(true);
    setErrorEntrega(null);
    EntregaRacionApi.registrar({ idPlan: filaParaEntrega.idPlan, racionesServidas })
      .then(function alRegistrar(): Promise<void> {
        setFilaParaEntrega(null);
        return cargarResumenDashboard().then(aplicarResumen);
      })
      .catch(function manejarErrorDeEntrega(err: unknown): void {
        setErrorEntrega(err instanceof ApiError ? err.message : "No fue posible registrar la entrega.");
      })
      .finally(function detenerRegistroDeEntrega(): void {
        setRegistrandoEntrega(false);
      });
  }

  const hoy = diasResumen[diasResumen.length - 1] ?? null;
  const ayer = diasResumen[diasResumen.length - 2] ?? null;

  const coberturaHoy = hoy && hoy.esperadas > 0 ? (hoy.entregadas / hoy.esperadas) * 100 : 0;
  const coberturaAyer = ayer && ayer.esperadas > 0 ? (ayer.entregadas / ayer.esperadas) * 100 : coberturaHoy;
  const desperdicioHoy = hoy && hoy.esperadas > 0 ? (hoy.sobrantes / hoy.esperadas) * 100 : 0;

  const kpiData = useMemo(function calcularKpiData(): KpiCardData[] {
    const coberturaSpark = diasResumen.map((d) => (d.esperadas > 0 ? (d.entregadas / d.esperadas) * 100 : 0));
    const demandaSpark = diasResumen.map((d) => d.esperadas);
    const desperdicioSpark = diasResumen.map((d) => (d.esperadas > 0 ? (d.sobrantes / d.esperadas) * 100 : 0));
    const pedidoSpark = diasResumen.map((d) => d.pedidoRecomendado);
    const sparkMinimo = [0, 0];

    return [
      {
        label: "COBERTURA PAE",
        value: `${Math.round(coberturaHoy)}%`,
        badge: `${coberturaHoy >= coberturaAyer ? "+" : ""}${(coberturaHoy - coberturaAyer).toFixed(1)}% vs día anterior`,
        badgeType: coberturaHoy >= coberturaAyer ? "success" : "warning",
        icon: ShieldCheck,
        iconColor: "#10B981",
        iconBg: "#ECFDF5",
        sparkData: coberturaSpark.length > 1 ? coberturaSpark : sparkMinimo,
        sparkColor: "#10B981",
      },
      {
        label: "DEMANDA ESTIMADA HOY",
        value: `${hoy?.esperadas ?? 0}`,
        badge: "raciones",
        badgeType: "info",
        icon: Users,
        iconColor: "#3B82F6",
        iconBg: "#EFF6FF",
        sparkData: demandaSpark.length > 1 ? demandaSpark : sparkMinimo,
        sparkColor: "#3B82F6",
      },
      {
        label: "TASA DE DESPERDICIO",
        value: `${desperdicioHoy.toFixed(1)}%`,
        badge: desperdicioHoy <= 5 ? "Bajo Control" : "Requiere Atención",
        badgeType: desperdicioHoy <= 5 ? "success" : "warning",
        icon: TrendingDown,
        iconColor: desperdicioHoy <= 5 ? "#10B981" : "#F97316",
        iconBg: desperdicioHoy <= 5 ? "#ECFDF5" : "#FFF7ED",
        sparkData: desperdicioSpark.length > 1 ? desperdicioSpark : sparkMinimo,
        sparkColor: desperdicioHoy <= 5 ? "#10B981" : "#F97316",
      },
      {
        label: "PEDIDO RECOMENDADO",
        value: `${hoy?.pedidoRecomendado ?? 0}`,
        badge: "raciones sugeridas",
        badgeType: "warning",
        icon: Package,
        iconColor: "#F97316",
        iconBg: "#FFF7ED",
        sparkData: pedidoSpark.length > 1 ? pedidoSpark : sparkMinimo,
        sparkColor: "#F97316",
      },
    ];
  }, [diasResumen, coberturaHoy, coberturaAyer, desperdicioHoy, hoy]);

  const cursoDelPedido = pedidoGenerado ? cursos.find((c) => c.idCurso === pedidoGenerado.idCurso) : null;

  return (
    <div className="flex flex-col gap-6">
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
          Cargando indicadores del PAE...
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={CARD_BASE}
                  style={CARD_BORDER}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "#94A3B8" }}>
                      {kpi.label}
                    </p>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: kpi.iconBg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: kpi.iconColor }} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-bold tracking-tight leading-none" style={{ color: "#0F172A" }}>
                        {kpi.value}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={badgeStyle(kpi.badgeType)}
                      >
                        {kpi.badgeType === "success" && (
                          <span className="relative flex w-1.5 h-1.5">
                            <span
                              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                              style={{ backgroundColor: "#10B981" }}
                            />
                            <span
                              className="relative inline-flex rounded-full w-1.5 h-1.5"
                              style={{ backgroundColor: "#10B981" }}
                            />
                          </span>
                        )}
                        {kpi.badge}
                      </span>
                    </div>
                    <Sparkline data={kpi.sparkData} color={kpi.sparkColor} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bento: 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Motor Analítico — col span 1 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(CARD_BASE, "col-span-1 flex flex-col gap-5")}
              style={CARD_BORDER}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                  <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>
                    Motor Analítico
                  </h3>
                </div>
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  Proyección interactiva de demanda PAE
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold" style={{ color: "#475569" }}>
                      Asistencia Esperada
                    </label>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}>
                      {asistencia}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={asistencia}
                    onChange={(e) => setAsistencia(Number(e.target.value))}
                    className="w-full"
                    style={{
                      background: `linear-gradient(to right, #1E3A8A ${(asistencia - 50) * 2}%, #E2E8F0 ${(asistencia - 50) * 2}%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px]" style={{ color: "#CBD5E1" }}>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold" style={{ color: "#475569" }}>
                      Matrícula Total (E)
                    </label>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}>
                      {matricula}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="800"
                    step="10"
                    value={matricula}
                    onChange={(e) => setMatricula(Number(e.target.value))}
                    className="w-full"
                    style={{
                      background: `linear-gradient(to right, #1E3A8A ${((matricula - 300) / 500) * 100}%, #E2E8F0 ${((matricula - 300) / 500) * 100}%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px]" style={{ color: "#CBD5E1" }}>
                    <span>300</span>
                    <span>800</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7" }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#059669" }}>
                    Raciones Sugeridas
                  </p>
                  <p className="text-4xl font-bold tracking-tight mt-1" style={{ color: "#065F46" }}>
                    {raciones}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#10B981" }}>
                    Incluye margen de seguridad +0.7%
                  </p>
                </div>
                <div className="rounded-lg px-3 py-2 flex justify-between items-center" style={{ backgroundColor: "rgba(255,255,255,0.7)" }}>
                  <span className="text-xs font-medium" style={{ color: "#475569" }}>Costo estimado</span>
                  <span className="text-sm font-bold" style={{ color: "#065F46" }}>$ {costo}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGenerarPedido}
                  disabled={generandoPedido}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-95 disabled:cursor-wait"
                  style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", boxShadow: "0 4px 14px rgba(30,58,138,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(30,58,138,0.45)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(30,58,138,0.3)")}
                >
                  {generandoPedido ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Calculando...
                    </span>
                  ) : (
                    "Generar Pedido Óptimo"
                  )}
                </button>
                <p className="text-[10px] text-center" style={{ color: "#CBD5E1" }}>
                  Calcula y guarda el plan real (modelo vendedor de periódicos) para el primer curso registrado
                </p>

                {errorPedido && (
                  <div
                    className="px-3 py-2 rounded-lg text-[11px] font-semibold"
                    style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
                  >
                    {errorPedido}
                  </div>
                )}

                {pedidoGenerado && (
                  <div
                    className="rounded-lg px-3 py-2.5 flex flex-col gap-1"
                    style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#1E3A8A" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Plan #{pedidoGenerado.idPlan} guardado
                      {cursoDelPedido ? ` — ${cursoDelPedido.nombreCurso}` : ""}
                    </span>
                    <span className="text-[11px]" style={{ color: "#475569" }}>
                      {pedidoGenerado.racionesPlanificadas} raciones óptimas · razón crítica{" "}
                      {(pedidoGenerado.razonCritica * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Chart + Table — col span 2 */}
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={CARD_BASE}
                style={CARD_BORDER}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>Desempeño Semanal</h3>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>Raciones entregadas vs. esperadas</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#1E3A8A" }} />
                      <span className="text-[11px] font-medium" style={{ color: "#64748B" }}>Entregadas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#E2E8F0" }} />
                      <span className="text-[11px] font-medium" style={{ color: "#64748B" }}>Esperadas</span>
                    </div>
                  </div>
                </div>
                <WeeklyBarChart data={diasResumen} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className={CARD_BASE}
                style={{ ...CARD_BORDER, padding: 0, overflow: "hidden" }}
              >
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>Control de Entregas por Curso</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Estado de distribución — Hoy</p>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC" }}>
                      {["Curso", "Matrícula", "Entregadas", "Estado", "Acción"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: "#94A3B8", borderBottom: "1px solid #E2E8F0" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasCursos.map((c, i) => (
                      <tr
                        key={c.idCurso}
                        className="transition-colors duration-150"
                        style={{ borderBottom: i < filasCursos.length - 1 ? "1px solid #F1F5F9" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="px-5 py-3 font-semibold text-xs" style={{ color: "#0F172A" }}>
                          {c.grade}
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#64748B" }}>
                          {c.students ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-xs font-medium" style={{ color: "#0F172A" }}>
                          {c.delivered}
                        </td>
                        <td className="px-5 py-3">
                          {c.status === "Completado" ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10B981" }} />
                              Completado
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: "#FFF7ED", color: "#EA580C" }}
                            >
                              <span className="relative flex w-1.5 h-1.5">
                                <span
                                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                  style={{ backgroundColor: "#F97316" }}
                                />
                                <span
                                  className="relative inline-flex rounded-full w-1.5 h-1.5"
                                  style={{ backgroundColor: "#F97316" }}
                                />
                              </span>
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {c.idPlan === null ? (
                            <span className="text-[10px]" style={{ color: "#CBD5E1" }}>Sin plan</span>
                          ) : (
                            <button
                              onClick={() => abrirRegistrarEntrega(c)}
                              className="flex items-center gap-1 text-[10px] font-bold"
                              style={{ color: "#1E3A8A" }}
                            >
                              <ClipboardCheck className="w-3 h-3" />
                              {c.status === "Completado" ? "Editar" : "Registrar"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filasCursos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                          No hay cursos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            </div>
          </div>
        </>
      )}

      {filaParaEntrega && (
        <Modal
          title={`Registrar Entrega — ${filaParaEntrega.grade}`}
          description={
            filaParaEntrega.students !== null
              ? `Matrícula del plan: ${filaParaEntrega.students} estudiantes.`
              : undefined
          }
          onClose={() => setFilaParaEntrega(null)}
        >
          <form onSubmit={handleSubmitEntrega} className="flex flex-col gap-4">
            <FormField label="Raciones servidas">
              <input
                name="racionesServidas"
                type="number"
                min="0"
                step="1"
                required
                autoFocus
                defaultValue={filaParaEntrega.delivered || filaParaEntrega.students || 0}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorEntrega && (
              <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorEntrega}</p>
            )}
            <SubmitButton submitting={registrandoEntrega} submittingLabel="Registrando..." label="Registrar Entrega" />
          </form>
        </Modal>
      )}
    </div>
  );
}
