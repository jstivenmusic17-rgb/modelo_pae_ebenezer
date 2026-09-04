interface KpiCardProps {
  title: string;
  value: string;
  sub: string;
  subColor?: string;
  accentColor: string;
  icon: React.ReactNode;
  badge?: { label: string; color: string; bg: string };
}

function KpiCard({ title, value, sub, subColor, accentColor, icon, badge }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 relative overflow-hidden shadow-sm">
      <div
        style={{ backgroundColor: accentColor }}
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
      />
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
      <div>
        <div style={{ color: "#1F4E78", fontFamily: "Inter, sans-serif" }} className="text-3xl font-bold leading-none">
          {value}
        </div>
        {badge ? (
          <span
            style={{ color: badge.color, backgroundColor: badge.bg }}
            className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full"
          >
            {badge.label}
          </span>
        ) : (
          <p style={{ color: subColor ?? "#64748B" }} className="text-xs mt-1.5 font-medium">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function KpiCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiCard
        title="Cobertura PAE"
        value="92%"
        sub="+2% vs mes anterior"
        subColor="#2E7D32"
        accentColor="#2E75B6"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        }
      />
      <KpiCard
        title="Demanda Estimada Hoy"
        value="720"
        sub="Raciones · Jornada Mañana"
        accentColor="#1F4E78"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        }
      />
      <KpiCard
        title="Tasa de Desperdicio"
        value="2.1%"
        sub="Bajo control"
        accentColor="#2E7D32"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
        badge={{ label: "Bajo control", color: "#2E7D32", bg: "#E8F5E9" }}
      />
      <KpiCard
        title="Pedido Sugerido"
        value="725"
        sub="Incluye margen de seguridad"
        accentColor="#D84315"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
        }
      />
    </div>
  );
}
