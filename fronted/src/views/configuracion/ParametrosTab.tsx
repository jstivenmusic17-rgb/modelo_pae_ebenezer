import { useEffect, useState, type JSX } from "react";
import { Save } from "lucide-react";
import { INPUT_CLASS, INPUT_STYLE, blurInput, focusInput } from "../../components/FormField";
import { Aviso, BotonPrimario, Cargando, Tarjeta, TituloSeccion } from "../../components/Ui";
import { ParametrosApi, type ParametrosModelo } from "../../services/api";
import { cargarParametros, mensajeDeError } from "../../lib/datos";
import { calcularPedido, formatoCOP, formatoPorcentaje } from "../../lib/modelo";

type Campo = keyof ParametrosModelo;

// Los porcentajes se editan como 0–100 y se guardan como fracción
const CAMPOS: { campo: Campo; etiqueta: string; ayuda: string; unidad: "COP" | "%" }[] = [
  { campo: "costoProduccionUnitario", etiqueta: "Costo de producir una ración", ayuda: "Lo que cuesta preparar cada ración. Se usa para el costo diario (F5).", unidad: "COP" },
  { campo: "costoFaltanteUnitario", etiqueta: "Costo de que falte una ración", ayuda: "Lo que cuesta resolver con comida de urgencia a un estudiante que se queda sin ración (F7).", unidad: "COP" },
  { campo: "costoSobranteUnitario", etiqueta: "Costo de que sobre una ración", ayuda: "Lo que se pierde por cada ración preparada que no se sirve (F6).", unidad: "COP" },
  { campo: "tasaAsistenciaDefecto", etiqueta: "Asistencia esperada por defecto", ayuda: "Porcentaje de matriculados que se espera que coman. Se puede ajustar cada día en «Plan del día».", unidad: "%" },
  { campo: "coeficienteVariacion", etiqueta: "Variabilidad de la asistencia", ayuda: "Cuánto suele cambiar la asistencia de un día a otro. Más variabilidad significa un colchón de seguridad más grande.", unidad: "%" },
  { campo: "margenSeguridadReferencia", etiqueta: "Margen fijo de referencia (F2)", ayuda: "Solo para comparar: el pedido con un porcentaje fijo extra, como en la fórmula 2 del documento.", unidad: "%" },
];

export default function ParametrosTab(): JSX.Element {
  const [valores, setValores] = useState<Record<Campo, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarParametros()
      .then((p) => setValores(aFormulario(p)))
      .catch((e) => setError(mensajeDeError(e)));
  }, []);

  if (!valores) return error ? <Aviso tono="error">{error}</Aviso> : <Cargando />;

  const parametros = aParametros(valores);
  const vistaPrevia = parametros ? calcularPedido(455, parametros.tasaAsistenciaDefecto, parametros) : null;

  function guardar(): void {
    if (!parametros) return;
    setEnviando(true);
    setError(null);
    setGuardado(false);
    ParametrosApi.actualizar(parametros)
      .then((p) => {
        setValores(aFormulario(p));
        setGuardado(true);
      })
      .catch((e) => setError(mensajeDeError(e)))
      .finally(() => setEnviando(false));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Tarjeta className="lg:col-span-2">
        <TituloSeccion
          titulo="Parámetros del modelo de pedido"
          ayuda="El modelo compara lo que cuesta que falte una ración con lo que cuesta que sobre. Si faltar es más caro, pide un poco más de lo esperado."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {CAMPOS.map(({ campo, etiqueta, ayuda, unidad }) => (
            <label key={campo} className="block space-y-1.5">
              <span className="text-xs font-semibold" style={{ color: "#475569" }}>{etiqueta}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={valores[campo]}
                  onChange={(e) => {
                    setGuardado(false);
                    setValores({ ...valores, [campo]: e.target.value });
                  }}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                <span className="text-xs font-semibold w-10" style={{ color: "#64748B" }}>{unidad}</span>
              </div>
              <span className="block text-[11px] leading-snug" style={{ color: "#94A3B8" }}>{ayuda}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {error && <Aviso tono="error">{error}</Aviso>}
          {guardado && <Aviso tono="exito">Parámetros guardados. Los próximos planes usarán estos valores.</Aviso>}
          {!parametros && <Aviso tono="alerta">Revisa que todos los campos tengan un número válido.</Aviso>}
          <BotonPrimario onClick={guardar} disabled={enviando || !parametros}>
            <Save className="w-4 h-4" /> {enviando ? "Guardando..." : "Guardar parámetros"}
          </BotonPrimario>
        </div>
      </Tarjeta>

      <Tarjeta className="h-fit">
        <TituloSeccion titulo="Vista previa" ayuda="Ejemplo con la matrícula del documento (455 estudiantes)." />
        {parametros && vistaPrevia ? (
          <div className="space-y-3 text-sm">
            <p>
              Con asistencia del <b>{formatoPorcentaje(parametros.tasaAsistenciaDefecto)}</b> se esperan <b>{vistaPrevia.demanda}</b> estudiantes.
            </p>
            <div className="rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)", color: "#FFFFFF" }}>
              <p className="text-3xl font-bold">{vistaPrevia.pedido}</p>
              <p className="text-xs opacity-80">raciones a pedir</p>
            </div>
            <p style={{ color: "#475569" }}>
              {vistaPrevia.pedido >= vistaPrevia.demanda
                ? `Se piden ${vistaPrevia.pedido - vistaPrevia.demanda} de más porque faltar cuesta ${formatoCOP(parametros.costoFaltanteUnitario)} y sobrar ${formatoCOP(parametros.costoSobranteUnitario)}.`
                : `Se piden ${vistaPrevia.demanda - vistaPrevia.pedido} de menos porque sobrar cuesta más que faltar.`}
            </p>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              Con margen fijo (F2) serían {Math.round(vistaPrevia.demanda * (1 + parametros.margenSeguridadReferencia))}.
            </p>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "#94A3B8" }}>Completa los campos para ver el resultado.</p>
        )}
      </Tarjeta>
    </div>
  );
}

function esPorcentaje(campo: Campo): boolean {
  return CAMPOS.find((c) => c.campo === campo)?.unidad === "%";
}

function aFormulario(p: ParametrosModelo): Record<Campo, string> {
  const r = {} as Record<Campo, string>;
  for (const { campo } of CAMPOS) {
    const v = p[campo];
    r[campo] = String(esPorcentaje(campo) ? Math.round(v * 1000) / 10 : v);
  }
  return r;
}

function aParametros(v: Record<Campo, string>): ParametrosModelo | null {
  const r = {} as ParametrosModelo;
  for (const { campo } of CAMPOS) {
    if (v[campo].trim() === "") return null;
    const n = Number(v[campo]);
    if (!Number.isFinite(n)) return null;
    r[campo] = esPorcentaje(campo) ? n / 100 : n;
  }
  return r;
}
