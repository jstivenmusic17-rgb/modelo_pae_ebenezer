# Plan: Dashboard PAE – I.E.M. Ciudad Ebenezer

## Context

Build a full administrative dashboard for the PAE (Programa de Alimentación Escolar) school feeding program. The brief specifies exact colors, layout sections, KPIs, a forecast calculator, a weekly bar chart, and a course delivery table. The project is a blank React + Vite + Tailwind v4 scaffold.

## Aesthetic Stance

The brief overrides the create_make_theme suggestions — it explicitly names an institutional palette. We commit to:

- **Stance**: Clean institutional dashboard (no zine, no brutalism)
- **Fonts**: `IBM Plex Sans` (body/UI — clinical, legible in dense layouts) + `Inter` (numerics/labels). Both are Google Fonts; import via CSS @import in `src/index.css`.
- **Palette** (verbatim from brief):
  - `--primary: #1F4E78` (sidebar, buttons)
  - `--secondary: #2E75B6`
  - `--background: #F8FAFC`
  - `--card: #FFFFFF`
  - `--success: #2E7D32`
  - `--danger: #D84315`

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/index.css` | Add Google Fonts @import (IBM Plex Sans, Inter), define CSS custom properties |
| `src/App.tsx` | Replace stub with full dashboard shell (sidebar + header + main) |
| `src/components/Sidebar.tsx` | Navigation sidebar (240px, #1F4E78 bg) |
| `src/components/Header.tsx` | Top bar with title, dropdowns, avatar |
| `src/components/KpiCards.tsx` | 4-card KPI grid row |
| `src/components/AnalyticEngine.tsx` | Left column: forecast calculator form with reactive output |
| `src/components/WeeklyChart.tsx` | Right column: bar chart (recharts) — Planificado vs Servido Real |
| `src/components/CourseTable.tsx` | Bottom table: delivery status by grade |

Install `recharts` for the bar chart.

## Implementation Details

### src/index.css
```
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
@import 'tailwindcss';

/* Custom properties for color tokens */
:root {
  --color-primary: #1F4E78;
  --color-secondary: #2E75B6;
  --color-success: #2E7D32;
  --color-danger: #D84315;
}
```

### Layout (App.tsx)
```
<div class="flex h-screen bg-[#F8FAFC] font-[IBM_Plex_Sans]">
  <Sidebar />          {/* 240px fixed left */}
  <div class="flex-1 flex flex-col overflow-hidden">
    <Header />         {/* 80px */}
    <main class="flex-1 overflow-y-auto p-6">
      <KpiCards />     {/* 4-col grid */}
      <div class="grid grid-cols-2 gap-6 mt-6">
        <AnalyticEngine />
        <WeeklyChart />
      </div>
      <CourseTable class="mt-6" />
    </main>
  </div>
</div>
```

### KPI Cards
Each card: white bg, subtle border, rounded-xl, left accent bar in primary color.
- Cobertura PAE: 92% — +2% vs mes anterior
- Demanda Estimada Hoy: 720 Raciones — Jornada Mañana
- Tasa de Desperdicio: 2.1% — badge verde "Bajo control"
- Pedido Sugerido: 725 Raciones — incluye margen de seguridad

### Analytic Engine (AnalyticEngine.tsx)
- Controlled form with React useState
- Inputs: Matrícula Total (E=800), Asistencia % (a=90), Costo Unitario (COP 3200)
- Formula: pedido = Math.ceil(E * (a/100) * 1.007) — 0.7% safety margin
- Output box: bg `#E8F5E9`, text `#2E7D32`, shows "Pedido Recomendado: {N} Raciones"
- Primary button: `bg-[#1F4E78]` with calculator emoji

### Weekly Chart (WeeklyChart.tsx)
- `recharts` BarChart, responsive container
- Data: Mon-Fri with Planificado (#1F4E78) and Servido (#D84315) bars
- Sample data: realistic school week numbers ~700-730 planned, ~685-720 actual
- Legend with color squares

### Course Table (CourseTable.tsx)
- Columns: Curso | Matriculados | Asistencia % | Raciones Servidas | Sobrantes | Estado
- Status badge component: green "Completado", amber "Pendiente", red "Incompleto"
- Sample rows:
  - 6-1: 40, 95%, 38, 0, Completado
  - 6-2: 38, 89%, 34, 2, Completado
  - 7-1: 42, 90%, 38, 1, Completado
  - 7-2: 41, 85%, 35, 3, Completado
  - 8-1: 39, 92%, 36, 0, Completado
  - 8-2: 44, 78%, 34, 4, Pendiente

### Sidebar (Sidebar.tsx)
- bg `#1F4E78`, text white, 240px wide
- Header: shield/utensils icon + "PAE Ebenezer"
- Nav items with icons (emoji or heroicons-style inline SVG): Dashboard (active highlight `#2E75B6`), Planificación de Raciones, Inventario de Insumos, Reportes y KPIs
- Footer: "Coordinador PAE" role text + logout icon button

### Header (Header.tsx)
- bg white, border-b, 80px height
- Title: "Dashboard de Planificación y Control Logístico PAE" in `#1F4E78`
- Right side: two `<select>` dropdowns (Jornada, Fecha) + avatar circle + "I.E.M. Ciudad Ebenezer"

## Dependencies to Install

```
pnpm add recharts
```

## Verification

1. Open preview panel — sidebar visible on left, header spans top, 4 KPI cards below header
2. Type values in the Analytic Engine form and click "Calcular" — output updates reactively
3. Bar chart renders with both series visible and labeled
4. Table shows all rows with colored status badges
5. No TypeScript build errors (check console in preview)
