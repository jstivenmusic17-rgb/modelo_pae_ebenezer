import { useCallback, useEffect, useState, type FormEvent, type JSX } from "react";
import { Pencil, Plus, Sun, Moon } from "lucide-react";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { DangerZone, FormField, INPUT_CLASS, INPUT_STYLE, SubmitButton, blurInput, focusInput } from "../../components/FormField";
import { Aviso, BotonPrimario, BotonSecundario, Cargando, Tarjeta } from "../../components/Ui";
import { CursoApi, EstudianteApi, JornadaApi, type Curso, type Jornada } from "../../services/api";
import { mensajeDeError } from "../../lib/datos";

type Edicion =
  | { tipo: "nuevaJornada" }
  | { tipo: "editarJornada"; jornada: Jornada }
  | { tipo: "nuevoCurso"; idJornada: number }
  | { tipo: "editarCurso"; curso: Curso };

export default function JornadasCursosTab(): JSX.Element {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [matriculas, setMatriculas] = useState<Record<number, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<Edicion | null>(null);

  const cargar = useCallback(() => {
    Promise.all([JornadaApi.listar(), CursoApi.listar()])
      .then(([js, cs]) => {
        setJornadas(js);
        setCursos(cs);
        return Promise.all(cs.map((c) => EstudianteApi.listarPorCurso(c.idCurso).then((es) => [c.idCurso, es.length] as const)));
      })
      .then((pares) => setMatriculas(Object.fromEntries(pares)))
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  function alGuardar(): void {
    setEdicion(null);
    cargar();
  }

  if (cargando) return <Cargando />;

  return (
    <div className="space-y-4">
      {error && <Aviso tono="error">{error}</Aviso>}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#64748B" }}>
          Cada jornada tiene sus cursos. El plan del día se calcula por jornada con la matrícula real de cada curso.
        </p>
        <BotonPrimario onClick={() => setEdicion({ tipo: "nuevaJornada" })}>
          <Plus className="w-4 h-4" /> Nueva jornada
        </BotonPrimario>
      </div>

      {jornadas.length === 0 ? (
        <EmptyState
          titulo="Aún no hay jornadas"
          mensaje="Empieza creando las jornadas de la institución, por ejemplo «Mañana» y «Tarde»."
          accion={{ etiqueta: "Crear la primera jornada", onClick: () => setEdicion({ tipo: "nuevaJornada" }) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jornadas.map((j) => {
            const cursosJornada = cursos.filter((c) => c.idJornada === j.idJornada).sort((a, b) => a.nombreCurso.localeCompare(b.nombreCurso));
            const total = cursosJornada.reduce((s, c) => s + (matriculas[c.idCurso] ?? 0), 0);
            const Icono = j.nombreJornada.toLowerCase().includes("tarde") ? Moon : Sun;
            return (
              <Tarjeta key={j.idJornada}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icono className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                    <div>
                      <p className="font-bold" style={{ color: "#0F172A" }}>{j.nombreJornada}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>
                        {cursosJornada.length} cursos · {total} estudiantes
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <BotonSecundario onClick={() => setEdicion({ tipo: "editarJornada", jornada: j })}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </BotonSecundario>
                    <BotonSecundario onClick={() => setEdicion({ tipo: "nuevoCurso", idJornada: j.idJornada })}>
                      <Plus className="w-3.5 h-3.5" /> Curso
                    </BotonSecundario>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {cursosJornada.length === 0 && <p className="text-xs" style={{ color: "#94A3B8" }}>Sin cursos todavía.</p>}
                  {cursosJornada.map((c) => (
                    <button
                      key={c.idCurso}
                      onClick={() => setEdicion({ tipo: "editarCurso", curso: c })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-blue-100"
                      style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}
                      title="Editar curso"
                    >
                      {c.nombreCurso} <span style={{ color: (matriculas[c.idCurso] ?? 0) === 0 ? "#DC2626" : "#64748B" }}>· {matriculas[c.idCurso] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      {edicion && (edicion.tipo === "nuevaJornada" || edicion.tipo === "editarJornada") && (
        <ModalJornada jornada={edicion.tipo === "editarJornada" ? edicion.jornada : null} onClose={() => setEdicion(null)} onGuardado={alGuardar} />
      )}
      {edicion && (edicion.tipo === "nuevoCurso" || edicion.tipo === "editarCurso") && (
        <ModalCurso
          jornadas={jornadas}
          curso={edicion.tipo === "editarCurso" ? edicion.curso : null}
          idJornadaInicial={edicion.tipo === "nuevoCurso" ? edicion.idJornada : edicion.curso.idJornada}
          onClose={() => setEdicion(null)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  );
}

function ModalJornada({ jornada, onClose, onGuardado }: { jornada: Jornada | null; onClose: () => void; onGuardado: () => void }): JSX.Element {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  function guardar(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const nombreJornada = String(new FormData(e.currentTarget).get("nombre") ?? "").trim();
    setEnviando(true);
    setError(null);
    (jornada ? JornadaApi.actualizar(jornada.idJornada, { nombreJornada }) : JornadaApi.crear({ nombreJornada }))
      .then(onGuardado)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setEnviando(false));
  }

  function eliminar(): void {
    if (!jornada) return;
    setEliminando(true);
    JornadaApi.eliminar(jornada.idJornada)
      .then(onGuardado)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setEliminando(false));
  }

  return (
    <Modal title={jornada ? "Editar jornada" : "Nueva jornada"} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-4">
        <FormField label="Nombre de la jornada">
          <input name="nombre" required autoFocus defaultValue={jornada?.nombreJornada} placeholder="Ej. Mañana" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
        </FormField>
        {error && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{error}</p>}
        <SubmitButton submitting={enviando} submittingLabel="Guardando..." label={jornada ? "Guardar cambios" : "Crear jornada"} />
        {jornada && (
          <DangerZone label="Eliminar jornada" confirming={confirmando} deleting={eliminando} onRequestConfirm={() => setConfirmando(true)} onCancel={() => setConfirmando(false)} onConfirm={eliminar} />
        )}
      </form>
    </Modal>
  );
}

function ModalCurso({ jornadas, curso, idJornadaInicial, onClose, onGuardado }: {
  jornadas: Jornada[];
  curso: Curso | null;
  idJornadaInicial: number;
  onClose: () => void;
  onGuardado: () => void;
}): JSX.Element {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  function guardar(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const peticion = { nombreCurso: String(datos.get("nombre") ?? "").trim(), idJornada: Number(datos.get("jornada")) };
    setEnviando(true);
    setError(null);
    (curso ? CursoApi.actualizar(curso.idCurso, peticion) : CursoApi.crear(peticion))
      .then(onGuardado)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setEnviando(false));
  }

  function eliminar(): void {
    if (!curso) return;
    setEliminando(true);
    CursoApi.eliminar(curso.idCurso)
      .then(onGuardado)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setEliminando(false));
  }

  return (
    <Modal title={curso ? "Editar curso" : "Nuevo curso"} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-4">
        <FormField label="Nombre del curso">
          <input name="nombre" required autoFocus defaultValue={curso?.nombreCurso} placeholder="Ej. 6A" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
        </FormField>
        <FormField label="Jornada">
          <select name="jornada" defaultValue={idJornadaInicial} className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput}>
            {jornadas.map((j) => (
              <option key={j.idJornada} value={j.idJornada}>{j.nombreJornada}</option>
            ))}
          </select>
        </FormField>
        {error && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{error}</p>}
        <SubmitButton submitting={enviando} submittingLabel="Guardando..." label={curso ? "Guardar cambios" : "Crear curso"} />
        {curso && (
          <DangerZone label="Eliminar curso" confirming={confirmando} deleting={eliminando} onRequestConfirm={() => setConfirmando(true)} onCancel={() => setConfirmando(false)} onConfirm={eliminar} />
        )}
      </form>
    </Modal>
  );
}
