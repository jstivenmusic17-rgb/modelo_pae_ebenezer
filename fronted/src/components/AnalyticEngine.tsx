import { useState } from "react";

export default function AnalyticEngine() {
  const [matricula, setMatricula] = useState(800);
  const [asistencia, setAsistencia] = useState(90);
  const [costoUnitario, setCostoUnitario] = useState(3200);
  const [result, setResult] = useState<number | null>(725);

  function calcular() {
    const pedido = Math.ceil(matricula * (asistencia / 100) * 1.007);
    setResult(pedido);
  }

  const costoTotal = result ? result * costoUnitario : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Title bar */}
      <div style={{ borderBottom: "1px solid #F1F5F9" }} className="px-6 py-4 flex items-center gap-2">
        <div style={{ backgroundColor: "#EFF6FF" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E75B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div>
          <h2 style={{ color: "#1F4E78" }} className="text-sm font-bold">Motor Analítico de Pronóstico</h2>
          <p className="text-xs text-slate-400">Cálculo de pedido óptimo con margen de seguridad</p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* Fields */}
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Matrícula Total (E)
            </span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
              <span className="px-3 py-2 bg-slate-50 text-slate-400 text-sm border-r border-slate-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </span>
              <input
                type="number"
                value={matricula}
                onChange={(e) => setMatricula(Number(e.target.value))}
                style={{ fontFamily: "Inter, sans-serif" }}
                className="flex-1 px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none"
                min={0}
              />
              <span className="px-3 py-2 text-xs text-slate-400">estudiantes</span>
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Asistencia Esperada (a %)
            </span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
              <span className="px-3 py-2 bg-slate-50 text-slate-400 text-sm border-r border-slate-200">%</span>
              <input
                type="number"
                value={asistencia}
                onChange={(e) => setAsistencia(Math.min(100, Number(e.target.value)))}
                style={{ fontFamily: "Inter, sans-serif" }}
                className="flex-1 px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none"
                min={0}
                max={100}
              />
              <span className="px-3 py-2 text-xs text-slate-400">% asistencia</span>
            </div>
            <div className="relative pt-1">
              <input
                type="range"
                min={0}
                max={100}
                value={asistencia}
                onChange={(e) => setAsistencia(Number(e.target.value))}
                style={{ accentColor: "#2E75B6" }}
                className="w-full h-1.5 rounded-full cursor-pointer"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Costo Unitario ($ COP)
            </span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
              <span className="px-3 py-2 bg-slate-50 text-slate-400 text-sm border-r border-slate-200">$</span>
              <input
                type="number"
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(Number(e.target.value))}
                style={{ fontFamily: "Inter, sans-serif" }}
                className="flex-1 px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none"
                min={0}
              />
              <span className="px-3 py-2 text-xs text-slate-400">COP/ración</span>
            </div>
          </label>
        </div>

        {/* Button */}
        <button
          onClick={calcular}
          style={{ backgroundColor: "#1F4E78" }}
          className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span>🧮</span>
          Calcular Pedido Óptimo
        </button>

        {/* Output */}
        {result !== null && (
          <div style={{ backgroundColor: "#E8F5E9", borderColor: "#A5D6A7" }} className="rounded-xl border p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ color: "#2E7D32" }} className="text-xs font-bold uppercase tracking-wide">Pedido Recomendado</span>
            </div>
            <div style={{ color: "#1B5E20", fontFamily: "Inter, sans-serif" }} className="text-2xl font-bold">
              {result.toLocaleString("es-CO")} <span className="text-base font-semibold">Raciones</span>
            </div>
            {costoTotal && (
              <div style={{ color: "#2E7D32" }} className="text-xs font-medium">
                Costo estimado total:{" "}
                <span style={{ fontFamily: "Inter, sans-serif" }} className="font-bold">
                  ${costoTotal.toLocaleString("es-CO")} COP
                </span>
              </div>
            )}
            <p className="text-xs text-green-700 mt-1 opacity-70">
              Incluye 0.7% de margen de seguridad sobre la demanda base.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
