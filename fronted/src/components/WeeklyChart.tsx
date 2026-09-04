const data = [
  { dia: "Lunes", planificado: 720, servido: 698 },
  { dia: "Martes", planificado: 715, servido: 710 },
  { dia: "Miércoles", planificado: 725, servido: 718 },
  { dia: "Jueves", planificado: 718, servido: 695 },
  { dia: "Viernes", planificado: 710, servido: 703 },
];

const MIN = 650;
const MAX = 740;
const CHART_H = 200;
const BAR_W = 22;
const GAP = 6;
const GROUP_GAP = 28;

function toY(value: number) {
  return CHART_H - ((value - MIN) / (MAX - MIN)) * CHART_H;
}

function toH(value: number) {
  return ((value - MIN) / (MAX - MIN)) * CHART_H;
}

const yTicks = [650, 670, 690, 710, 730, 750];

export default function WeeklyChart() {
  const groupW = BAR_W * 2 + GAP;
  const totalW = data.length * (groupW + GROUP_GAP) - GROUP_GAP;
  const svgW = totalW + 48; // left margin for y-axis labels
  const LEFT = 44;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div style={{ borderBottom: "1px solid #F1F5F9" }} className="px-6 py-4 flex items-center gap-2">
        <div style={{ backgroundColor: "#FFF3E0" }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div>
          <h2 style={{ color: "#1F4E78" }} className="text-sm font-bold">Comparativo Semanal</h2>
          <p className="text-xs text-slate-400">Planificado vs. Servido Real · Semana actual</p>
        </div>
      </div>

      <div className="px-6 pt-4 pb-2">
        {/* Legend */}
        <div className="flex items-center gap-5 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span style={{ backgroundColor: "#1F4E78" }} className="w-3 h-3 rounded-sm flex-shrink-0" />
            Planificado
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span style={{ backgroundColor: "#D84315" }} className="w-3 h-3 rounded-sm flex-shrink-0" />
            Servido Real
          </span>
        </div>

        {/* SVG chart */}
        <div className="overflow-x-auto">
          <svg
            width={svgW + LEFT}
            height={CHART_H + 32}
            style={{ fontFamily: "Inter, sans-serif", display: "block" }}
          >
            {/* Y-axis grid lines + labels */}
            {yTicks.map((tick) => {
              const y = toY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={LEFT}
                    x2={LEFT + totalW}
                    y1={y}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth={1}
                  />
                  <text
                    x={LEFT - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="#94A3B8"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((d, i) => {
              const groupX = LEFT + i * (groupW + GROUP_GAP);
              const ph = toH(d.planificado);
              const sh = toH(d.servido);
              const centerX = groupX + groupW / 2;

              return (
                <g key={d.dia}>
                  {/* Planificado bar */}
                  <rect
                    x={groupX}
                    y={toY(d.planificado)}
                    width={BAR_W}
                    height={ph}
                    fill="#1F4E78"
                    rx={3}
                    ry={3}
                  />
                  {/* Servido bar */}
                  <rect
                    x={groupX + BAR_W + GAP}
                    y={toY(d.servido)}
                    width={BAR_W}
                    height={sh}
                    fill="#D84315"
                    rx={3}
                    ry={3}
                  />
                  {/* Day label */}
                  <text
                    x={centerX}
                    y={CHART_H + 18}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#94A3B8"
                  >
                    {d.dia}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-50">
          {data.map((d) => {
            const diff = d.planificado - d.servido;
            return (
              <div key={d.dia} className="text-center">
                <div style={{ color: diff > 15 ? "#D84315" : "#2E7D32", fontFamily: "Inter, sans-serif" }} className="text-xs font-bold">
                  {diff > 0 ? `−${diff}` : `+${Math.abs(diff)}`}
                </div>
                <div className="text-xs text-slate-400">diferencia</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
