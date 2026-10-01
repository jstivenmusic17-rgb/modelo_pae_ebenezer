import { useEffect, useState, type JSX } from "react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Aviso, Cargando, EncabezadoVista, Indicador, Tarjeta, TituloSeccion } from "../components/Ui";
import type { Navegar, PestanaConfig, Vista } from "../components/Navegacion";
import {
  CursoApi,
  EntregaRacionApi,
  EstudianteApi,
  JornadaApi,
  PlanRacionApi,
  type Curso,
  type EntregaRacion,
  type PlanRacion,
} from "../services/api";
import { cargarInsumosConStock, cargarTurnosConCapacidad, mensajeDeError, type InsumoConStock, type TurnoConCapacidad } from "../lib/datos";
import { fechaISO, formatoCOP, hoyISO } from "../lib/modelo";

interface PlanConEntrega {
  plan: PlanRacion;
  entrega: EntregaRacion | null;
}

interface DiaGrafico {
  dia: string;
  Pedidas: number;
  Servidas: number;
}

interface Resumen {
  hayJornadas: boolean;
  cursos: Curso[];
  estudiantes: number;
  insumos: InsumoConStock[];
  turnos: TurnoConCapacidad[];
  hoy: PlanConEntrega[];
  semana: DiaGrafico[];
}

function planesConEntrega(fecha: string): Promise<PlanConEntrega[]> {
  return PlanRacionApi.listarPorFecha(fecha).then((planes) =>
    Promise.all(planes.map((plan) => EntregaRacionApi.consultarPorPlan(plan.idPlan).then((entrega) => ({ plan, entrega }))))
  );
}

// Últimos 14 días con plan y comedor registrado (máximo 7 barras)
function cargarSemana(): Promise<DiaGrafico[]> {
  const fechas = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  return Promise.all(fechas.map((d) => planesConEntrega(fechaISO(d)).then((pe) => ({ d, pe })))).then((dias) =>
    dias
      .filter(({ pe }) => pe.some((x) => x.entrega))
      .slice(-7)
      .map(({ d, pe }) => ({
        dia: d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric" }),
        // Solo cursos con comedor registrado, para comparar lo mismo con lo mismo
        Pedidas: pe.reduce((s, x) => s + (x.entrega ? x.plan.racionesPlanificadas : 0), 0),
        Servidas: pe.reduce((s, x) => s + (x.entrega?.racionesServidas ?? 0), 0),
      }))
  );
}

export default function InicioView({ navegar }: { navegar: Navegar }): JSX.Element {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([JornadaApi.listar(), CursoApi.listar(), cargarInsumosConStock(), cargarTurnosConCapacidad(), planesConEntrega(hoyISO()), cargarSemana()])
      .then(([jornadas, cursos, insumos, turnos, hoy, semana]) =>
        Promise.all(cursos.map((c) => EstudianteApi.listarPorCurso(c.idCurso).then((es) => es.length))).then((conteos) =>
          setResumen({
            hayJornadas: jornadas.length > 0,
            cursos,
            estudiantes: conteos.reduce((s, n) => s + n, 0),
            insumos,
            turnos,
            hoy,
            semana,
          })
        )
      )
      .catch((e) => setError(mensajeDeError(e)));
  }, []);

  if (error) return <Aviso tono="error">{error}</Aviso>;
  if (!resumen) return <Cargando texto="Preparando el resumen del día..." />;

  const { hoy } = resumen;
  const registrados = hoy.filter((x) => x.entrega);
  const pedidoHoy = hoy.reduce((s, x) => s + x.plan.racionesPlanificadas, 0);
  const servidas = registrados.reduce((s, x) => s + (x.entrega?.racionesServidas ?? 0), 0);
  const preparadas = registrados.reduce((s, x) => s + x.plan.racionesPlanificadas, 0);
  const sobrantes = registrados.reduce((s, x) => s + (x.entrega?.racionesSobrantes ?? 0), 0);
  const matricula = registrados.reduce((s, x) => s + x.plan.matriculaTotalRegistrada, 0);
  const desviacion = registrados.reduce((s, x) => s + (x.entrega?.costoTotalDesviacion ?? 0), 0);
  const capacidadMax = Math.max(0, ...resumen.turnos.map((t) => t.capacidad));

  const pasos: { hecho: boolean; texto: string; vista: Vista; pestana?: PestanaConfig }[] = [
    { hecho: resumen.hayJornadas, texto: "Crear las jornadas (Mañana, Tarde)", vista: "configuracion", pestana: "jornadas" },
    { hecho: resumen.cursos.length > 0, texto: "Crear los cursos de cada jornada", vista: "configuracion", pestana: "jornadas" },
    { hecho: resumen.estudiantes > 0, texto: "Matricular a los estudiantes", vista: "configuracion", pestana: "estudiantes" },
    { hecho: resumen.insumos.length > 0, texto: "Registrar los insumos (arroz, pollo...)", vista: "inventario" },
    { hecho: resumen.turnos.some((t) => t.cocineros > 0), texto: "Registrar el turno y el personal de cocina", vista: "configuracion", pestana: "cocina" },
    { hecho: hoy.length > 0, texto: "Calcular el plan de hoy", vista: "plan" },
    { hecho: registrados.length > 0, texto: "Registrar lo servido en el comedor", vista: "comedor" },
  ];
  const configuracionCompleta = pasos.slice(0, 5).every((p) => p.hecho);

  const alertas: { texto: string; vista: Vista }[] = [
    ...resumen.insumos
      .filter((i) => i.puntoReordenKg !== null && i.stockActualKg <= i.puntoReordenKg)
      .map((i) => ({
        texto: `Hay que pedir ${i.nombreInsumo}: quedan ${i.stockActualKg.toFixed(1)} kg y el punto de reorden es ${i.puntoReordenKg?.toFixed(1)} kg (F12).`,
        vista: "inventario" as Vista,
      })),
    ...(hoy.length > registrados.length
      ? [{ texto: `${hoy.length - registrados.length} curso(s) con plan de hoy aún no tienen el comedor registrado.`, vista: "comedor" as Vista }]
      : []),
    ...(capacidadMax > 0 && pedidoHoy > capacidadMax
      ? [{ texto: `El pedido de hoy (${pedidoHoy}) supera la capacidad de la cocina (${Math.round(capacidadMax)} raciones, F19).`, vista: "plan" as Vista }]
      : []),
  ];

  const sinRegistro = "sin registro de comedor aún";

  return (
    <div className="space-y-6">
      <EncabezadoVista
        titulo="Resumen del día"
        descripcion="Cómo va el Programa de Alimentación Escolar hoy. El ciclo diario es: calcular el plan → registrar el comedor → revisar indicadores."
      />

      {!pasos.every((p) => p.hecho) && (
        <Tarjeta>
          <TituloSeccion
            titulo={configuracionCompleta ? "Pendiente para hoy" : "Primeros pasos"}
            ayuda={configuracionCompleta ? "La configuración está lista; faltan las tareas del día." : "Completa estos pasos en orden para que el sistema pueda calcular."}
          />
          <ol className="grid gap-2 md:grid-cols-2">
            {pasos.map((p, i) => (
              <li key={p.texto}>
                <button
                  type="button"
                  onClick={() => navegar(p.vista, p.pestana)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
                  style={{ border: "1px solid #E2E8F0" }}
                >
                  {p.hecho ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} /> : <Circle className="w-5 h-5 flex-shrink-0" style={{ color: "#CBD5E1" }} />}
                  <span className="flex-1" style={{ color: p.hecho ? "#94A3B8" : "#0F172A", textDecoration: p.hecho ? "line-through" : "none" }}>
                    {i + 1}. {p.texto}
                  </span>
                  {!p.hecho && <ArrowRight className="w-4 h-4" style={{ color: "#3B82F6" }} />}
                </button>
              </li>
            ))}
          </ol>
        </Tarjeta>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador etiqueta="Pedido de hoy" valor={hoy.length ? pedidoHoy.toLocaleString("es-CO") : "—"} detalle={hoy.length ? `${hoy.length} cursos planificados` : "aún no se calcula el plan"} />
        <Indicador etiqueta="Cobertura" formula="F9" valor={matricula ? `${((servidas / matricula) * 100).toFixed(1)}%` : "—"} detalle={matricula ? `${servidas} de ${matricula} matriculados comieron` : sinRegistro} color="#059669" />
        <Indicador etiqueta="Desperdicio" formula="F3" valor={preparadas ? `${((sobrantes / preparadas) * 100).toFixed(1)}%` : "—"} detalle={preparadas ? `${sobrantes} raciones sobrantes` : sinRegistro} color="#EA580C" />
        <Indicador etiqueta="Costo de desviación" formula="F8" valor={registrados.length ? formatoCOP(desviacion) : "—"} detalle={registrados.length ? "por sobrantes y faltantes" : sinRegistro} color="#B91C1C" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <TituloSeccion titulo="Pedidas vs. servidas" ayuda="Últimos días con comedor registrado. Mientras más se parezcan las barras, mejor el pronóstico." />
          {resumen.semana.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: "#94A3B8" }}>Aún no hay días con comedor registrado.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumen.semana} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#F1F5F9" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Pedidas" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Servidas" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Tarjeta>

        <Tarjeta>
          <TituloSeccion titulo="Alertas" />
          {alertas.length === 0 ? (
            <Aviso tono="exito">Sin alertas por ahora.</Aviso>
          ) : (
            <ul className="space-y-2">
              {alertas.map((a) => (
                <li key={a.texto}>
                  <button type="button" onClick={() => navegar(a.vista)} className="w-full text-left">
                    <Aviso tono="alerta">{a.texto}</Aviso>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
