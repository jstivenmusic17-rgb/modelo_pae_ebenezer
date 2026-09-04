const courses = [
  { curso: "Grado 6-1", matriculados: 40, asistencia: 95, raciones: 38, sobrantes: 0, estado: "Completado" },
  { curso: "Grado 6-2", matriculados: 38, asistencia: 89, raciones: 34, sobrantes: 2, estado: "Completado" },
  { curso: "Grado 7-1", matriculados: 42, asistencia: 90, raciones: 38, sobrantes: 1, estado: "Completado" },
  { curso: "Grado 7-2", matriculados: 41, asistencia: 85, raciones: 35, sobrantes: 3, estado: "Completado" },
  { curso: "Grado 8-1", matriculados: 39, asistencia: 92, raciones: 36, sobrantes: 0, estado: "Completado" },
  { curso: "Grado 8-2", matriculados: 44, asistencia: 78, raciones: 34, sobrantes: 4, estado: "Pendiente" },
  { curso: "Grado 9-1", matriculados: 37, asistencia: 94, raciones: 35, sobrantes: 0, estado: "Completado" },
  { curso: "Grado 9-2", matriculados: 43, asistencia: 72, raciones: 30, sobrantes: 5, estado: "Incompleto" },
];

const badgeStyles: Record<string, { color: string; bg: string; dot: string }> = {
  Completado: { color: "#2E7D32", bg: "#E8F5E9", dot: "#4CAF50" },
  Pendiente: { color: "#B45309", bg: "#FEF3C7", dot: "#F59E0B" },
  Incompleto: { color: "#D84315", bg: "#FBE9E7", dot: "#EF5350" },
};

function StatusBadge({ estado }: { estado: string }) {
  const style = badgeStyles[estado] ?? badgeStyles["Pendiente"];
  return (
    <span
      style={{ color: style.color, backgroundColor: style.bg }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
    >
      <span
        style={{ backgroundColor: style.dot }}
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      />
      {estado}
    </span>
  );
}

function AsistenciaBar({ value }: { value: number }) {
  const color = value >= 90 ? "#2E7D32" : value >= 80 ? "#F59E0B" : "#D84315";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div style={{ width: `${value}%`, backgroundColor: color }} className="h-full rounded-full" />
      </div>
      <span style={{ fontFamily: "Inter, sans-serif", color }} className="text-xs font-semibold">
        {value}%
      </span>
    </div>
  );
}

export default function CourseTable() {
  const totals = courses.reduce(
    (acc, c) => ({ matriculados: acc.matriculados + c.matriculados, raciones: acc.raciones + c.raciones, sobrantes: acc.sobrantes + c.sobrantes }),
    { matriculados: 0, raciones: 0, sobrantes: 0 }
  );

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div style={{ borderBottom: "1px solid #F1F5F9" }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: "#EFF6FF" }} className="w-8 h-8 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E75B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div>
            <h2 style={{ color: "#1F4E78" }} className="text-sm font-bold">Estado de Entregas por Grado / Curso</h2>
            <p className="text-xs text-slate-400">Jornada Mañana · {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" /> {courses.filter(c => c.estado === "Completado").length} Completados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> {courses.filter(c => c.estado === "Pendiente").length} Pendientes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" /> {courses.filter(c => c.estado === "Incompleto").length} Incompletos
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              {["Curso", "Matriculados", "Asistencia", "Raciones Servidas", "Sobrantes", "Estado"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((row, i) => (
              <tr
                key={row.curso}
                style={{ borderBottom: i < courses.length - 1 ? "1px solid #F8FAFC" : "none" }}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-3 text-sm font-semibold text-slate-700">{row.curso}</td>
                <td className="px-6 py-3 text-sm text-slate-600 font-mono" style={{ fontFamily: "Inter, sans-serif" }}>{row.matriculados}</td>
                <td className="px-6 py-3"><AsistenciaBar value={row.asistencia} /></td>
                <td className="px-6 py-3 text-sm font-semibold text-slate-700" style={{ fontFamily: "Inter, sans-serif" }}>{row.raciones}</td>
                <td className="px-6 py-3">
                  <span
                    style={{ fontFamily: "Inter, sans-serif", color: row.sobrantes > 2 ? "#D84315" : "#64748B" }}
                    className="text-sm font-semibold"
                  >
                    {row.sobrantes}
                  </span>
                </td>
                <td className="px-6 py-3"><StatusBadge estado={row.estado} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#F0F7FF", borderTop: "2px solid #DBEAFE" }}>
              <td className="px-6 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide">Totales</td>
              <td className="px-6 py-3 text-sm font-bold" style={{ color: "#1F4E78", fontFamily: "Inter, sans-serif" }}>{totals.matriculados}</td>
              <td className="px-6 py-3 text-xs text-slate-400 font-medium">—</td>
              <td className="px-6 py-3 text-sm font-bold" style={{ color: "#1F4E78", fontFamily: "Inter, sans-serif" }}>{totals.raciones}</td>
              <td className="px-6 py-3 text-sm font-bold" style={{ color: totals.sobrantes > 5 ? "#D84315" : "#64748B", fontFamily: "Inter, sans-serif" }}>{totals.sobrantes}</td>
              <td className="px-6 py-3 text-xs text-slate-400 font-medium">8 grupos</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
