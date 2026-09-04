import { LayoutDashboard, CalendarDays, PackageSearch, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "../utils";

export type TabType = "dashboard" | "planificacion" | "inventario" | "reportes";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "planificacion", label: "Planificación", icon: CalendarDays },
  { id: "inventario", label: "Inventario", icon: PackageSearch },
  { id: "reportes", label: "Reportes & KPIs", icon: BarChart3 },
] as const;

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col justify-between"
      style={{ backgroundColor: "#0F172A" }}
    >
      {/* Brand */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)" }}
            >
              <span className="text-white font-bold text-xs tracking-tight">PAE</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Ciudad Ebenezer</h1>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#64748B" }}>
                I.E.M. Logística
              </p>
            </div>
          </div>
        </div>

        <nav className="p-3 mt-2 flex flex-col gap-0.5">
          <p
            className="text-[10px] font-bold tracking-widest uppercase px-3 mb-3"
            style={{ color: "#475569" }}
          >
            Principal
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                  isActive
                    ? "text-white"
                    : "hover:bg-white/5"
                )}
                style={isActive ? { backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#93C5FD" } : { color: "#94A3B8" }}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ backgroundColor: "#3B82F6" }}
                  />
                )}
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? "#3B82F6" : "#475569" }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 flex flex-col gap-0.5">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
          style={{ color: "#64748B" }}
        >
          <Settings className="w-4 h-4" style={{ color: "#475569" }} />
          Configuración
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-red-500/10"
          style={{ color: "#64748B" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
