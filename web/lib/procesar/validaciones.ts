/**
 * Las 8 validaciones — espejo de proyecto_madrina/validaciones/*.py.
 * Cada función recibe la lista de Clases y devuelve los Problemas encontrados.
 */
import * as cfg from "./config";
import type { Clase, Problema } from "./modelo";
import { esVirtual, horasRealesSemanales } from "./modelo";
import { minutosAHHMM } from "./normalizar";

/* ───────────── consolidación ───────────── */

export function validarConsolidacion(clasesTodas: Clase[]): Problema[] {
  const conteo = new Map<string, number>();
  for (const c of clasesTodas) {
    conteo.set(c.hoja, (conteo.get(c.hoja) ?? 0) + 1);
  }

  const consolidadas: Record<string, number> = {};
  const otras: Record<string, number> = {};
  for (const [hoja, n] of conteo) {
    if (cfg.HOJAS_CONSOLIDADAS.has(hoja)) consolidadas[hoja] = n;
    else otras[hoja] = n;
  }

  if (Object.keys(consolidadas).length === 0) return [];
  if (Object.keys(otras).length === 0) return [];

  const sumaOtras = Object.values(otras).reduce((a, b) => a + b, 0);
  const problemas: Problema[] = [];

  for (const [hoja, n] of Object.entries(consolidadas)) {
    if (n === sumaOtras) continue;
    problemas.push({
      tipo: "consolidacion_inconsistente",
      severidad: "alta",
      descripcion: `La hoja consolidada '${hoja}' tiene ${n} registros, pero la suma de las hojas por carrera (${Object.keys(otras).join(", ")}) suma ${sumaOtras}. Diferencia: ${n - sumaOtras >= 0 ? "+" : ""}${n - sumaOtras}.`,
      referencias: [{ hoja, fila: 0 }],
      extra: {
        hoja_consolidada: hoja,
        registros_consolidada: n,
        registros_otras: sumaOtras,
      },
    });
  }
  return problemas;
}

/* ───────────── duplicados ───────────── */

export function validarDuplicados(clases: Clase[]): Problema[] {
  const grupos = new Map<string, Clase[]>();
  for (const c of clases) {
    if (!c.catedratico || !c.codigo || !c.seccion) continue;
    const k = `${c.catedratico}|${c.codigo}|${c.seccion}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(c);
  }

  const problemas: Problema[] = [];
  for (const [, lista] of grupos) {
    if (lista.length < 2) continue;
    const p = lista[0];
    problemas.push({
      tipo: "duplicado",
      severidad: "alta",
      descripcion: `La sección ${p.seccion} de ${p.codigo} (${p.asignatura}) con el catedrático ${p.catedratico} aparece ${lista.length} veces.`,
      referencias: lista.map((c) => ({ hoja: c.hoja, fila: c.fila })),
      extra: {
        catedratico: p.catedratico,
        codigo: p.codigo,
        seccion: p.seccion,
        asignatura: p.asignatura,
      },
    });
  }
  return problemas;
}

/* ───────────── solapes (aula + catedrático) ───────────── */

function seSolapan(
  a: { inicio: number; fin: number },
  b: { inicio: number; fin: number },
): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

function firmaClase(c: Clase): string {
  return `${c.catedratico}|${c.codigo}|${c.seccion}`;
}

export function validarSolapes(clases: Clase[]): Problema[] {
  const problemas: Problema[] = [];

  // Solapes de aula
  const porAulaDia = new Map<string, { clase: Clase; inicio: number; fin: number }[]>();
  for (const c of clases) {
    if (esVirtual(c) || !c.aula) continue;
    for (const b of c.bloques) {
      const k = `${c.aula}|${b.dia}`;
      if (!porAulaDia.has(k)) porAulaDia.set(k, []);
      porAulaDia.get(k)!.push({ clase: c, inicio: b.inicio, fin: b.fin });
    }
  }
  for (const [k, items] of porAulaDia) {
    const [aulaPart, diaPart] = k.split("|");
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (firmaClase(a.clase) === firmaClase(b.clase)) continue;
        if (!seSolapan(a, b)) continue;
        problemas.push({
          tipo: "solape_aula",
          severidad: "alta",
          descripcion: `Aula ${aulaPart} ocupada el ${diaPart} por dos clases distintas: ${a.clase.codigo} sec ${a.clase.seccion} (${minutosAHHMM(a.inicio)}–${minutosAHHMM(a.fin)}) y ${b.clase.codigo} sec ${b.clase.seccion} (${minutosAHHMM(b.inicio)}–${minutosAHHMM(b.fin)}).`,
          referencias: [
            { hoja: a.clase.hoja, fila: a.clase.fila },
            { hoja: b.clase.hoja, fila: b.clase.fila },
          ],
          extra: { aula: aulaPart, dia: diaPart },
        });
      }
    }
  }

  // Solapes de catedrático
  const porCatedDia = new Map<string, { clase: Clase; inicio: number; fin: number }[]>();
  for (const c of clases) {
    if (!c.catedratico || c.catedratico === "P.D.") continue;
    for (const b of c.bloques) {
      const k = `${c.catedratico}|${b.dia}`;
      if (!porCatedDia.has(k)) porCatedDia.set(k, []);
      porCatedDia.get(k)!.push({ clase: c, inicio: b.inicio, fin: b.fin });
    }
  }
  for (const [k, items] of porCatedDia) {
    const [catedPart, diaPart] = k.split("|");
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (firmaClase(a.clase) === firmaClase(b.clase)) continue;
        if (!seSolapan(a, b)) continue;
        problemas.push({
          tipo: "solape_catedratico",
          severidad: "alta",
          descripcion: `${catedPart} tiene dos clases simultáneas el ${diaPart}: ${a.clase.codigo} sec ${a.clase.seccion} (${minutosAHHMM(a.inicio)}–${minutosAHHMM(a.fin)}) y ${b.clase.codigo} sec ${b.clase.seccion} (${minutosAHHMM(b.inicio)}–${minutosAHHMM(b.fin)}).`,
          referencias: [
            { hoja: a.clase.hoja, fila: a.clase.fila },
            { hoja: b.clase.hoja, fila: b.clase.fila },
          ],
          extra: { catedratico: catedPart, dia: diaPart },
        });
      }
    }
  }

  return problemas;
}

/* ───────────── horas ───────────── */

export function validarHoras(clases: Clase[]): Problema[] {
  const problemas: Problema[] = [];

  for (const c of clases) {
    const pres = c.horasPresenciales;
    const tot = c.horasTotales;
    const reales = horasRealesSemanales(c);

    if (pres === null && tot === null) continue;

    if (c.bloques.length === 0) {
      if (pres && pres > 0) {
        problemas.push({
          tipo: "horas_inconsistentes",
          severidad: "alta",
          descripcion: `${c.codigo} sec ${c.seccion} con ${c.catedratico} declara ${pres} h presenciales pero no tiene ningún bloque de horario.`,
          referencias: [{ hoja: c.hoja, fila: c.fila }],
          extra: { declaradas_pres: pres, reales: 0 },
        });
      }
      continue;
    }

    if (tot !== null && reales > tot) {
      problemas.push({
        tipo: "horas_inconsistentes",
        severidad: "media",
        descripcion: `${c.codigo} sec ${c.seccion} con ${c.catedratico} declara ${tot} h totales pero los bloques de horario suman ${reales} h clase (sobre-programada).`,
        referencias: [{ hoja: c.hoja, fila: c.fila }],
        extra: { declaradas_tot: tot, reales, exceso: reales - tot },
      });
      continue;
    }

    if (pres !== null && pres > 0 && reales < pres) {
      problemas.push({
        tipo: "horas_inconsistentes",
        severidad: "media",
        descripcion: `${c.codigo} sec ${c.seccion} con ${c.catedratico} declara ${pres} h presenciales pero los bloques de horario suman solo ${reales} h clase (sub-programada).`,
        referencias: [{ hoja: c.hoja, fila: c.fila }],
        extra: { declaradas_pres: pres, reales, faltante: pres - reales },
      });
    }
  }
  return problemas;
}

/* ───────────── horarios sospechosos ───────────── */

export function validarHorariosSospechosos(clases: Clase[]): Problema[] {
  const problemas: Problema[] = [];
  for (const c of clases) {
    for (const b of c.bloques) {
      const dur = b.fin - b.inicio;
      if (dur <= cfg.UMBRAL_BLOQUE_LARGO_MIN) continue;
      problemas.push({
        tipo: "horario_sospechoso",
        severidad: "media",
        descripcion: `${c.codigo} sec ${c.seccion} con ${c.catedratico} tiene un bloque de ${Math.floor(dur / 60)} h continuas el ${b.dia} (${minutosAHHMM(b.inicio)}–${minutosAHHMM(b.fin)}). ¿Es correcto o son varios bloques separados?`,
        referencias: [{ hoja: c.hoja, fila: c.fila }],
        extra: { dia: b.dia, duracion_min: dur },
      });
    }
  }
  return problemas;
}

/* ───────────── sobrecarga ───────────── */

export function validarSobrecarga(clases: Clase[]): Problema[] {
  const horasPor = new Map<string, number>();
  const refsPor = new Map<string, { hoja: string; fila: number }[]>();

  for (const c of clases) {
    if (!c.catedratico || c.catedratico === "P.D.") continue;
    const h = c.horasTotales ?? horasRealesSemanales(c);
    horasPor.set(c.catedratico, (horasPor.get(c.catedratico) ?? 0) + h);
    if (!refsPor.has(c.catedratico)) refsPor.set(c.catedratico, []);
    refsPor.get(c.catedratico)!.push({ hoja: c.hoja, fila: c.fila });
  }

  const problemas: Problema[] = [];
  for (const [cated, total] of horasPor) {
    if (total <= cfg.UMBRAL_SOBRECARGA_H_SEMANA) continue;
    problemas.push({
      tipo: "sobrecarga_docente",
      severidad: "media",
      descripcion: `${cated} acumula ${total.toFixed(1)} h/semana entre todas sus clases (umbral: ${cfg.UMBRAL_SOBRECARGA_H_SEMANA} h).`,
      referencias: refsPor.get(cated)!,
      extra: { catedratico: cated, horas_totales: Math.round(total * 100) / 100 },
    });
  }
  problemas.sort(
    (a, b) =>
      (b.extra.horas_totales as number) - (a.extra.horas_totales as number),
  );
  return problemas;
}

/* ───────────── subutilización ───────────── */

export function validarSubutilizacion(clases: Clase[]): Problema[] {
  const horasPor = new Map<string, number>();
  const refsPor = new Map<string, { hoja: string; fila: number }[]>();

  for (const c of clases) {
    if (!c.catedratico || c.catedratico === "P.D.") continue;
    const h = c.horasTotales ?? horasRealesSemanales(c);
    horasPor.set(c.catedratico, (horasPor.get(c.catedratico) ?? 0) + h);
    if (!refsPor.has(c.catedratico)) refsPor.set(c.catedratico, []);
    refsPor.get(c.catedratico)!.push({ hoja: c.hoja, fila: c.fila });
  }

  const problemas: Problema[] = [];
  for (const [cated, total] of horasPor) {
    if (total >= cfg.UMBRAL_SUBUTILIZACION_H_SEMANA) continue;
    problemas.push({
      tipo: "subutilizacion_docente",
      severidad: "baja",
      descripcion: `${cated} solo tiene ${Math.round(total)} h/semana asignadas en total. Verificar si es correcto o si falta cargar más clases.`,
      referencias: refsPor.get(cated)!,
      extra: { catedratico: cated, horas_totales: Math.round(total * 100) / 100 },
    });
  }
  problemas.sort(
    (a, b) =>
      (a.extra.horas_totales as number) - (b.extra.horas_totales as number),
  );
  return problemas;
}

/* ───────────── secciones grandes ───────────── */

export function validarSeccionesGrandes(clases: Clase[]): Problema[] {
  const problemas: Problema[] = [];
  for (const c of clases) {
    if (c.alumnos === null || c.alumnos <= cfg.UMBRAL_SECCION_GRANDE) continue;
    problemas.push({
      tipo: "seccion_grande",
      severidad: "baja",
      descripcion: `${c.codigo} sec ${c.seccion} (${c.asignatura}) con ${c.catedratico} tiene ${c.alumnos} alumnos. Verificar capacidad del aula ${c.aula} o considerar abrir una sección adicional.`,
      referencias: [{ hoja: c.hoja, fila: c.fila }],
      extra: { alumnos: c.alumnos, aula: c.aula, codigo: c.codigo },
    });
  }
  problemas.sort(
    (a, b) => (b.extra.alumnos as number) - (a.extra.alumnos as number),
  );
  return problemas;
}

/* ───────────── orquestador ───────────── */

export function correrTodasLasValidaciones(
  clasesValidacion: Clase[],
  clasesConConsolidacion: Clase[],
): Problema[] {
  return [
    ...validarConsolidacion(clasesConConsolidacion),
    ...validarDuplicados(clasesValidacion),
    ...validarSolapes(clasesValidacion),
    ...validarHoras(clasesValidacion),
    ...validarHorariosSospechosos(clasesValidacion),
    ...validarSobrecarga(clasesValidacion),
    ...validarSubutilizacion(clasesValidacion),
    ...validarSeccionesGrandes(clasesValidacion),
  ];
}
