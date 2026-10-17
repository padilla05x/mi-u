// Comprueba que los colores reales de src/index.css son los de docs/diseno.md y que cumplen su contraste.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLORES_MATERIA } from './lib/colores.ts';

// Se leen del disco: en Vitest, importar un .css (incluso con ?raw) devuelve un texto vacío.
const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8');
const documento = leer('../docs/diseno.md');
const hojaDeEstilos = leer('./index.css');

type Modo = 'claro' | 'oscuro';
const MODOS: Modo[] = ['claro', 'oscuro'];

/** Filas de la primera tabla de una sección "## …", sin encabezado ni separador. */
function primeraTabla(titulo: string): string[][] {
  const seccion = documento.split(/^## /m).find((s) => s.startsWith(`${titulo}\n`));
  if (!seccion) throw new Error(`docs/diseno.md no tiene la sección "${titulo}"`);
  const lineas = seccion.split('\n');
  const tabla: string[] = [];
  for (let i = lineas.findIndex((l) => l.startsWith('|')); i >= 0 && lineas[i]?.startsWith('|'); i++) tabla.push(lineas[i]);
  return tabla.slice(2).map((l) => l.split('|').slice(1, -1).map((celda) => celda.trim().replaceAll('`', '')));
}

const numero = (texto: string) => Number(texto.replace(',', '.'));

const paleta = primeraTabla('Paleta de la interfaz').map(([token, , claro, oscuro]) => ({ token, claro, oscuro }));
const materias = primeraTabla('Colores de materia').map(([, clave, claro, oscuro, contrasteClaro, contrasteOscuro]) => ({
  clave,
  claro,
  oscuro,
  documentado: { claro: numero(contrasteClaro), oscuro: numero(contrasteOscuro) },
}));
const pares = primeraTabla('Pares de contraste').map(([elemento, color, sobre, minimo, claro, oscuro]) => ({
  elemento,
  color,
  sobre,
  minimo: numero(minimo),
  documentado: { claro: numero(claro), oscuro: numero(oscuro) },
}));

/** Colores `--color-*: light-dark(claro, oscuro)` de index.css, en mayúsculas, separados por modo. */
const colores = [...hojaDeEstilos.matchAll(/--color-([a-z-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\);/gi)];
const real: Record<Modo, Record<string, string>> = {
  claro: Object.fromEntries(colores.map(([, token, claro]) => [token, claro.toUpperCase()])),
  oscuro: Object.fromEntries(colores.map(([, token, , oscuro]) => [token, oscuro.toUpperCase()])),
};

const lineal = (canal: number) => (canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4);
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => lineal(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Contraste WCAG 2.x. */
function contraste(a: string, b: string): number {
  const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (clara + 0.05) / (oscura + 0.05);
}

function colorReal(modo: Modo, token: string): string {
  const valor = real[modo][token];
  if (!valor) throw new Error(`src/index.css no define --color-${token} en modo ${modo}`);
  return valor;
}

describe('docs/diseno.md frente a src/index.css', () => {
  it('el documento tiene las tablas que revisa esta prueba', () => {
    expect(paleta).toHaveLength(26);
    expect(pares.length).toBeGreaterThanOrEqual(20);
    expect(materias).toHaveLength(8);
  });

  it.each(MODOS)('en modo %s, index.css define exactamente los colores del documento', (modo) => {
    const esperado = Object.fromEntries([
      ...paleta.map((p) => [p.token, p[modo].toUpperCase()]),
      ...materias.map((m) => [`materia-${m.clave}`, m[modo].toUpperCase()]),
    ]);
    expect(real[modo]).toEqual(esperado);
  });

  it('los colores de materia están en el mismo orden que usa la app', () => {
    expect(materias.map((m) => m.clave)).toEqual([...COLORES_MATERIA]);
  });

  it.each(pares)('$elemento: $color sobre $sobre llega a $minimo:1 y la cifra escrita es la real', ({ color, sobre, minimo, documentado }) => {
    for (const modo of MODOS) {
      const valor = contraste(colorReal(modo, color), colorReal(modo, sobre));
      expect(valor, `modo ${modo}`).toBeGreaterThanOrEqual(minimo);
      expect(valor.toFixed(2), `modo ${modo}`).toBe(documentado[modo].toFixed(2));
    }
  });

  it.each(materias)('el color de materia $clave llega a 3:1 sobre la tarjeta y la cifra escrita es la real', ({ clave, documentado }) => {
    for (const modo of MODOS) {
      const valor = contraste(colorReal(modo, `materia-${clave}`), colorReal(modo, 'tarjeta'));
      expect(valor, `modo ${modo}`).toBeGreaterThanOrEqual(3);
      expect(valor.toFixed(2), `modo ${modo}`).toBe(documentado[modo].toFixed(2));
    }
  });
});
