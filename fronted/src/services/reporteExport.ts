// ============================================================================
// Exportación de Reportes y KPIs a Excel y PDF.
// El backend no expone un endpoint de exportación, así que el archivo se
// genera en el navegador a partir de los datos ya cargados en la vista.
// ============================================================================
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface DistribucionCurso {
  name: string;
  value: number;
}

export interface PuntoTendenciaExport {
  day: string;
  efficiency: number;
}

export interface ReporteExportData {
  generadoEn: Date;
  ahorroAcumulado: number;
  eficienciaPresupuestal: number;
  racionesSemana: number;
  totalRaciones: number;
  desperdicioTotal: number;
  eficienciaEntrega: number;
  costoUnitario: number;
  donutData: DistribucionCurso[];
  tendencia: PuntoTendenciaExport[];
  errorAbsolutoMedio: number;
  diasConDatosPronostico: number;
}

interface FilaResumen {
  Indicador: string;
  Valor: string;
}

interface FilaDistribucion {
  Curso: string;
  "Raciones Servidas": number;
  "% del Total": string;
}

function formatoMoneda(valor: number): string {
  return `$ ${Math.round(valor).toLocaleString("es-CO")}`;
}

function formatoPorcentaje(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

// jspdf-autotable asigna `lastAutoTable` a la instancia de jsPDF en tiempo
// de ejecución, pero sus tipos publicados no lo declaran — se documenta
// aquí en vez de usar `any`.
interface JsPdfConTablaFinal extends jsPDF {
  lastAutoTable: { finalY: number };
}

function finalYDeUltimaTabla(doc: jsPDF): number {
  return (doc as JsPdfConTablaFinal).lastAutoTable.finalY;
}

function nombreArchivo(fecha: Date, extension: string): string {
  const iso = fecha.toISOString().slice(0, 10);
  return `reporte-pae-${iso}.${extension}`;
}

function construirFilasResumen(datos: ReporteExportData): FilaResumen[] {
  return [
    { Indicador: "Ahorro Acumulado (mes)", Valor: formatoMoneda(datos.ahorroAcumulado) },
    { Indicador: "Eficiencia Presupuestal", Valor: formatoPorcentaje(datos.eficienciaPresupuestal) },
    { Indicador: "Raciones Servidas (semana)", Valor: datos.racionesSemana.toLocaleString("es-CO") },
    { Indicador: "Total Raciones", Valor: datos.totalRaciones.toLocaleString("es-CO") },
    { Indicador: "Desperdicio (raciones)", Valor: datos.desperdicioTotal.toLocaleString("es-CO") },
    { Indicador: "Eficiencia de Entrega", Valor: formatoPorcentaje(datos.eficienciaEntrega) },
    { Indicador: "Costo Unitario por Ración", Valor: formatoMoneda(datos.costoUnitario) },
    {
      Indicador: "Error Absoluto Medio del Pronóstico (MAE)",
      Valor:
        datos.diasConDatosPronostico > 0
          ? `${datos.errorAbsolutoMedio.toFixed(1)} raciones/día (${datos.diasConDatosPronostico} días)`
          : "Sin datos suficientes",
    },
  ];
}

function construirFilasDistribucion(donutData: DistribucionCurso[], total: number): FilaDistribucion[] {
  return donutData.map(function convertirFila(slice: DistribucionCurso): FilaDistribucion {
    const porcentaje = total > 0 ? (slice.value / total) * 100 : 0;
    return {
      Curso: slice.name,
      "Raciones Servidas": slice.value,
      "% del Total": `${porcentaje.toFixed(1)}%`,
    };
  });
}

function construirFilasTendencia(tendencia: PuntoTendenciaExport[]): { Día: string; "Eficiencia (%)": number }[] {
  return tendencia.map((punto) => ({ Día: punto.day, "Eficiencia (%)": Number(punto.efficiency.toFixed(1)) }));
}

export function exportarReporteExcel(datos: ReporteExportData): void {
  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(construirFilasResumen(datos)), "Resumen");
  XLSX.utils.book_append_sheet(
    libro,
    XLSX.utils.json_to_sheet(construirFilasDistribucion(datos.donutData, datos.totalRaciones)),
    "Distribucion por Curso"
  );
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(construirFilasTendencia(datos.tendencia)), "Tendencia");

  XLSX.writeFile(libro, nombreArchivo(datos.generadoEn, "xlsx"));
}

export function exportarReportePdf(datos: ReporteExportData): void {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte PAE — I.E.M. Ciudad Ebenezer", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${datos.generadoEn.toLocaleString("es-CO")}`, 14, 25);

  const filasResumen = construirFilasResumen(datos);
  autoTable(doc, {
    startY: 32,
    head: [["Indicador", "Valor"]],
    body: filasResumen.map((fila) => [fila.Indicador, fila.Valor]),
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138] },
  });

  const filasDistribucion = construirFilasDistribucion(datos.donutData, datos.totalRaciones);
  autoTable(doc, {
    startY: finalYDeUltimaTabla(doc) + 10,
    head: [["Curso", "Raciones Servidas", "% del Total"]],
    body: filasDistribucion.map((fila) => [fila.Curso, fila["Raciones Servidas"], fila["% del Total"]]),
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138] },
  });

  doc.save(nombreArchivo(datos.generadoEn, "pdf"));
}
