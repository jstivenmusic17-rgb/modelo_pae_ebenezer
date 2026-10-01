import { useCallback, useEffect, useState, type FormEvent, type JSX } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { INPUT_CLASS, INPUT_STYLE, blurInput, focusInput } from "../../components/FormField";
import { Aviso, BotonPrimario, Cargando, Tarjeta, TituloSeccion } from "../../components/Ui";
import { CursoApi, EstudianteApi, JornadaApi, type Curso, type Estudiante, type Jornada } from "../../services/api";
import { mensajeDeError } from "../../lib/datos";

export default function EstudiantesTab({ irACursos }: { irACursos: () => void }): JSX.Element {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [idCurso, setIdCurso] = useState<number | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enEdicion, setEnEdicion] = useState<number | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([JornadaApi.listar(), CursoApi.listar()])
      .then(([js, cs]) => {
        setJornadas(js);
        setCursos(cs);
        setIdCurso(cs[0]?.idCurso ?? null);
      })
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }, []);

  const cargarEstudiantes = useCallback(() => {
    if (idCurso === null) return;
    EstudianteApi.listarPorCurso(idCurso).then(setEstudiantes).catch((e) => setError(mensajeDeError(e)));
  }, [idCurso]);

  useEffect(cargarEstudiantes, [cargarEstudiantes]);

  function matricular(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (idCurso === null) return;
    const form = e.currentTarget;
    const datos = new FormData(form);
    setEnviando(true);
    setError(null);
    setAviso(null);
    EstudianteApi.matricular({
      documentoIdentidad: String(datos.get("documento") ?? "").trim(),
      nombreCompleto: String(datos.get("nombre") ?? "").trim(),
      idCurso,
    })
      .then((est) => {
        form.reset();
        setAviso(`${est.nombreCompleto} quedó matriculado.`);
        cargarEstudiantes();
      })
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setEnviando(false));
  }

  function guardarEdicion(e: FormEvent<HTMLFormElement>, est: Estudiante): void {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    setError(null);
    EstudianteApi.actualizar(est.idEstudiante, {
      documentoIdentidad: String(datos.get("documento") ?? "").trim(),
      nombreCompleto: String(datos.get("nombre") ?? "").trim(),
      idCurso: est.idCurso,
    })
      .then(() => {
        setEnEdicion(null);
        cargarEstudiantes();
      })
      .catch((err) => setError(mensajeDeError(err)));
  }

  function eliminar(idEstudiante: number): void {
    setError(null);
    EstudianteApi.eliminar(idEstudiante)
      .then(() => {
        setConfirmarEliminar(null);
        cargarEstudiantes();
      })
      .catch((err) => setError(mensajeDeError(err)));
  }

  if (cargando) return <Cargando />;
  if (cursos.length === 0) {
    return (
      <EmptyState
        titulo="Primero crea los cursos"
        mensaje="Los estudiantes se matriculan en un curso. Crea las jornadas y sus cursos antes de matricular."
        accion={{ etiqueta: "Crear jornadas y cursos", onClick: irACursos }}
      />
    );
  }

  const nombreJornada = (id: number) => jornadas.find((j) => j.idJornada === id)?.nombreJornada ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Tarjeta className="lg:col-span-1 h-fit">
        <TituloSeccion titulo="Matricular estudiante" ayuda="La cantidad de matriculados por curso es la base del cálculo del pedido (F1)." />
        <form onSubmit={matricular} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: "#475569" }}>Curso</span>
            <select value={idCurso ?? ""} onChange={(e) => setIdCurso(Number(e.target.value))} className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput}>
              {cursos.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>{c.nombreCurso} — {nombreJornada(c.idJornada)}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: "#475569" }}>Documento de identidad</span>
            <input name="documento" required inputMode="numeric" placeholder="Ej. 1001234567" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: "#475569" }}>Nombre completo</span>
            <input name="nombre" required placeholder="Ej. Ana Torres" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
          </label>
          <BotonPrimario type="submit" disabled={enviando}>
            <UserPlus className="w-4 h-4" /> {enviando ? "Matriculando..." : "Matricular"}
          </BotonPrimario>
        </form>
      </Tarjeta>

      <Tarjeta className="lg:col-span-2">
        <TituloSeccion titulo={`Estudiantes del curso (${estudiantes.length})`} />
        {error && <div className="mb-3"><Aviso tono="error">{error}</Aviso></div>}
        {aviso && <div className="mb-3"><Aviso tono="exito">{aviso}</Aviso></div>}
        {estudiantes.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: "#94A3B8" }}>Este curso aún no tiene estudiantes. Sin matrícula no se puede calcular su plan.</p>
        ) : (
          <div className="max-h-[480px] overflow-y-auto divide-y" style={{ borderColor: "#F1F5F9" }}>
            {estudiantes.map((est) =>
              enEdicion === est.idEstudiante ? (
                <form key={est.idEstudiante} onSubmit={(e) => guardarEdicion(e, est)} className="flex flex-wrap items-center gap-2 py-2">
                  <input name="documento" required defaultValue={est.documentoIdentidad} className={`${INPUT_CLASS} !w-36`} style={INPUT_STYLE} />
                  <input name="nombre" required defaultValue={est.nombreCompleto} className={`${INPUT_CLASS} !w-auto flex-1`} style={INPUT_STYLE} />
                  <button type="button" onClick={() => setEnEdicion(null)} className="text-xs font-semibold px-2" style={{ color: "#64748B" }}>Cancelar</button>
                  <button type="submit" className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#1E3A8A" }}>Guardar</button>
                </form>
              ) : (
                <div key={est.idEstudiante} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: "#0F172A" }}>{est.nombreCompleto}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>Doc. {est.documentoIdentidad}</p>
                  </div>
                  {confirmarEliminar === est.idEstudiante ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span style={{ color: "#B91C1C" }}>¿Eliminar?</span>
                      <button onClick={() => setConfirmarEliminar(null)} className="font-semibold" style={{ color: "#64748B" }}>No</button>
                      <button onClick={() => eliminar(est.idEstudiante)} className="font-bold px-2 py-1 rounded text-white" style={{ backgroundColor: "#DC2626" }}>Sí</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEnEdicion(est.idEstudiante)} className="p-1.5 rounded hover:bg-slate-100" title="Editar" style={{ color: "#64748B" }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmarEliminar(est.idEstudiante)} className="p-1.5 rounded hover:bg-red-50" title="Eliminar" style={{ color: "#DC2626" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
