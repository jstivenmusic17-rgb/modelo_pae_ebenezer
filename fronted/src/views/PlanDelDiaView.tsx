import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { Calculator, ChefHat, Package, Sigma } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { Aviso, BotonPrimario, Cargando, EncabezadoVista, Tarjeta, TituloSeccion } from "../components/Ui";
import { INPUT_CLASS, INPUT_STYLE } from "../components/FormField";
import type { Navegar } from "../components/Navegacion";
import {
  CursoApi,
  JornadaApi,
  PlanRacionApi,
  type Curso,
  type Jornada,
  type ParametrosModelo,
  type PlanRacion,
} from "../services/api";
import {
  cargarInsumosConStock,
  cargarParametros,
  cargarTurnosConCapacidad,
  mensajeDeError,
  type InsumoConStock,
  type TurnoConCapacidad,
} from "../lib/datos";
import { explicarPlanes, formatoCOP, formatoPorcentaje, hoyISO, inversaNormal } from "../lib/modelo";

interface Omitido {
  curso: string;
  motivo: string;
}

export default function PlanDelDiaView({ navegar }: { navegar: Navegar }): JSX.Element {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parametros, setParametros] = useState<ParametrosModelo | null>(null);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [idJornada, setIdJornada] = useState<number | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [fecha, setFecha] = useState(hoyISO());
  const [asistencia, setAsistencia] = useState(0.9);
  const [planesDelDia, setPlanesDelDia] = useState<PlanRacion[]>([]);
  const [omitidos, setOmitidos] = useState<Omitido[]>([]);
  const [calculando, setCalculando] = useState(false);
  const [insumos, setInsumos] = useState<InsumoConStock[]>([]);
  const [turnos, setTurnos] = useState<TurnoConCapacidad[]>([]);

  // Carga inicial: parámetros, jornadas, insumos y cocina
  useEffect(() => {
    Promise.all([cargarParametros(), JornadaApi.listar(), cargarInsumosConStock(), cargarTurnosConCapacidad()])
      .then(([p, js, ins, ts]) => {
        setParametros(p);
        setAsistencia(p.tasaAsistenciaDefecto);
        setJornadas(js);
        setIdJornada(js[0]?.idJornada ?? null);
        setInsumos(ins);
        setTurnos(ts);
      })
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }, []);

  // Cursos de la jornada elegida. Se vacían al cambiar de jornada y se ignora
  // una respuesta tardía de la jornada anterior, para no calcular cursos ajenos.
  useEffect(() => {
    if (idJornada === null) return;
    let vigente = true;
    setCursos([]);
    setOmitidos([]);
    CursoApi.listarPorJornada(idJornada)
      .then((cs) => {
        if (vigente) setCursos(cs);
      })
      .catch((e) => setError(mensajeDeError(e)));
    return () => {
      vigente = false;
    };
  }, [idJornada]);

  const recargarPlanes = useCallback(() => {
    PlanRacionApi.listarPorFecha(fecha).then(setPlanesDelDia).catch((e) => setError(mensajeDeError(e)));
  }, [fecha]);

  useEffect(recargarPlanes, [recargarPlanes]);

  const planesJornada = useMemo(() => {
    const ids = new Set(cursos.map((c) => c.idCurso));
    return planesDelDia.filter((p) => ids.has(p.idCurso));
  }, [planesDelDia, cursos]);

  const nombreCurso = (idCurso: number) => cursos.find((c) => c.idCurso === idCurso)?.nombreCurso ?? `Curso ${idCurso}`;
  const explicacion = explicarPlanes(planesJornada);
  // Plan calculado más recientemente: referencia para costos y el detalle matemático
  const planReciente = planesJornada.reduce<PlanRacion | null>((a, b) => (!a || b.idPlan > a.idPlan ? b : a), null);
  const fechaPasada = fecha < hoyISO();

  function calcular(): void {
    if (!parametros || cursos.length === 0) return;
    setCalculando(true);
    setError(null);
    Promise.allSettled(
      cursos.map((c) =>
        PlanRacionApi.calcular({
          idCurso: c.idCurso,
          fecha,
          tasaAsistenciaEstimada: asistencia,
          costoSobranteUnitario: parametros.costoSobranteUnitario,
          costoFaltanteUnitario: parametros.costoFaltanteUnitario,
          coeficienteVariacion: parametros.coeficienteVariacion,
          costoProduccionUnitario: parametros.costoProduccionUnitario,
          margenSeguridad: parametros.margenSeguridadReferencia,
        })
      )
    )
      .then((resultados) => {
        setOmitidos(
          resultados.flatMap((r, i) =>
            r.status === "rejected" ? [{ curso: cursos[i].nombreCurso, motivo: mensajeDeError(r.reason) }] : []
          )
        );
        recargarPlanes();
      })
      .finally(() => setCalculando(false));
  }

  if (cargando) return <Cargando />;

  if (jornadas.length === 0) {
    return (
      <EmptyState
        titulo="Aún no hay jornadas"
        mensaje="Para calcular el plan primero crea las jornadas (Mañana, Tarde) y sus cursos."
        accion={{ etiqueta: "Ir a Configuración", onClick: () => navegar("configuracion", "jornadas") }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <EncabezadoVista
        titulo="Plan del día"
        descripcion="Elige la fecha, la jornada y la asistencia que esperas. El sistema toma la matrícula real de cada curso y calcula cuántas raciones pedir."
      />

      {error && <Aviso tono="error">{error}</Aviso>}

      {/* Paso 1: datos de entrada */}
      <Tarjeta>
        <TituloSeccion titulo="1. ¿Para cuándo y para quién?" ayuda="La asistencia esperada viene de Configuración › Parámetros; puedes ajustarla para este día." />
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: "#475569" }}>Fecha</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: "#475569" }}>Jornada</span>
            <select
              value={idJornada ?? ""}
              onChange={(e) => setIdJornada(Number(e.target.value))}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            >
              {jornadas.map((j) => (
                <option key={j.idJornada} value={j.idJornada}>{j.nombreJornada}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold flex justify-between" style={{ color: "#475569" }}>
              Asistencia esperada <b style={{ color: "#1E3A8A" }}>{formatoPorcentaje(asistencia)}</b>
            </span>
            <input
              type="range"
              min={50}
              max={100}
              value={Math.round(asistencia * 100)}
              onChange={(e) => setAsistencia(Number(e.target.value) / 100)}
              className="w-full accent-blue-700 mt-2"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BotonPrimario onClick={calcular} disabled={calculando || fechaPasada || cursos.length === 0}>
            <Calculator className="w-4 h-4" />
            {calculando ? "Calculando..." : planesJornada.length > 0 ? "Recalcular plan de la jornada" : "Calcular plan de la jornada"}
          </BotonPrimario>
          <span className="text-xs" style={{ color: "#64748B" }}>
            {fechaPasada
              ? "Los días pasados solo se consultan; el plan se calcula desde hoy en adelante."
              : `${cursos.length} curso${cursos.length === 1 ? "" : "s"} en esta jornada. Recalcular reemplaza el plan del día.`}
          </span>
        </div>
      </Tarjeta>

      {cursos.length === 0 && (
        <EmptyState
          titulo="Esta jornada no tiene cursos"
          mensaje="Crea los cursos de la jornada y matricula a sus estudiantes para poder calcular el plan."
          accion={{ etiqueta: "Crear cursos", onClick: () => navegar("configuracion", "jornadas") }}
        />
      )}

      {omitidos.length > 0 && (
        <Aviso tono="alerta">
          <p className="font-bold">Algunos cursos no se pudieron calcular:</p>
          <ul className="mt-1 list-disc pl-4">
            {omitidos.map((o) => (
              <li key={o.curso}>{o.curso}: {o.motivo}</li>
            ))}
          </ul>
          {omitidos.some((o) => o.motivo.includes("estudiantes")) && (
            <button type="button" className="mt-1 text-xs font-bold underline" onClick={() => navegar("configuracion", "estudiantes")}>
              Matricular estudiantes
            </button>
          )}
        </Aviso>
      )}

      {cursos.length > 0 && planesJornada.length === 0 && !calculando && (
        <Aviso tono="info">Todavía no hay plan para esta jornada en la fecha elegida. Pulsa «Calcular plan de la jornada».</Aviso>
      )}

      {explicacion && parametros && planReciente && (
        <>
          {/* Paso 2: resultado explicado */}
          <Tarjeta>
            <TituloSeccion titulo="2. Cómo llegamos a este número" ayuda="Modelo del vendedor de periódicos aplicado a la matrícula real." />
            <div className="flex flex-wrap items-center gap-3 text-center">
              <Paso valor={explicacion.matricula} etiqueta="estudiantes matriculados" />
              <Flecha texto={textoAsistencia(planesJornada)} />
              <Paso valor={explicacion.esperados} etiqueta="se espera que asistan (F1)" />
              <Flecha texto={`${explicacion.extra >= 0 ? "+" : ""}${explicacion.extra}`} />
              <Paso valor={explicacion.pedido} etiqueta="raciones a pedir" destacado />
            </div>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#334155" }}>{explicacion.frase}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F8FAFC" }}>
                <p className="text-xs font-semibold" style={{ color: "#64748B" }}>Costo de producción (F5)</p>
                <p className="text-lg font-bold" style={{ color: "#0F172A" }}>{formatoCOP(explicacion.costoTotal)}</p>
              </div>
              <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#F8FAFC" }}>
                <p className="text-xs font-semibold" style={{ color: "#64748B" }}>
                  Comparación: margen fijo del {formatoPorcentaje(planReciente.margenSeguridadUsado, 1)} (F2)
                </p>
                <p className="text-lg font-bold" style={{ color: "#0F172A" }}>{explicacion.conMargen} raciones</p>
              </div>
            </div>

            <details className="mt-4 text-sm" style={{ color: "#334155" }}>
              <summary className="cursor-pointer font-semibold flex items-center gap-1.5" style={{ color: "#1E3A8A" }}>
                <Sigma className="w-4 h-4" /> Ver el detalle matemático
              </summary>
              <DetalleMatematico plan={planReciente} parametros={parametros} />
            </details>
          </Tarjeta>

          {/* Detalle por curso */}
          <Tarjeta>
            <TituloSeccion titulo="Plan por curso" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs" style={{ color: "#64748B" }}>
                    <th className="py-2 pr-4 font-semibold">Curso</th>
                    <th className="py-2 pr-4 font-semibold text-right">Matriculados</th>
                    <th className="py-2 pr-4 font-semibold text-right">Esperados</th>
                    <th className="py-2 pr-4 font-semibold text-right">A pedir</th>
                    <th className="py-2 font-semibold text-right">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {[...planesJornada]
                    .sort((a, b) => nombreCurso(a.idCurso).localeCompare(nombreCurso(b.idCurso)))
                    .map((p) => (
                      <tr key={p.idPlan} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td className="py-2 pr-4 font-semibold">{nombreCurso(p.idCurso)}</td>
                        <td className="py-2 pr-4 text-right">{p.matriculaTotalRegistrada}</td>
                        <td className="py-2 pr-4 text-right">{p.demandaBase}</td>
                        <td className="py-2 pr-4 text-right font-bold" style={{ color: "#1E3A8A" }}>{p.racionesPlanificadas}</td>
                        <td className="py-2 text-right">{formatoCOP(p.costoTotalProduccion)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>

          {/* Paso 3: consecuencias operativas */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Tarjeta>
              <TituloSeccion titulo="3. Insumos que se van a gastar" ayuda="Consumo = raciones × gramos por ración ÷ 1.000 (F10)" />
              {insumos.length === 0 ? (
                <EmptyState
                  titulo="Sin insumos registrados"
                  mensaje="Registra los insumos (arroz, pollo...) con sus gramos por ración."
                  accion={{ etiqueta: "Ir a Inventario", onClick: () => navegar("inventario") }}
                />
              ) : (
                <ul className="space-y-2">
                  {insumos.map((ins) => {
                    const consumo = (explicacion.pedido * ins.gramosPorRacion) / 1000;
                    const alcanza = ins.stockActualKg >= consumo;
                    return (
                      <li key={ins.idInsumo} className="flex items-center justify-between gap-3 text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "#F8FAFC" }}>
                        <span className="flex items-center gap-2">
                          <Package className="w-4 h-4" style={{ color: "#64748B" }} />
                          <b>{ins.nombreInsumo}</b>
                          <span style={{ color: "#64748B" }}>{consumo.toFixed(1)} kg de {ins.stockActualKg.toFixed(1)} kg</span>
                        </span>
                        <span className="text-xs font-bold" style={{ color: alcanza ? "#059669" : "#DC2626" }}>
                          {alcanza ? "Alcanza" : "No alcanza"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Tarjeta>

            <Tarjeta>
              <TituloSeccion titulo="¿La cocina da abasto?" ayuda="Capacidad = cocineros × raciones por hora × horas del turno (F19)" />
              {turnos.length === 0 ? (
                <EmptyState
                  titulo="Sin turnos de cocina"
                  mensaje="Registra el turno y el personal de cocina para saber si se alcanza a preparar el pedido."
                  accion={{ etiqueta: "Configurar cocina", onClick: () => navegar("configuracion", "cocina") }}
                />
              ) : (
                <ul className="space-y-2">
                  {turnos.map((t) => {
                    const alcanza = t.capacidad >= explicacion.pedido;
                    return (
                      <li key={t.idTurno} className="flex items-center justify-between gap-3 text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "#F8FAFC" }}>
                        <span className="flex items-center gap-2">
                          <ChefHat className="w-4 h-4" style={{ color: "#64748B" }} />
                          <b>Turno {t.nombreTurno}</b>
                          <span style={{ color: "#64748B" }}>
                            {t.cocineros} cocinero{t.cocineros === 1 ? "" : "s"} · hasta {Math.round(t.capacidad)} raciones
                          </span>
                        </span>
                        <span className="text-xs font-bold" style={{ color: alcanza ? "#059669" : "#DC2626" }}>
                          {alcanza ? "Da abasto" : "Se queda corta"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Tarjeta>
          </div>

          <Aviso tono="info">
            Al terminar el turno, registra cuántas raciones se sirvieron realmente.{" "}
            <button type="button" className="font-bold underline" onClick={() => navegar("comedor")}>
              Ir a Comedor
            </button>
          </Aviso>
        </>
      )}
    </div>
  );
}

// Si algún curso conserva un plan anterior con otra asistencia, no se muestra un
// porcentaje único que sería falso para parte de la jornada.
function textoAsistencia(planes: PlanRacion[]): string {
  const tasas = new Set(planes.map((p) => p.tasaAsistenciaEstimada));
  return tasas.size === 1 ? `× ${formatoPorcentaje(planes[0].tasaAsistenciaEstimada)}` : "× asistencia de cada curso";
}

function Paso({ valor, etiqueta, destacado = false }: { valor: number; etiqueta: string; destacado?: boolean }): JSX.Element {
  return (
    <div
      className="flex-1 min-w-[120px] rounded-xl px-4 py-3"
      style={destacado ? { background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", color: "#FFFFFF" } : { backgroundColor: "#F1F5F9", color: "#0F172A" }}
    >
      <p className="text-3xl font-bold tracking-tight">{valor.toLocaleString("es-CO")}</p>
      <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{etiqueta}</p>
    </div>
  );
}

function Flecha({ texto }: { texto: string }): JSX.Element {
  return (
    <span className="text-sm font-bold px-1" style={{ color: "#64748B" }}>
      {texto} →
    </span>
  );
}

// Fórmula completa con los números de un curso, para quien quiera verificarla
function DetalleMatematico({ plan, parametros }: { plan: PlanRacion; parametros: ParametrosModelo }): JSX.Element {
  const z = inversaNormal(plan.razonCritica);
  const sigma = plan.demandaBase * parametros.coeficienteVariacion;
  return (
    <div className="mt-3 rounded-xl p-4 font-mono text-xs leading-6" style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}>
      <p style={{ color: "#94A3B8" }}>{"// Ejemplo con un curso del plan"}</p>
      <p>D  = matrícula × asistencia = {plan.matriculaTotalRegistrada} × {plan.tasaAsistenciaEstimada} = {plan.demandaBase}</p>
      <p>RC = Cf ÷ (Cf + Cs) = {plan.costoFaltanteUnitario} ÷ ({plan.costoFaltanteUnitario} + {plan.costoSobranteUnitario}) = {plan.razonCritica.toFixed(3)}</p>
      <p>z  = Φ⁻¹(RC) = {z.toFixed(3)}   (cuántas desviaciones por encima de la demanda)</p>
      <p>σ  = D × variabilidad = {plan.demandaBase} × {parametros.coeficienteVariacion} = {sigma.toFixed(1)}</p>
      <p>Q  = D + z·σ = {plan.demandaBase} + {z.toFixed(3)} × {sigma.toFixed(1)} ≈ <b style={{ color: "#93C5FD" }}>{plan.racionesPlanificadas}</b></p>
    </div>
  );
}
