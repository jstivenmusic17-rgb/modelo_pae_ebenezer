import { type CSSProperties, type FormEvent, type JSX, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, Loader2, Moon, Pencil, Plus, Sun, Trash2, UserPlus, X } from "lucide-react";

import {
  blurInput,
  DangerZone,
  FormField,
  focusInput,
  INPUT_CLASS,
  INPUT_STYLE,
  SubmitButton,
} from "../components/FormField.tsx";
import Modal from "../components/Modal.tsx";
import {
  ApiError,
  CursoApi,
  EstudianteApi,
  JornadaApi,
  PlanRacionApi,
  type Curso,
  type Estudiante,
  type Jornada,
  type PlanRacion,
} from "../services/api.ts";

const MINUTA_SEMANAL = [
  { day: "Lunes", menu: "Arroz con Pollo, Ensalada Verde, Jugo de Mora", kcal: 650 },
  { day: "Martes", menu: "Frijoles, Carne Molida, Arroz, Tajadas de Plátano", kcal: 700 },
  { day: "Miércoles", menu: "Sopa de Verduras, Pollo Guisado, Arroz Integral", kcal: 620 },
  { day: "Jueves", menu: "Lentejas, Cerdo Asado, Ensalada, Jugo Natural", kcal: 680 },
  { day: "Viernes", menu: "Pasta con Carne, Pan Integral, Fruta de Temporada", kcal: 590 },
];

const NUTRICION = [
  { label: "Proteína", value: "35g", percentage: 70, color: "#3B82F6" },
  { label: "Carbohidratos", value: "60g", percentage: 85, color: "#10B981" },
  { label: "Vegetales / Frutas", value: "120g", percentage: 90, color: "#F97316" },
  { label: "Grasas Saludables", value: "18g", percentage: 55, color: "#8B5CF6" },
];

// Parámetros por defecto usados al calcular el plan mientras la vista no
// expone controles propios para costos/tasa (coherente con el Motor
// Analítico del Dashboard: asistencia 90%, margen de seguridad 0.7%).
const TASA_ASISTENCIA_DEFECTO = 0.9;
const COSTO_RACION_DEFECTO = 4350;
const MARGEN_SEGURIDAD_DEFECTO = 0.007;

function esJornadaManana(nombre: string): boolean {
  return /ma[ñn]ana/i.test(nombre);
}

function approveCardStyle(approved: boolean): CSSProperties {
  if (approved) {
    return { backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7" };
  }
  return { backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" };
}

function approveButtonStyle(approved: boolean, disabled: boolean): CSSProperties {
  if (approved) {
    return { backgroundColor: "#10B981", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" };
  }
  return {
    background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
    boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
    opacity: disabled ? 0.7 : 1,
  };
}

function approveStatusMessage(approved: boolean, plan: PlanRacion | null, sinEstudiantes: boolean): string {
  if (!approved) {
    if (sinEstudiantes) {
      return "Matricula al menos un estudiante en este curso antes de planificar.";
    }
    return "La planificación cumple con los requisitos del PAE. ¿Deseas aprobarla?";
  }
  if (plan) {
    return `Plan #${plan.idPlan}: ${plan.racionesSugeridasMargen} raciones enviadas a cocina y logística.`;
  }
  return "La planificación fue enviada al área de cocina y logística.";
}

function renderApproveButtonContent(approved: boolean, aprobando: boolean): JSX.Element {
  if (approved) {
    return (
      <span className="flex items-center justify-center gap-2">
        <CheckCircle2 className="w-4 h-4" /> ¡Orden Confirmada!
      </span>
    );
  }
  if (aprobando) {
    return (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Calculando plan...
      </span>
    );
  }
  return <>Aprobar y Despachar Orden</>;
}

export default function PlanificacionView(): JSX.Element {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [cursosPorJornada, setCursosPorJornada] = useState<Curso[]>([]);
  const [idJornadaSeleccionada, setIdJornadaSeleccionada] = useState<number | null>(null);
  const [idCursoSeleccionado, setIdCursoSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estudiantesDelCurso, setEstudiantesDelCurso] = useState<Estudiante[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);

  const [aprobando, setAprobando] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [planAprobado, setPlanAprobado] = useState<PlanRacion | null>(null);

  const [mostrarNuevaJornada, setMostrarNuevaJornada] = useState(false);
  const [creandoJornada, setCreandoJornada] = useState(false);
  const [mostrarNuevoCurso, setMostrarNuevoCurso] = useState(false);
  const [creandoCurso, setCreandoCurso] = useState(false);
  const [mostrarMatricular, setMostrarMatricular] = useState(false);
  const [matriculando, setMatriculando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [mostrarEditarJornada, setMostrarEditarJornada] = useState(false);
  const [guardandoJornada, setGuardandoJornada] = useState(false);
  const [confirmarEliminarJornada, setConfirmarEliminarJornada] = useState(false);
  const [eliminandoJornada, setEliminandoJornada] = useState(false);

  const [mostrarEditarCurso, setMostrarEditarCurso] = useState(false);
  const [guardandoCurso, setGuardandoCurso] = useState(false);
  const [confirmarEliminarCurso, setConfirmarEliminarCurso] = useState(false);
  const [eliminandoCurso, setEliminandoCurso] = useState(false);

  const [mostrarListaEstudiantes, setMostrarListaEstudiantes] = useState(false);
  const [estudianteEnEdicion, setEstudianteEnEdicion] = useState<Estudiante | null>(null);
  const [guardandoEstudiante, setGuardandoEstudiante] = useState(false);
  const [confirmarEliminarEstudianteId, setConfirmarEliminarEstudianteId] = useState<number | null>(null);
  const [eliminandoEstudianteId, setEliminandoEstudianteId] = useState<number | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);

  useEffect(function cargarJornadasAlMontar() {
    setCargando(true);
    setError(null);
    JornadaApi.listar()
      .then(function aplicarJornadas(data: Jornada[]): void {
        setJornadas(data);
        if (data.length > 0) setIdJornadaSeleccionada(data[0].idJornada);
      })
      .catch(function manejarError(err: unknown): void {
        setError(err instanceof ApiError ? err.message : "No fue posible cargar las jornadas.");
      })
      .finally(function detenerCarga(): void {
        setCargando(false);
      });
  }, []);

  useEffect(
    function cargarCursosDeLaJornada() {
      if (idJornadaSeleccionada === null) return;
      setCargandoCursos(true);
      CursoApi.listarPorJornada(idJornadaSeleccionada)
        .then(function aplicarCursos(cursos: Curso[]): void {
          setCursosPorJornada(cursos);
          setIdCursoSeleccionado(cursos[0]?.idCurso ?? null);
        })
        .catch(function manejarError(err: unknown): void {
          setError(err instanceof ApiError ? err.message : "No fue posible cargar los cursos de la jornada.");
        })
        .finally(function detenerCarga(): void {
          setCargandoCursos(false);
        });
    },
    [idJornadaSeleccionada]
  );

  const cargarEstudiantes = useCallback(function cargarEstudiantesImpl(): Promise<void> {
    if (idCursoSeleccionado === null) {
      setEstudiantesDelCurso([]);
      return Promise.resolve();
    }
    setCargandoEstudiantes(true);
    return EstudianteApi.listarPorCurso(idCursoSeleccionado)
      .then(setEstudiantesDelCurso)
      .catch(function manejarError(): void {
        setEstudiantesDelCurso([]);
      })
      .finally(function detenerCarga(): void {
        setCargandoEstudiantes(false);
      });
  }, [idCursoSeleccionado]);

  useEffect(
    function cargarEstudiantesAlCambiarCurso() {
      cargarEstudiantes();
    },
    [cargarEstudiantes]
  );

  const jornadaActiva = useMemo(
    () => jornadas.find((j) => j.idJornada === idJornadaSeleccionada) ?? null,
    [jornadas, idJornadaSeleccionada]
  );
  const cursoObjetivo = useMemo(
    () => cursosPorJornada.find((c) => c.idCurso === idCursoSeleccionado) ?? null,
    [cursosPorJornada, idCursoSeleccionado]
  );
  const nombreJornadaMostrado = jornadaActiva?.nombreJornada ?? "—";
  const shiftEsManana = jornadaActiva ? esJornadaManana(jornadaActiva.nombreJornada) : true;
  const sinEstudiantes = cursoObjetivo !== null && !cargandoEstudiantes && estudiantesDelCurso.length === 0;

  const handleSelectJornada = useCallback(function seleccionarJornada(idJornada: number): void {
    setIdJornadaSeleccionada(idJornada);
    setApproved(false);
    setPlanAprobado(null);
  }, []);

  function handleApprove(): void {
    if (!cursoObjetivo) {
      setError("Esta jornada no tiene cursos registrados para planificar.");
      return;
    }
    setAprobando(true);
    setError(null);
    PlanRacionApi.calcular({
      idCurso: cursoObjetivo.idCurso,
      fecha: new Date().toISOString().slice(0, 10),
      tasaAsistenciaEstimada: TASA_ASISTENCIA_DEFECTO,
      costoSobranteUnitario: Math.round(COSTO_RACION_DEFECTO * 0.3),
      costoFaltanteUnitario: COSTO_RACION_DEFECTO,
      costoProduccionUnitario: COSTO_RACION_DEFECTO,
      margenSeguridad: MARGEN_SEGURIDAD_DEFECTO,
    })
      .then(function aplicarPlanAprobado(plan: PlanRacion): void {
        setPlanAprobado(plan);
        setApproved(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      })
      .catch(function manejarErrorDeAprobacion(err: unknown): void {
        setError(err instanceof ApiError ? err.message : "No fue posible calcular y aprobar el plan.");
      })
      .finally(function detenerAprobacion(): void {
        setAprobando(false);
      });
  }

  function abrirNuevaJornada(): void {
    setErrorModal(null);
    setMostrarNuevaJornada(true);
  }

  function abrirNuevoCurso(): void {
    setErrorModal(null);
    setMostrarNuevoCurso(true);
  }

  function abrirMatricular(): void {
    setErrorModal(null);
    setMostrarMatricular(true);
  }

  function handleSubmitJornada(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const nombreJornada = String(new FormData(e.currentTarget).get("nombreJornada") ?? "").trim();
    if (!nombreJornada) {
      setErrorModal("Ingresa un nombre para la jornada.");
      return;
    }

    setCreandoJornada(true);
    setErrorModal(null);
    JornadaApi.crear({ nombreJornada })
      .then(function alCrear(nueva: Jornada): void {
        setMostrarNuevaJornada(false);
        setJornadas((actuales) => [...actuales, nueva]);
        setIdJornadaSeleccionada(nueva.idJornada);
      })
      .catch(function manejarError(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible crear la jornada.");
      })
      .finally(function detener(): void {
        setCreandoJornada(false);
      });
  }

  function handleSubmitCurso(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (idJornadaSeleccionada === null) return;
    const nombreCurso = String(new FormData(e.currentTarget).get("nombreCurso") ?? "").trim();
    if (!nombreCurso) {
      setErrorModal("Ingresa un nombre para el curso.");
      return;
    }

    const idJornada = idJornadaSeleccionada;
    setCreandoCurso(true);
    setErrorModal(null);
    CursoApi.crear({ nombreCurso, idJornada })
      .then(function alCrear(nuevo: Curso): Promise<void> {
        setMostrarNuevoCurso(false);
        return CursoApi.listarPorJornada(idJornada).then(function aplicarCursos(cursos: Curso[]): void {
          setCursosPorJornada(cursos);
          setIdCursoSeleccionado(nuevo.idCurso);
        });
      })
      .catch(function manejarError(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible crear el curso.");
      })
      .finally(function detener(): void {
        setCreandoCurso(false);
      });
  }

  function handleSubmitEstudiante(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (idCursoSeleccionado === null) return;
    const formData = new FormData(e.currentTarget);
    const documentoIdentidad = String(formData.get("documentoIdentidad") ?? "").trim();
    const nombreCompleto = String(formData.get("nombreCompleto") ?? "").trim();

    if (!documentoIdentidad || !nombreCompleto) {
      setErrorModal("Completa el documento y el nombre completo.");
      return;
    }

    setMatriculando(true);
    setErrorModal(null);
    EstudianteApi.matricular({ documentoIdentidad, nombreCompleto, idCurso: idCursoSeleccionado })
      .then(function alMatricular(): Promise<void> {
        setMostrarMatricular(false);
        return cargarEstudiantes();
      })
      .catch(function manejarError(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible matricular al estudiante.");
      })
      .finally(function detener(): void {
        setMatriculando(false);
      });
  }

  function abrirEditarJornada(): void {
    setErrorModal(null);
    setConfirmarEliminarJornada(false);
    setMostrarEditarJornada(true);
  }

  function handleSubmitEditarJornada(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!jornadaActiva) return;
    const nombreJornada = String(new FormData(e.currentTarget).get("nombreJornada") ?? "").trim();
    if (!nombreJornada) {
      setErrorModal("Ingresa un nombre para la jornada.");
      return;
    }

    setGuardandoJornada(true);
    setErrorModal(null);
    JornadaApi.actualizar(jornadaActiva.idJornada, { nombreJornada })
      .then(function alGuardar(actualizada: Jornada): void {
        setMostrarEditarJornada(false);
        setJornadas((actuales) => actuales.map((j) => (j.idJornada === actualizada.idJornada ? actualizada : j)));
      })
      .catch(function manejarError(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible guardar los cambios.");
      })
      .finally(function detener(): void {
        setGuardandoJornada(false);
      });
  }

  function handleEliminarJornada(): void {
    if (!jornadaActiva) return;
    if (!confirmarEliminarJornada) {
      setConfirmarEliminarJornada(true);
      return;
    }

    const idJornadaAEliminar = jornadaActiva.idJornada;
    setEliminandoJornada(true);
    setErrorModal(null);
    JornadaApi.eliminar(idJornadaAEliminar)
      .then(function alEliminar(): void {
        setMostrarEditarJornada(false);
        setConfirmarEliminarJornada(false);
        setJornadas((actuales) => {
          const restantes = actuales.filter((j) => j.idJornada !== idJornadaAEliminar);
          setIdJornadaSeleccionada(restantes[0]?.idJornada ?? null);
          return restantes;
        });
      })
      .catch(function manejarError(err: unknown): void {
        setErrorModal(
          err instanceof ApiError ? err.message : "No fue posible eliminar la jornada (verifica que no tenga cursos asociados)."
        );
        setConfirmarEliminarJornada(false);
      })
      .finally(function detener(): void {
        setEliminandoJornada(false);
      });
  }

  function abrirEditarCurso(): void {
    setErrorModal(null);
    setConfirmarEliminarCurso(false);
    setMostrarEditarCurso(true);
  }

  function handleSubmitEditarCurso(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!cursoObjetivo || idJornadaSeleccionada === null) return;
    const nombreCurso = String(new FormData(e.currentTarget).get("nombreCurso") ?? "").trim();
    if (!nombreCurso) {
      setErrorModal("Ingresa un nombre para el curso.");
      return;
    }

    const idJornada = idJornadaSeleccionada;
    setGuardandoCurso(true);
    setErrorModal(null);
    CursoApi.actualizar(cursoObjetivo.idCurso, { nombreCurso, idJornada })
      .then(function alGuardar(): Promise<void> {
        setMostrarEditarCurso(false);
        return CursoApi.listarPorJornada(idJornada).then(setCursosPorJornada);
      })
      .catch(function manejarError(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible guardar los cambios.");
      })
      .finally(function detener(): void {
        setGuardandoCurso(false);
      });
  }

  function handleEliminarCurso(): void {
    if (!cursoObjetivo || idJornadaSeleccionada === null) return;
    if (!confirmarEliminarCurso) {
      setConfirmarEliminarCurso(true);
      return;
    }

    const idJornada = idJornadaSeleccionada;
    setEliminandoCurso(true);
    setErrorModal(null);
    CursoApi.eliminar(cursoObjetivo.idCurso)
      .then(function alEliminar(): Promise<void> {
        setMostrarEditarCurso(false);
        setConfirmarEliminarCurso(false);
        return CursoApi.listarPorJornada(idJornada).then(function aplicarCursos(cursos: Curso[]): void {
          setCursosPorJornada(cursos);
          setIdCursoSeleccionado(cursos[0]?.idCurso ?? null);
        });
      })
      .catch(function manejarError(err: unknown): void {
        setErrorModal(
          err instanceof ApiError
            ? err.message
            : "No fue posible eliminar el curso (verifica que no tenga estudiantes o planes asociados)."
        );
        setConfirmarEliminarCurso(false);
      })
      .finally(function detener(): void {
        setEliminandoCurso(false);
      });
  }

  function abrirListaEstudiantes(): void {
    setErrorLista(null);
    setEstudianteEnEdicion(null);
    setConfirmarEliminarEstudianteId(null);
    setMostrarListaEstudiantes(true);
  }

  function iniciarEdicionEstudiante(estudiante: Estudiante): void {
    setErrorLista(null);
    setConfirmarEliminarEstudianteId(null);
    setEstudianteEnEdicion(estudiante);
  }

  function handleSubmitEditarEstudiante(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!estudianteEnEdicion || idCursoSeleccionado === null) return;
    const formData = new FormData(e.currentTarget);
    const documentoIdentidad = String(formData.get("documentoIdentidad") ?? "").trim();
    const nombreCompleto = String(formData.get("nombreCompleto") ?? "").trim();

    if (!documentoIdentidad || !nombreCompleto) {
      setErrorLista("Completa el documento y el nombre completo.");
      return;
    }

    setGuardandoEstudiante(true);
    setErrorLista(null);
    EstudianteApi.actualizar(estudianteEnEdicion.idEstudiante, {
      documentoIdentidad,
      nombreCompleto,
      idCurso: idCursoSeleccionado,
    })
      .then(function alGuardar(): Promise<void> {
        setEstudianteEnEdicion(null);
        return cargarEstudiantes();
      })
      .catch(function manejarError(err: unknown): void {
        setErrorLista(err instanceof ApiError ? err.message : "No fue posible guardar los cambios.");
      })
      .finally(function detener(): void {
        setGuardandoEstudiante(false);
      });
  }

  function handleEliminarEstudiante(idEstudiante: number): void {
    if (confirmarEliminarEstudianteId !== idEstudiante) {
      setConfirmarEliminarEstudianteId(idEstudiante);
      return;
    }

    setEliminandoEstudianteId(idEstudiante);
    setErrorLista(null);
    EstudianteApi.eliminar(idEstudiante)
      .then(function alEliminar(): Promise<void> {
        setConfirmarEliminarEstudianteId(null);
        return cargarEstudiantes();
      })
      .catch(function manejarError(err: unknown): void {
        setErrorLista(err instanceof ApiError ? err.message : "No fue posible eliminar al estudiante.");
        setConfirmarEliminarEstudianteId(null);
      })
      .finally(function detener(): void {
        setEliminandoEstudianteId(null);
      });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
            style={{ backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7" }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: "#10B981" }} />
            <p className="text-sm font-semibold" style={{ color: "#065F46" }}>
              ¡Orden aprobada y enviada a despacho!
            </p>
            <button onClick={() => setShowToast(false)} style={{ color: "#94A3B8" }}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "#0F172A" }}>
            <Calendar className="w-5 h-5" style={{ color: "#1E3A8A" }} />
            Planificación de Raciones
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Configura y aprueba el menú y gramaje semanal
          </p>
        </div>

        {/* Shift Toggle */}
        <div className="flex items-center gap-2">
          <div
            className="flex p-1 rounded-xl"
            style={{ backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0" }}
          >
            {cargando ? (
              <span className="flex items-center gap-2 px-4 py-2 text-sm" style={{ color: "#94A3B8" }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando jornadas...
              </span>
            ) : (
              jornadas.map((j) => {
                const isActive = j.idJornada === idJornadaSeleccionada;
                const esManana = esJornadaManana(j.nombreJornada);
                return (
                  <button
                    key={j.idJornada}
                    onClick={() => handleSelectJornada(j.idJornada)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={
                      isActive
                        ? { backgroundColor: "#FFFFFF", color: "#1E3A8A", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                        : { color: "#64748B" }
                    }
                  >
                    {esManana ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {j.nombreJornada}
                  </button>
                );
              })
            )}
          </div>
          <button
            onClick={abrirNuevaJornada}
            title="Nueva jornada"
            className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm active:scale-95 flex-shrink-0"
            style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={abrirEditarJornada}
            disabled={!jornadaActiva}
            title="Editar jornada actual"
            className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-sm active:scale-95 flex-shrink-0 disabled:opacity-50"
            style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de curso: define sobre qué curso actúa "Aprobar y Despachar Orden" */}
      <div
        className="rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <label className="text-xs font-semibold flex-shrink-0" style={{ color: "#475569" }}>
            Curso a planificar
          </label>
          {cargandoCursos ? (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#94A3B8" }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando cursos...
            </span>
          ) : (
            <select
              value={idCursoSeleccionado ?? ""}
              onChange={(e) => setIdCursoSeleccionado(e.target.value ? Number(e.target.value) : null)}
              className={INPUT_CLASS}
              style={{ ...INPUT_STYLE, maxWidth: 180 }}
              onFocus={focusInput}
              onBlur={blurInput}
            >
              {cursosPorJornada.length === 0 && <option value="">Sin cursos</option>}
              {cursosPorJornada.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>{c.nombreCurso}</option>
              ))}
            </select>
          )}
          <button
            onClick={abrirNuevoCurso}
            disabled={idJornadaSeleccionada === null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-sm active:scale-95"
            style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}
          >
            <Plus className="w-3.5 h-3.5" /> Curso
          </button>
          <button
            onClick={abrirEditarCurso}
            disabled={!cursoObjetivo}
            title="Editar curso"
            className="p-2 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={abrirListaEstudiantes}
            disabled={idCursoSeleccionado === null}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all duration-200 hover:shadow-sm disabled:opacity-50"
            style={{ backgroundColor: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0" }}
          >
            {cargandoEstudiantes ? "…" : estudiantesDelCurso.length} matriculado{estudiantesDelCurso.length === 1 ? "" : "s"}
          </button>
          <button
            onClick={abrirMatricular}
            disabled={idCursoSeleccionado === null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-sm active:scale-95"
            style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Estudiante
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Minuta */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>
              Minuta Semanal — Jornada {nombreJornadaMostrado}
            </h3>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {MINUTA_SEMANAL.map((item, i) => (
              <motion.div
                key={item.day}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3 p-3 rounded-xl transition-colors duration-150"
                style={{ border: "1px solid #F1F5F9" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-center leading-tight"
                  style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}
                >
                  {item.day.slice(0, 3).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-relaxed" style={{ color: "#0F172A" }}>
                    {item.menu}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                      ≈ {shiftEsManana ? "350" : "150"} raciones
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
                    >
                      {item.kcal} kcal
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Nutrition + Approve */}
        <div className="flex flex-col gap-5">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>
                Desglose Nutricional Promedio
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {NUTRICION.map((n, i) => (
                <div key={n.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "#475569" }}>{n.label}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: "#F8FAFC", color: "#0F172A", border: "1px solid #E2E8F0" }}
                    >
                      {n.value}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${n.percentage}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: n.color }}
                    />
                  </div>
                  <p className="text-right text-[10px] mt-0.5 font-medium" style={{ color: "#94A3B8" }}>
                    {n.percentage}% del requerimiento diario
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Approve Card */}
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={approveCardStyle(approved)}>
            <div>
              <h4 className="font-bold text-sm" style={{ color: approved ? "#065F46" : "#0F172A" }}>
                {approved ? "✓ Orden Aprobada y Despachada" : "Orden Lista para Despacho"}
              </h4>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                {approveStatusMessage(approved, planAprobado, sinEstudiantes)}
              </p>
            </div>

            <button
              onClick={handleApprove}
              disabled={approved || aprobando || cargandoCursos || !cursoObjetivo || sinEstudiantes}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
              style={approveButtonStyle(approved, aprobando || cargandoCursos || !cursoObjetivo || sinEstudiantes)}
            >
              {renderApproveButtonContent(approved, aprobando)}
            </button>
          </div>
        </div>
      </div>

      {mostrarNuevaJornada && (
        <Modal
          title="Nueva Jornada"
          description="Ej. Mañana, Tarde — agrupa cursos por horario de comedor."
          onClose={() => setMostrarNuevaJornada(false)}
        >
          <form onSubmit={handleSubmitJornada} className="flex flex-col gap-4">
            <FormField label="Nombre de la jornada">
              <input
                name="nombreJornada"
                required
                autoFocus
                placeholder="Ej. Mañana"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>}
            <SubmitButton submitting={creandoJornada} submittingLabel="Creando..." label="Crear Jornada" />
          </form>
        </Modal>
      )}

      {mostrarEditarJornada && jornadaActiva && (
        <Modal
          title="Editar Jornada"
          description="Cambia el nombre o elimina esta jornada."
          onClose={() => setMostrarEditarJornada(false)}
        >
          <form onSubmit={handleSubmitEditarJornada} className="flex flex-col gap-4">
            <FormField label="Nombre de la jornada">
              <input
                name="nombreJornada"
                required
                autoFocus
                defaultValue={jornadaActiva.nombreJornada}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>}
            <SubmitButton submitting={guardandoJornada} submittingLabel="Guardando..." label="Guardar Cambios" />
            <DangerZone
              label="Eliminar Jornada"
              confirming={confirmarEliminarJornada}
              deleting={eliminandoJornada}
              onRequestConfirm={() => setConfirmarEliminarJornada(true)}
              onCancel={() => setConfirmarEliminarJornada(false)}
              onConfirm={handleEliminarJornada}
            />
          </form>
        </Modal>
      )}

      {mostrarNuevoCurso && (
        <Modal
          title="Nuevo Curso"
          description={`Se crea dentro de la jornada ${nombreJornadaMostrado}.`}
          onClose={() => setMostrarNuevoCurso(false)}
        >
          <form onSubmit={handleSubmitCurso} className="flex flex-col gap-4">
            <FormField label="Nombre del curso">
              <input
                name="nombreCurso"
                required
                autoFocus
                placeholder="Ej. 1A"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>}
            <SubmitButton submitting={creandoCurso} submittingLabel="Creando..." label="Crear Curso" />
          </form>
        </Modal>
      )}

      {mostrarEditarCurso && cursoObjetivo && (
        <Modal
          title="Editar Curso"
          description="Cambia el nombre o elimina este curso."
          onClose={() => setMostrarEditarCurso(false)}
        >
          <form onSubmit={handleSubmitEditarCurso} className="flex flex-col gap-4">
            <FormField label="Nombre del curso">
              <input
                name="nombreCurso"
                required
                autoFocus
                defaultValue={cursoObjetivo.nombreCurso}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>}
            <SubmitButton submitting={guardandoCurso} submittingLabel="Guardando..." label="Guardar Cambios" />
            <DangerZone
              label="Eliminar Curso"
              confirming={confirmarEliminarCurso}
              deleting={eliminandoCurso}
              onRequestConfirm={() => setConfirmarEliminarCurso(true)}
              onCancel={() => setConfirmarEliminarCurso(false)}
              onConfirm={handleEliminarCurso}
            />
          </form>
        </Modal>
      )}

      {mostrarMatricular && cursoObjetivo && (
        <Modal
          title="Matricular Estudiante"
          description={`Se matricula en el curso ${cursoObjetivo.nombreCurso}.`}
          onClose={() => setMostrarMatricular(false)}
        >
          <form onSubmit={handleSubmitEstudiante} className="flex flex-col gap-4">
            <FormField label="Documento de identidad">
              <input
                name="documentoIdentidad"
                required
                autoFocus
                placeholder="Ej. 1001"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <FormField label="Nombre completo">
              <input
                name="nombreCompleto"
                required
                placeholder="Ej. Ana Torres"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>}
            <SubmitButton submitting={matriculando} submittingLabel="Matriculando..." label="Matricular Estudiante" />
          </form>
        </Modal>
      )}

      {mostrarListaEstudiantes && cursoObjetivo && (
        <Modal
          title="Estudiantes Matriculados"
          description={`Curso ${cursoObjetivo.nombreCurso} — ${estudiantesDelCurso.length} en total.`}
          onClose={() => setMostrarListaEstudiantes(false)}
        >
          <div className="flex flex-col gap-3">
            {errorLista && <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorLista}</p>}

            {estudiantesDelCurso.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "#94A3B8" }}>
                Aún no hay estudiantes matriculados.
              </p>
            )}

            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {estudiantesDelCurso.map((estudiante) => {
                const enEdicion = estudianteEnEdicion?.idEstudiante === estudiante.idEstudiante;
                const confirmandoEliminar = confirmarEliminarEstudianteId === estudiante.idEstudiante;

                if (enEdicion) {
                  return (
                    <form
                      key={estudiante.idEstudiante}
                      onSubmit={handleSubmitEditarEstudiante}
                      className="p-3 rounded-xl flex flex-col gap-2"
                      style={{ border: "1px solid #BFDBFE", backgroundColor: "#EFF6FF" }}
                    >
                      <input
                        name="documentoIdentidad"
                        required
                        autoFocus
                        defaultValue={estudiante.documentoIdentidad}
                        className={INPUT_CLASS}
                        style={{ ...INPUT_STYLE, backgroundColor: "#FFFFFF" }}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                      <input
                        name="nombreCompleto"
                        required
                        defaultValue={estudiante.nombreCompleto}
                        className={INPUT_CLASS}
                        style={{ ...INPUT_STYLE, backgroundColor: "#FFFFFF" }}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEstudianteEnEdicion(null)}
                          className="text-xs font-semibold px-2 py-1.5"
                          style={{ color: "#64748B" }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={guardandoEstudiante}
                          className="flex-1 text-xs font-bold py-1.5 rounded-lg text-white disabled:cursor-wait"
                          style={{ backgroundColor: "#1E3A8A" }}
                        >
                          {guardandoEstudiante ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={estudiante.idEstudiante}
                    className="p-3 rounded-xl flex items-center justify-between gap-3"
                    style={{ border: "1px solid #F1F5F9", backgroundColor: "#F8FAFC" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>
                        {estudiante.nombreCompleto}
                      </p>
                      <p className="text-[10px]" style={{ color: "#94A3B8" }}>Doc. {estudiante.documentoIdentidad}</p>
                    </div>
                    {confirmandoEliminar ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setConfirmarEliminarEstudianteId(null)}
                          className="text-[10px] font-semibold px-1.5"
                          style={{ color: "#64748B" }}
                        >
                          No
                        </button>
                        <button
                          onClick={() => handleEliminarEstudiante(estudiante.idEstudiante)}
                          disabled={eliminandoEstudianteId === estudiante.idEstudiante}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg text-white disabled:cursor-wait"
                          style={{ backgroundColor: "#DC2626" }}
                        >
                          {eliminandoEstudianteId === estudiante.idEstudiante ? "..." : "Sí, eliminar"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => iniciarEdicionEstudiante(estudiante)} style={{ color: "#64748B" }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEliminarEstudiante(estudiante.idEstudiante)} style={{ color: "#DC2626" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
