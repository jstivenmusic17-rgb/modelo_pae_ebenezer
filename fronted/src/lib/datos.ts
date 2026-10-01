// Cargas de datos que comparten varias vistas
import { CocinaApi, InsumoApi, ParametrosApi, type Insumo, type ParametrosModelo } from "../services/api";

export interface InsumoConStock extends Insumo {
  stockActualKg: number;
  puntoReordenKg: number | null;
}

// Stock actual = saldo del último movimiento registrado (F11), o el stock
// inicial configurado si aún no hay movimientos.
export function cargarInsumosConStock(): Promise<InsumoConStock[]> {
  return InsumoApi.listar().then((insumos) =>
    Promise.all(
      insumos.map((insumo) =>
        Promise.all([
          InsumoApi.listarMovimientos(insumo.idInsumo).catch(() => []),
          InsumoApi.puntoReorden(insumo.idInsumo).then((v) => v.valor).catch(() => null),
        ]).then(([movimientos, puntoReordenKg]) => {
          const ultimo = [...movimientos].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.idMovimiento - b.idMovimiento)).pop();
          return {
            ...insumo,
            stockActualKg: ultimo ? ultimo.stockFinalKg : insumo.stockInicialConfigurado,
            puntoReordenKg,
          };
        })
      )
    )
  );
}

export interface TurnoConCapacidad {
  idTurno: number;
  nombreTurno: string;
  horasDuracion: number;
  cocineros: number;
  capacidad: number;
}

export function cargarTurnosConCapacidad(): Promise<TurnoConCapacidad[]> {
  return CocinaApi.listarTurnos().then((turnos) =>
    Promise.all(
      turnos.map((t) =>
        Promise.all([
          CocinaApi.capacidadMaxima(t.idTurno).then((v) => v.valor).catch(() => 0),
          CocinaApi.listarPersonalPorTurno(t.idTurno).catch(() => []),
        ]).then(([capacidad, personal]) => ({ ...t, capacidad, cocineros: personal.length }))
      )
    )
  );
}

export function cargarParametros(): Promise<ParametrosModelo> {
  return ParametrosApi.obtener();
}

export function mensajeDeError(err: unknown): string {
  return err instanceof Error ? err.message : "Ocurrió un error inesperado.";
}
