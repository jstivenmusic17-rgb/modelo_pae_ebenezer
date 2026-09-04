import { type FormEvent, type JSX, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2, Package, Pencil, Plus, Search, ShoppingCart } from "lucide-react";

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
import { ApiError, InsumoApi, type Insumo, type MovimientoInsumo, type ValorCalculado } from "../services/api.ts";

// El backend no expone categoría ni ícono por insumo: se infieren a partir
// del nombre para conservar la presentación visual original de las tarjetas.
interface InsumoMeta {
  category: string;
  icon: string;
}

interface PalabraClaveMeta extends InsumoMeta {
  match: RegExp;
}

const META_POR_PALABRA_CLAVE: PalabraClaveMeta[] = [
  { match: /arroz/i, category: "Granos", icon: "🌾" },
  { match: /leche|l[aá]cteo|queso|yogur/i, category: "Lácteos", icon: "🥛" },
  { match: /pollo|pechuga|carne|cerdo|res/i, category: "Proteína", icon: "🍗" },
  { match: /verdura|vegetal|zanahoria|espinaca/i, category: "Vegetales", icon: "🥦" },
  { match: /aceite/i, category: "Abarrotes", icon: "🫙" },
  { match: /frijol|lenteja|legumbre/i, category: "Legumbres", icon: "🫘" },
  { match: /fruta|mora|pl[aá]tano|naranja/i, category: "Frutas", icon: "🍎" },
  { match: /pan|harina|pasta/i, category: "Panadería", icon: "🍞" },
];

const META_POR_DEFECTO: InsumoMeta = { category: "Insumo General", icon: "📦" };

function metaDeInsumo(nombre: string): InsumoMeta {
  const encontrado = META_POR_PALABRA_CLAVE.find((entrada) => entrada.match.test(nombre));
  return encontrado ?? META_POR_DEFECTO;
}

interface InsumoConStock extends Insumo {
  stockActual: number;
  puntoReordenKg: number;
  icon: string;
  category: string;
}

function enriquecerInsumo(insumo: Insumo): Promise<InsumoConStock> {
  const meta = metaDeInsumo(insumo.nombreInsumo);
  const movimientosPromesa = InsumoApi.listarMovimientos(insumo.idInsumo).catch(
    (): MovimientoInsumo[] => []
  );
  const puntoReordenPromesa = InsumoApi.puntoReorden(insumo.idInsumo).catch((): ValorCalculado | null => null);

  return Promise.all([movimientosPromesa, puntoReordenPromesa]).then(function combinar([
    movimientos,
    puntoReorden,
  ]): InsumoConStock {
    const ultimoMovimiento = movimientos.length > 0 ? movimientos[movimientos.length - 1] : null;
    return {
      ...insumo,
      stockActual: ultimoMovimiento ? ultimoMovimiento.stockFinalKg : insumo.stockInicialConfigurado,
      puntoReordenKg: puntoReorden?.valor ?? insumo.stockReserva,
      icon: meta.icon,
      category: meta.category,
    };
  });
}

function cargarInsumosConStock(): Promise<InsumoConStock[]> {
  return InsumoApi.listar().then(function enriquecerTodos(base: Insumo[]): Promise<InsumoConStock[]> {
    return Promise.all(base.map(enriquecerInsumo));
  });
}

function porcentajeDeMaximo(insumo: InsumoConStock): number {
  const maximo = insumo.stockInicialConfigurado || insumo.stockActual || 1;
  return Math.min(100, (insumo.stockActual / maximo) * 100);
}

function estaBajoDeStock(insumo: InsumoConStock): boolean {
  return insumo.stockActual <= insumo.puntoReordenKg;
}

export default function InventarioView(): JSX.Element {
  const [search, setSearch] = useState("");
  const [insumos, setInsumos] = useState<InsumoConStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insumoParaSolicitar, setInsumoParaSolicitar] = useState<InsumoConStock | null>(null);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [mostrarNuevoInsumo, setMostrarNuevoInsumo] = useState(false);
  const [enviandoInsumo, setEnviandoInsumo] = useState(false);
  const [insumoParaEditar, setInsumoParaEditar] = useState<InsumoConStock | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [confirmarEliminarInsumo, setConfirmarEliminarInsumo] = useState(false);
  const [eliminandoInsumo, setEliminandoInsumo] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarInventario = useCallback(function cargarInventarioImpl(): Promise<void> {
    setCargando(true);
    setError(null);
    return cargarInsumosConStock()
      .then(setInsumos)
      .catch(function manejarErrorDeCarga(err: unknown): void {
        setError(err instanceof ApiError ? err.message : "No fue posible cargar el inventario.");
      })
      .finally(function detenerCarga(): void {
        setCargando(false);
      });
  }, []);

  useEffect(
    function cargarAlMontar() {
      cargarInventario();
    },
    [cargarInventario]
  );

  const filtered = useMemo(
    () => insumos.filter((s) => s.nombreInsumo.toLowerCase().includes(search.toLowerCase())),
    [insumos, search]
  );

  const lowStockCount = insumos.filter(estaBajoDeStock).length;

  function abrirSolicitud(insumo: InsumoConStock): void {
    setErrorModal(null);
    setInsumoParaSolicitar(insumo);
  }

  function abrirNuevoInsumo(): void {
    setErrorModal(null);
    setMostrarNuevoInsumo(true);
  }

  function handleSubmitSolicitud(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!insumoParaSolicitar) return;

    const formData = new FormData(e.currentTarget);
    const cantidadRecibidaKg = Number(formData.get("cantidad"));
    const fecha = String(formData.get("fecha"));
    if (!Number.isFinite(cantidadRecibidaKg) || cantidadRecibidaKg < 0) {
      setErrorModal("Ingresa una cantidad válida (0 o mayor).");
      return;
    }

    setEnviandoSolicitud(true);
    setErrorModal(null);
    InsumoApi.registrarMovimiento(insumoParaSolicitar.idInsumo, { fecha, cantidadRecibidaKg })
      .then(function alRegistrar(): Promise<void> {
        setInsumoParaSolicitar(null);
        return cargarInventario();
      })
      .catch(function manejarErrorDeSolicitud(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible registrar el movimiento.");
      })
      .finally(function detenerSolicitud(): void {
        setEnviandoSolicitud(false);
      });
  }

  function handleSubmitNuevoInsumo(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombreInsumo = String(formData.get("nombreInsumo") ?? "").trim();
    const unidadMedida = String(formData.get("unidadMedida") ?? "").trim();
    const gramosPorRacion = Number(formData.get("gramosPorRacion"));
    const stockInicialConfigurado = Number(formData.get("stockInicialConfigurado"));
    const stockReserva = Number(formData.get("stockReserva"));
    const diasEntregaProveedor = Number(formData.get("diasEntregaProveedor"));

    if (!nombreInsumo || !unidadMedida || !Number.isFinite(gramosPorRacion) || gramosPorRacion <= 0) {
      setErrorModal("Completa nombre, unidad y gramos por ración (mayor a 0).");
      return;
    }

    setEnviandoInsumo(true);
    setErrorModal(null);
    InsumoApi.crear({
      nombreInsumo,
      unidadMedida,
      gramosPorRacion,
      stockInicialConfigurado,
      stockReserva,
      diasEntregaProveedor,
    })
      .then(function alCrear(): Promise<void> {
        setMostrarNuevoInsumo(false);
        return cargarInventario();
      })
      .catch(function manejarErrorDeCreacion(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible crear el insumo.");
      })
      .finally(function detenerCreacion(): void {
        setEnviandoInsumo(false);
      });
  }

  function abrirEditar(insumo: InsumoConStock): void {
    setErrorModal(null);
    setConfirmarEliminarInsumo(false);
    setInsumoParaEditar(insumo);
  }

  function handleSubmitEditarInsumo(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!insumoParaEditar) return;

    const formData = new FormData(e.currentTarget);
    const nombreInsumo = String(formData.get("nombreInsumo") ?? "").trim();
    const unidadMedida = String(formData.get("unidadMedida") ?? "").trim();
    const gramosPorRacion = Number(formData.get("gramosPorRacion"));
    const stockInicialConfigurado = Number(formData.get("stockInicialConfigurado"));
    const stockReserva = Number(formData.get("stockReserva"));
    const diasEntregaProveedor = Number(formData.get("diasEntregaProveedor"));

    if (!nombreInsumo || !unidadMedida || !Number.isFinite(gramosPorRacion) || gramosPorRacion <= 0) {
      setErrorModal("Completa nombre, unidad y gramos por ración (mayor a 0).");
      return;
    }

    setGuardandoEdicion(true);
    setErrorModal(null);
    InsumoApi.actualizar(insumoParaEditar.idInsumo, {
      nombreInsumo,
      unidadMedida,
      gramosPorRacion,
      stockInicialConfigurado,
      stockReserva,
      diasEntregaProveedor,
    })
      .then(function alGuardar(): Promise<void> {
        setInsumoParaEditar(null);
        return cargarInventario();
      })
      .catch(function manejarErrorDeEdicion(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible guardar los cambios.");
      })
      .finally(function detenerEdicion(): void {
        setGuardandoEdicion(false);
      });
  }

  function handleEliminarInsumo(): void {
    if (!insumoParaEditar) return;
    if (!confirmarEliminarInsumo) {
      setConfirmarEliminarInsumo(true);
      return;
    }

    setEliminandoInsumo(true);
    setErrorModal(null);
    InsumoApi.eliminar(insumoParaEditar.idInsumo)
      .then(function alEliminar(): Promise<void> {
        setInsumoParaEditar(null);
        setConfirmarEliminarInsumo(false);
        return cargarInventario();
      })
      .catch(function manejarErrorDeEliminacion(err: unknown): void {
        setErrorModal(err instanceof ApiError ? err.message : "No fue posible eliminar el insumo.");
        setConfirmarEliminarInsumo(false);
      })
      .finally(function detenerEliminacion(): void {
        setEliminandoInsumo(false);
      });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "#0F172A" }}>
            <Package className="w-5 h-5" style={{ color: "#1E3A8A" }} />
            Inventario de Insumos
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
            Control de stock y alertas de reabastecimiento
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#FFF7ED", color: "#EA580C", border: "1px solid #FDBA74" }}
            >
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#F97316" }} />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ backgroundColor: "#F97316" }} />
              </span>
              {lowStockCount} alerta{lowStockCount > 1 ? "s" : ""} de reabastecimiento
            </span>
          )}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none transition-all w-52"
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                color: "#0F172A",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <button
            onClick={abrirNuevoInsumo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:shadow-sm active:scale-95 flex-shrink-0"
            style={{ backgroundColor: "#EFF6FF", color: "#1E3A8A" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Insumo
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

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: "#94A3B8" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando inventario...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {insumos.slice(0, 6).map((item, i) => {
              const isLow = estaBajoDeStock(item);
              const pct = porcentajeDeMaximo(item);
              return (
                <motion.div
                  key={item.idInsumo}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-4 rounded-2xl transition-all duration-200 hover:shadow-md"
                  style={
                    isLow
                      ? { backgroundColor: "#FFF7ED", border: "1px solid #FDBA74" }
                      : { backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }
                  }
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-lg">{item.icon}</span>
                      <p className="font-bold text-sm mt-1" style={{ color: "#0F172A" }}>{item.nombreInsumo}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                        {item.category}
                      </p>
                    </div>
                    {isLow && <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: "#F97316" }} />}
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: "#64748B" }}>Stock actual</span>
                      <span className="font-bold" style={{ color: isLow ? "#EA580C" : "#059669" }}>
                        {item.stockActual.toLocaleString("es-CO", { maximumFractionDigits: 1 })} {item.unidadMedida}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 + 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: isLow ? "#F97316" : "#10B981" }}
                      />
                    </div>
                    <p className="text-[10px] mt-1 text-right font-medium" style={{ color: "#94A3B8" }}>
                      {Math.round(pct)}% del máximo
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {insumos.length === 0 && (
              <div className="col-span-2 md:col-span-3 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                No hay insumos registrados.
              </div>
            )}
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}
          >
            <div className="px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>Detalle de Inventario</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Insumo", "Categoría", "Stock", "% Restante", "Estado", "Acción"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#94A3B8" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const isLow = estaBajoDeStock(item);
                    const pct = Math.round(porcentajeDeMaximo(item));
                    return (
                      <tr
                        key={item.idInsumo}
                        className="transition-colors duration-150 group"
                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span className="font-semibold text-xs" style={{ color: "#0F172A" }}>{item.nombreInsumo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#64748B" }}>{item.category}</td>
                        <td className="px-5 py-3 text-xs font-medium" style={{ color: "#0F172A" }}>
                          {item.stockActual.toLocaleString("es-CO", { maximumFractionDigits: 1 })}{" "}
                          <span style={{ color: "#94A3B8" }}>{item.unidadMedida}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0", maxWidth: 60 }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: isLow ? "#F97316" : "#10B981" }}
                              />
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: isLow ? "#EA580C" : "#059669" }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {isLow ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: "#FFF7ED", color: "#EA580C" }}
                            >
                              <span className="relative flex w-1.5 h-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#F97316" }} />
                                <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ backgroundColor: "#F97316" }} />
                              </span>
                              Reabastecer
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10B981" }} />
                              Óptimo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => abrirSolicitud(item)}
                              className="flex items-center gap-1 text-[10px] font-bold"
                              style={{ color: "#1E3A8A" }}
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Solicitar <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={() => abrirEditar(item)}
                              className="flex items-center gap-1 text-[10px] font-bold"
                              style={{ color: "#64748B" }}
                            >
                              <Pencil className="w-3 h-3" />
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                        No se encontraron insumos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {mostrarNuevoInsumo && (
        <Modal
          title="Nuevo Insumo"
          description="Se agrega al inventario con estas condiciones iniciales."
          onClose={() => setMostrarNuevoInsumo(false)}
        >
          <form onSubmit={handleSubmitNuevoInsumo} className="flex flex-col gap-4">
            <FormField label="Nombre del insumo">
              <input
                name="nombreInsumo"
                required
                autoFocus
                placeholder="Ej. Arroz Blanco"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Unidad de medida">
                <select
                  name="unidadMedida"
                  required
                  defaultValue=""
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                >
                  <option value="" disabled>Selecciona...</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="unidad">unidad</option>
                  <option value="litro">litro</option>
                </select>
              </FormField>
              <FormField label="Gramos por ración">
                <input
                  name="gramosPorRacion"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="80"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Stock inicial">
                <input
                  name="stockInicialConfigurado"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  placeholder="100"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </FormField>
              <FormField label="Stock de reserva">
                <input
                  name="stockReserva"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  placeholder="20"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </FormField>
            </div>
            <FormField label="Días de entrega del proveedor">
              <input
                name="diasEntregaProveedor"
                type="number"
                min="1"
                step="1"
                required
                placeholder="3"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && (
              <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>
            )}
            <SubmitButton submitting={enviandoInsumo} submittingLabel="Creando..." label="Crear Insumo" />
          </form>
        </Modal>
      )}

      {insumoParaSolicitar && (
        <Modal
          title={`Solicitar ${insumoParaSolicitar.nombreInsumo}`}
          description="Registra el ingreso de un nuevo pedido a inventario."
          onClose={() => setInsumoParaSolicitar(null)}
        >
          <form onSubmit={handleSubmitSolicitud} className="flex flex-col gap-4">
            <FormField label={`Cantidad recibida (${insumoParaSolicitar.unidadMedida})`}>
              <input
                name="cantidad"
                type="number"
                min="0"
                step="0.1"
                required
                autoFocus
                defaultValue={50}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <FormField label="Fecha">
              <input
                name="fecha"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && (
              <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>
            )}
            <SubmitButton submitting={enviandoSolicitud} submittingLabel="Registrando..." label="Registrar Ingreso" />
          </form>
        </Modal>
      )}

      {insumoParaEditar && (
        <Modal
          title={`Editar ${insumoParaEditar.nombreInsumo}`}
          description="Ajusta la configuración base del insumo."
          onClose={() => setInsumoParaEditar(null)}
        >
          <form onSubmit={handleSubmitEditarInsumo} className="flex flex-col gap-4">
            <FormField label="Nombre del insumo">
              <input
                name="nombreInsumo"
                required
                autoFocus
                defaultValue={insumoParaEditar.nombreInsumo}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Unidad de medida">
                <select
                  name="unidadMedida"
                  required
                  defaultValue={insumoParaEditar.unidadMedida}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="unidad">unidad</option>
                  <option value="litro">litro</option>
                </select>
              </FormField>
              <FormField label="Gramos por ración">
                <input
                  name="gramosPorRacion"
                  type="number"
                  min="1"
                  step="1"
                  required
                  defaultValue={insumoParaEditar.gramosPorRacion}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Stock inicial">
                <input
                  name="stockInicialConfigurado"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  defaultValue={insumoParaEditar.stockInicialConfigurado}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </FormField>
              <FormField label="Stock de reserva">
                <input
                  name="stockReserva"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  defaultValue={insumoParaEditar.stockReserva}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </FormField>
            </div>
            <FormField label="Días de entrega del proveedor">
              <input
                name="diasEntregaProveedor"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={insumoParaEditar.diasEntregaProveedor}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </FormField>
            {errorModal && (
              <p className="text-xs font-semibold" style={{ color: "#B91C1C" }}>{errorModal}</p>
            )}
            <SubmitButton submitting={guardandoEdicion} submittingLabel="Guardando..." label="Guardar Cambios" />
            <DangerZone
              label="Eliminar Insumo"
              confirming={confirmarEliminarInsumo}
              deleting={eliminandoInsumo}
              onRequestConfirm={() => setConfirmarEliminarInsumo(true)}
              onCancel={() => setConfirmarEliminarInsumo(false)}
              onConfirm={handleEliminarInsumo}
            />
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
