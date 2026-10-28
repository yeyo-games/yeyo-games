import { supabase } from './supabase';

export type Resultado = { ok: true } | { ok: false; motivo: 'datos' | 'sin-servicio' };

// Cuentas del hub. Todavía no hay dónde guardarlas: sin Supabase configurado se responde
// `sin-servicio` y la cara del cubo lo muestra. Cuando exista la tabla de cuentas, la llamada va aquí.
function validar(nombre: string, pin: string): Resultado | null {
  if (!nombre.trim() || !/^\d{4}$/.test(pin)) return { ok: false, motivo: 'datos' };
  if (!supabase) return { ok: false, motivo: 'sin-servicio' };
  return null;
}

export async function crearCuenta(nombre: string, pin: string): Promise<Resultado> {
  return validar(nombre, pin) ?? { ok: false, motivo: 'sin-servicio' };
}

export async function entrar(nombre: string, pin: string): Promise<Resultado> {
  return validar(nombre, pin) ?? { ok: false, motivo: 'sin-servicio' };
}
