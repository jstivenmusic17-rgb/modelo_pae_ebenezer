import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { Aviso, BotonPrimario, Cargando, EncabezadoVista, Tarjeta } from "../components/Ui";
import { INPUT_CLASS, INPUT_STYLE } from "../components/FormField";
import type { Navegar } from "../components/Navegacion";
import {
  CursoApi,
  EntregaRacionApi,
  JornadaApi,
  PlanRacionApi,
  type Curso,
  type EntregaRacion,
  type Jornada,
  type PlanRacion,
} from "../services/api";
import { mensajeDeError } from "../lib/datos";
import { formatoCOP, hoyISO } from "../lib/modelo";

interface FilaComedor {
  plan: PlanRacion;
  curso: Curso;
  entrega: EntregaRacion | null;
}

export default function ComedorView({ navegar }: { navegar: Navegar }): JSX.Element {
  const [fecha, setFecha] = useState(hoyISO());
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [idJornada, setIdJornada] = useState<number | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filas, setFilas] = useState<FilaComedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [baseCargada, setBaseCargada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([JornadaApi.listar(), CursoApi.listar()])
      .then(([js, cs]) => {
        setJornadas(js);
        setCursos(cs);
        setIdJornada(js[0]?.idJornada ?? null);
        setBaseCargada(true);
      })
      .catch((e) => {
        setError(mensajeDeError(e));
        setCargando(false);
      });
  }, []);

  const cargarFilas = useCallback(() => {
    // Hasta tener jornadas y cursos no se decide si hay o no datos
    if (!baseCargada) return;
    if (cursos.length === 0) {
      setCargando(false);
      return;
    }
    setCargando(true);
    PlanRacionApi.listarPorFecha(fecha)
      .then((planes) =>
        Promise.all(
          planes.map((plan) =>
            EntregaRacionApi.consultarPorPlan(plan.idPlan).then((entrega) => ({
              plan,
              entrega,
              curso: cursos.find((c) => c.idCurso === plan.idCurso),
            }))
          )
        )
      )
      .then((res) => setFilas(res.filter((f): f is FilaComedor => f.curso !== undefined)))
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }, [fecha, cursos, baseCargada]);

  useEffect(cargarFilas, [cargarFilas]);

  const filasJornada = useMemo(
    () =>
      filas
        .filter((f) => f.curso.idJornada === idJornada)
        .sort((a, b) => a.curso.nombreCurso.localeCompare(b.curso.nombreCurso)),
    [filas, idJornada]
  );
  const pendientes = filasJornada.filter((f) => !f.entrega).length;

  return (
    <div className="space-y-6">
      <EncabezadoVista
        titulo="Registro en comedor"
        descripcion="Al terminar cada turno, anota cuántas raciones se sirvieron en cada curso. Con eso el sistema calcula sobrantes, faltantes y el costo de la desviación."
      >
        <div className="flex gap-3">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
          <select value={idJornada ?? ""} onChange={(e) => setIdJornada(Number(e.target.value))} className={INPUT_CLASS} style={INPUT_STYLE}>
            {jornadas.map((j) => (
              <option key={j.idJornada} value={j.idJornada}>{j.nombreJornada}</option>
            ))}
          </select>
        </div>
      </EncabezadoVista>

      {error && <Aviso tono="error">{error}</Aviso>}

      {cargando ? (
        <Cargando />
      ) : cursos.length === 0 ? (
        <EmptyState
          titulo="Aún no hay cursos"
          mensaje="Para registrar el comedor primero crea las jornadas y los cursos, y calcula el plan del día."
          accion={{ etiqueta: "Ir a Configuración", onClick: () => navegar("configuracion", "jornadas") }}
        />
      ) : filasJornada.length === 0 ? (
        <EmptyState
          titulo="No hay plan para esta fecha y jornada"
          mensaje="Primero calcula el plan del día; después aquí aparecerá cada curso para registrar lo servido."
          accion={{ etiqueta: "Ir a Plan del día", onClick: () => navegar("plan") }}
        />
      ) : (
        <>
          <Aviso tono={pendientes === 0 ? "exito" : "info"}>
            {pendientes === 0
              ? "Todos los cursos de esta jornada ya tienen el comedor registrado."
              : `${pendientes} de ${filasJornada.length} cursos pendientes por registrar.`}
          </Aviso>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filasJornada.map((f) => (
              <TarjetaCurso key={f.plan.idPlan} fila={f} onRegistrado={cargarFilas} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaCurso({ fila, onRegistrado }: { fila: FilaComedor; onRegistrado: () => void }): JSX.Element {
  const { plan, curso, entrega } = fila;
  const [servidas, setServidas] = useState(plan.racionesPlanificadas);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function registrar(): void {
    setEnviando(true);
    setError(null);
    EntregaRacionApi.registrar({ idPlan: plan.idPlan, racionesServidas: servidas })
      .then(onRegistrado)
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setEnviando(false));
  }

  const ajustar = (delta: number) => setServidas((v) => Math.max(0, v + delta));

  return (
    <Tarjeta>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold" style={{ color: "#0F172A" }}>{curso.nombreCurso}</p>
          <p className="text-xs" style={{ color: "#64748B" }}>
            {plan.matriculaTotalRegistrada} matriculados · se pidieron <b>{plan.racionesPlanificadas}</b> raciones
          </p>
        </div>
        {entrega && <CheckCircle2 className="w-5 h-5" style={{ color: "#10B981" }} />}
      </div>

      {entrega ? (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Dato valor={entrega.racionesServidas} etiqueta="servidas" />
          <Dato valor={entrega.racionesSobrantes} etiqueta="sobraron" color={entrega.racionesSobrantes > 0 ? "#EA580C" : undefined} />
          <Dato valor={entrega.racionesFaltantes} etiqueta="faltaron" color={entrega.racionesFaltantes > 0 ? "#DC2626" : undefined} />
          <p className="col-span-3 text-xs mt-1" style={{ color: "#64748B" }}>
            Costo de la desviación (F8): <b>{formatoCOP(entrega.costoTotalDesviacion)}</b>
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs font-semibold mb-2" style={{ color: "#475569" }}>¿Cuántas raciones se sirvieron?</p>
          <div className="flex items-center gap-2">
            <BotonPaso onClick={() => ajustar(-10)} texto="−10" />
            <BotonPaso onClick={() => ajustar(-1)} icono={<Minus className="w-4 h-4" />} />
            <input
              type="number"
              min={0}
              value={servidas}
              onChange={(e) => setServidas(Math.max(0, Number(e.target.value) || 0))}
              className="w-full text-center text-2xl font-bold rounded-xl py-2 focus:outline-none"
              style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}
            />
            <BotonPaso onClick={() => ajustar(1)} icono={<Plus className="w-4 h-4" />} />
            <BotonPaso onClick={() => ajustar(10)} texto="+10" />
          </div>
          <p className="text-xs mt-2" style={{ color: "#64748B" }}>
            {servidas <= plan.racionesPlanificadas
              ? `Sobrarían ${plan.racionesPlanificadas - servidas} raciones.`
              : `Faltarían ${servidas - plan.racionesPlanificadas} raciones.`}
          </p>
          {error && <p className="text-xs mt-2 font-semibold" style={{ color: "#DC2626" }}>{error}</p>}
          <div className="mt-3">
            <BotonPrimario onClick={registrar} disabled={enviando}>
              {enviando ? "Registrando..." : "Registrar comedor"}
            </BotonPrimario>
          </div>
        </div>
      )}
    </Tarjeta>
  );
}

function BotonPaso({ onClick, texto, icono }: { onClick: () => void; texto?: string; icono?: JSX.Element }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 min-w-12 px-2 rounded-xl flex items-center justify-center text-sm font-bold transition-colors hover:bg-slate-200 active:scale-95"
      style={{ backgroundColor: "#F1F5F9", color: "#1E3A8A" }}
    >
      {icono ?? texto}
    </button>
  );
}

function Dato({ valor, etiqueta, color = "#0F172A" }: { valor: number; etiqueta: string; color?: string }): JSX.Element {
  return (
    <div className="rounded-xl py-2" style={{ backgroundColor: "#F8FAFC" }}>
      <p className="text-xl font-bold" style={{ color }}>{valor}</p>
      <p className="text-[11px]" style={{ color: "#64748B" }}>{etiqueta}</p>
    </div>
  );
}
