import { useCallback, useEffect, useState, type FormEvent, type JSX } from "react";
import { ChefHat, Plus, UserPlus } from "lucide-react";
import { INPUT_CLASS, INPUT_STYLE, blurInput, focusInput } from "../../components/FormField";
import { Aviso, BotonPrimario, Cargando, Tarjeta, TituloSeccion } from "../../components/Ui";
import { CocinaApi, type PersonalCocina } from "../../services/api";
import { cargarTurnosConCapacidad, mensajeDeError, type TurnoConCapacidad } from "../../lib/datos";

export default function CocinaTab(): JSX.Element {
  const [turnos, setTurnos] = useState<TurnoConCapacidad[]>([]);
  const [personal, setPersonal] = useState<PersonalCocina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(() => {
    cargarTurnosConCapacidad()
      .then((ts) => {
        setTurnos(ts);
        return Promise.all(ts.map((t) => CocinaApi.listarPersonalPorTurno(t.idTurno).catch(() => [])));
      })
      .then((listas) => setPersonal(listas.flat()))
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  function enviar(e: FormEvent<HTMLFormElement>, accion: (d: FormData) => Promise<unknown>): void {
    e.preventDefault();
    const form = e.currentTarget;
    setEnviando(true);
    setError(null);
    accion(new FormData(form))
      .then(() => {
        form.reset();
        cargar();
      })
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setEnviando(false));
  }

  if (cargando) return <Cargando />;

  return (
    <div className="space-y-6">
      {error && <Aviso tono="error">{error}</Aviso>}
      <Aviso tono="info">
        La capacidad de la cocina (F19) = cocineros × raciones que prepara cada uno por hora × horas del turno. En «Plan del día» se compara con el pedido.
      </Aviso>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Tarjeta>
            <TituloSeccion titulo="Nuevo turno" />
            <form
              className="space-y-3"
              onSubmit={(e) =>
                enviar(e, (d) => CocinaApi.crearTurno({ nombreTurno: String(d.get("nombre") ?? "").trim(), horasDuracion: Number(d.get("horas")) }))
              }
            >
              <input name="nombre" required placeholder="Nombre, ej. Mañana" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
              <input name="horas" required type="number" min={0.5} step={0.5} placeholder="Horas de preparación, ej. 5" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
              <BotonPrimario type="submit" disabled={enviando}>
                <Plus className="w-4 h-4" /> Crear turno
              </BotonPrimario>
            </form>
          </Tarjeta>

          <Tarjeta>
            <TituloSeccion titulo="Registrar cocinero" />
            {turnos.length === 0 ? (
              <p className="text-xs" style={{ color: "#94A3B8" }}>Crea primero un turno.</p>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) =>
                  enviar(e, (d) =>
                    CocinaApi.registrarPersonal({
                      nombreCompleto: String(d.get("nombre") ?? "").trim(),
                      racionesPorHoraCapacidad: Number(d.get("capacidad")),
                      idTurno: Number(d.get("turno")),
                    })
                  )
                }
              >
                <input name="nombre" required placeholder="Nombre completo" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
                <input name="capacidad" required type="number" min={1} placeholder="Raciones que prepara por hora, ej. 50" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput} />
                <select name="turno" className={INPUT_CLASS} style={INPUT_STYLE} onFocus={focusInput} onBlur={blurInput}>
                  {turnos.map((t) => (
                    <option key={t.idTurno} value={t.idTurno}>Turno {t.nombreTurno}</option>
                  ))}
                </select>
                <BotonPrimario type="submit" disabled={enviando}>
                  <UserPlus className="w-4 h-4" /> Registrar
                </BotonPrimario>
              </form>
            )}
          </Tarjeta>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {turnos.length === 0 && (
            <Tarjeta>
              <p className="text-sm text-center py-6" style={{ color: "#94A3B8" }}>Todavía no hay turnos de cocina.</p>
            </Tarjeta>
          )}
          {turnos.map((t) => {
            const delTurno = personal.filter((p) => p.idTurno === t.idTurno);
            return (
              <Tarjeta key={t.idTurno}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5" style={{ color: "#1E3A8A" }} />
                    <div>
                      <p className="font-bold">Turno {t.nombreTurno}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>{t.horasDuracion} horas de preparación</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>{Math.round(t.capacidad)}</p>
                    <p className="text-[11px]" style={{ color: "#64748B" }}>raciones máx. (F19)</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {delTurno.length === 0 && <li className="text-xs" style={{ color: "#94A3B8" }}>Sin personal asignado.</li>}
                  {delTurno.map((p) => (
                    <li key={p.idPersonal} className="flex justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: "#F8FAFC" }}>
                      <span>{p.nombreCompleto}</span>
                      <span style={{ color: "#64748B" }}>{p.racionesPorHoraCapacidad} raciones/hora</span>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            );
          })}
        </div>
      </div>
    </div>
  );
}
