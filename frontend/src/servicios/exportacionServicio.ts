import type {
  ColumnaExportacion,
} from "../tipos/reportes";

import type {
  ModuloAuditoria,
} from "../tipos/auditoria";

import {
  auditarAccion,
} from "./auditoriaAccionesServicio";

interface ResumenPdf {
  etiqueta: string;
  valor: string;
}

interface OpcionesPdfReporte<T> {
  nombreArchivo: string;
  titulo: string;
  descripcion: string;
  registros: T[];
  columnas: ColumnaExportacion<T>[];
  resumen?: ResumenPdf[];
  auditoria?: {
    modulo: ModuloAuditoria;
    accion?: string;
    entidad?: string;
  };
}

const ANCHO_PAGINA = 842;
const ALTO_PAGINA = 595;
const MARGEN = 34;
const ANCHO_CONTENIDO =
  ANCHO_PAGINA - MARGEN * 2;

function normalizarNombreArchivo(
  nombre: string,
): string {
  const limpio = nombre
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return limpio || "reporte";
}

function convertirValorTexto(
  valor: unknown,
): string {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  if (valor instanceof Date) {
    return valor.toLocaleString("es-BO");
  }

  if (typeof valor === "object") {
    try {
      return JSON.stringify(valor);
    } catch {
      return String(valor);
    }
  }

  return String(valor);
}

function escaparHtml(
  valor: unknown,
): string {
  return convertirValorTexto(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTextoPdf(
  valor: unknown,
): string {
  return convertirValorTexto(valor)
    .replaceAll("\u2013", "-")
    .replaceAll("\u2014", "-")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\u00a0", " ")
    .replace(/\s+/g, " ")
    .trim();
}

const mapaCp1252: Record<string, number> = {
  "€": 0x80,
  "‚": 0x82,
  "ƒ": 0x83,
  "„": 0x84,
  "…": 0x85,
  "†": 0x86,
  "‡": 0x87,
  "ˆ": 0x88,
  "‰": 0x89,
  "Š": 0x8a,
  "‹": 0x8b,
  "Œ": 0x8c,
  "Ž": 0x8e,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
  "˜": 0x98,
  "™": 0x99,
  "š": 0x9a,
  "›": 0x9b,
  "œ": 0x9c,
  "ž": 0x9e,
  "Ÿ": 0x9f,
};

function textoAHexPdf(texto: string): string {
  let resultado = "";

  for (const caracter of texto) {
    const codigo = caracter.charCodeAt(0);

    let byte = 0x3f;

    if (codigo <= 0xff) {
      byte = codigo;
    } else if (mapaCp1252[caracter]) {
      byte = mapaCp1252[caracter];
    }

    resultado += byte
      .toString(16)
      .padStart(2, "0");
  }

  return resultado.toUpperCase();
}

function comandoTexto(
  x: number,
  y: number,
  texto: string,
  tamano = 8,
  negrita = false,
): string {
  const contenido = textoAHexPdf(
    normalizarTextoPdf(texto),
  );

  return [
    "BT",
    `/${negrita ? "F2" : "F1"} ${tamano} Tf`,
    `${x.toFixed(2)} ${y.toFixed(2)} Td`,
    `<${contenido}> Tj`,
    "ET",
  ].join("\n");
}

function comandoLinea(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  return `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function comandoRectangulo(
  x: number,
  y: number,
  ancho: number,
  alto: number,
  rellenar = false,
): string {
  return `${x.toFixed(2)} ${y.toFixed(2)} ${ancho.toFixed(2)} ${alto.toFixed(2)} re ${rellenar ? "f" : "S"}`;
}

function envolverTexto(
  valor: unknown,
  ancho: number,
  tamanoFuente: number,
  maxLineas = 4,
): string[] {
  const texto = normalizarTextoPdf(valor);

  if (!texto) {
    return [""];
  }

  const caracteresMaximos = Math.max(
    4,
    Math.floor(
      ancho / (tamanoFuente * 0.52),
    ),
  );

  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let linea = "";

  for (const palabraOriginal of palabras) {
    let palabra = palabraOriginal;

    while (
      palabra.length > caracteresMaximos
    ) {
      if (linea) {
        lineas.push(linea);
        linea = "";
      }

      lineas.push(
        palabra.slice(
          0,
          caracteresMaximos,
        ),
      );

      palabra = palabra.slice(
        caracteresMaximos,
      );
    }

    const candidata = linea
      ? `${linea} ${palabra}`
      : palabra;

    if (
      candidata.length <=
      caracteresMaximos
    ) {
      linea = candidata;
      continue;
    }

    if (linea) {
      lineas.push(linea);
    }

    linea = palabra;
  }

  if (linea) {
    lineas.push(linea);
  }

  if (lineas.length <= maxLineas) {
    return lineas;
  }

  const resultado = lineas.slice(
    0,
    maxLineas,
  );

  const ultimo = resultado.length - 1;

  resultado[ultimo] = `${resultado[
    ultimo
  ].slice(
    0,
    Math.max(
      1,
      caracteresMaximos - 3,
    ),
  )}...`;

  return resultado;
}

function distribuirAnchos<T>(
  columnas: ColumnaExportacion<T>[],
): number[] {
  const pesos = columnas.map(
    (columna) =>
      Math.max(0.45, columna.peso ?? 1),
  );

  const total = pesos.reduce(
    (suma, peso) => suma + peso,
    0,
  );

  return pesos.map(
    (peso) =>
      (ANCHO_CONTENIDO * peso) /
      total,
  );
}

function posicionTextoCelda(
  x: number,
  ancho: number,
  texto: string,
  tamano: number,
  alineacion:
    | "izquierda"
    | "centro"
    | "derecha",
): number {
  if (alineacion === "izquierda") {
    return x + 4;
  }

  const anchoEstimado =
    texto.length * tamano * 0.5;

  if (alineacion === "centro") {
    return Math.max(
      x + 4,
      x +
        (ancho - anchoEstimado) / 2,
    );
  }

  return Math.max(
    x + 4,
    x + ancho - anchoEstimado - 4,
  );
}

function construirPdf<T>(
  opciones: OpcionesPdfReporte<T>,
): Uint8Array {
  const paginas: string[][] = [];
  let comandos: string[] = [];
  let y = ALTO_PAGINA - MARGEN;

  const columnas = opciones.columnas;
  const anchos = distribuirAnchos(
    columnas,
  );
  const tituloSeccion = opciones.titulo
    .replace(
      /^Roma Fast Food\s*[-—]\s*/i,
      "",
    )
    .trim();

  const dibujarMarcaSuperior = (
    compacta = false,
  ) => {
    const alto = compacta ? 24 : 30;

    comandos.push(
      "0.055 0.075 0.12 rg",
      comandoRectangulo(
        0,
        ALTO_PAGINA - alto,
        ANCHO_PAGINA,
        alto,
        true,
      ),
      "0.86 0.055 0.22 rg",
      comandoRectangulo(
        0,
        ALTO_PAGINA - alto,
        5,
        alto,
        true,
      ),
      "1 1 1 rg",
      comandoTexto(
        MARGEN,
        ALTO_PAGINA - (compacta ? 16 : 19),
        "ROMA FAST FOOD",
        compacta ? 9.5 : 11.5,
        true,
      ),
      "0.78 0.82 0.9 rg",
      comandoTexto(
        ANCHO_PAGINA - 154,
        ALTO_PAGINA - (compacta ? 16 : 19),
        "SISTEMA DE GESTIÓN INTERNA",
        compacta ? 6.1 : 6.5,
        true,
      ),
      "0 0 0 rg",
    );
  };

  const dibujarEncabezadoTabla = () => {
    const alto = 25;

    comandos.push(
      "0.09 0.12 0.18 rg",
      comandoRectangulo(
        MARGEN,
        y - alto,
        ANCHO_CONTENIDO,
        alto,
        true,
      ),
    );

    let x = MARGEN;

    columnas.forEach(
      (columna, indice) => {
        const ancho = anchos[indice];
        const lineas = envolverTexto(
          columna.encabezado,
          ancho - 8,
          6.8,
          2,
        );

        lineas.forEach(
          (linea, indiceLinea) => {
            comandos.push(
              "1 1 1 rg",
              comandoTexto(
                x + 4,
                y - 10 - indiceLinea * 7.4,
                linea.toLocaleUpperCase("es"),
                6.8,
                true,
              ),
            );
          },
        );

        x += ancho;
      },
    );

    y -= alto;
  };

  const iniciarPagina = (
    repetirEncabezadoTabla = false,
  ) => {
    if (comandos.length > 0) {
      paginas.push(comandos);
    }

    comandos = [];
    dibujarMarcaSuperior(
      repetirEncabezadoTabla,
    );

    if (repetirEncabezadoTabla) {
      y = ALTO_PAGINA - 39;

      comandos.push(
        "0.23 0.28 0.36 rg",
        comandoTexto(
          MARGEN,
          y,
          `Reporte · ${tituloSeccion}`,
          8.5,
          true,
        ),
        "0 0 0 rg",
      );

      y -= 13;
      dibujarEncabezadoTabla();
      return;
    }

    y = ALTO_PAGINA - 49;

    comandos.push(
      "0.055 0.075 0.12 rg",
      comandoTexto(
        MARGEN,
        y,
        `Reporte · ${tituloSeccion}`,
        16,
        true,
      ),
      "0 0 0 rg",
    );

    y -= 15;

    if (opciones.descripcion.trim()) {
      comandos.push(
        "0.32 0.37 0.46 rg",
      );

      envolverTexto(
        opciones.descripcion,
        ANCHO_CONTENIDO,
        7.2,
        2,
      ).forEach((linea) => {
        comandos.push(
          comandoTexto(
            MARGEN,
            y,
            linea,
            7.2,
          ),
        );
        y -= 9;
      });

      comandos.push("0 0 0 rg");
      y -= 3;
    }

    if (
      opciones.resumen &&
      opciones.resumen.length > 0
    ) {
      const cantidad =
        opciones.resumen.length;
      const anchoItem =
        ANCHO_CONTENIDO / cantidad;
      const altoResumen = 34;

      comandos.push(
        "0.965 0.972 0.982 rg",
        comandoRectangulo(
          MARGEN,
          y - altoResumen,
          ANCHO_CONTENIDO,
          altoResumen,
          true,
        ),
        "0.84 0.86 0.9 RG",
        comandoLinea(
          MARGEN,
          y,
          MARGEN + ANCHO_CONTENIDO,
          y,
        ),
        comandoLinea(
          MARGEN,
          y - altoResumen,
          MARGEN + ANCHO_CONTENIDO,
          y - altoResumen,
        ),
      );

      opciones.resumen.forEach(
        (item, indice) => {
          const x =
            MARGEN + indice * anchoItem;

          if (indice > 0) {
            comandos.push(
              "0.87 0.89 0.92 RG",
              comandoLinea(
                x,
                y - 6,
                x,
                y - altoResumen + 6,
              ),
            );
          }

          const etiqueta = envolverTexto(
            item.etiqueta,
            anchoItem - 16,
            6.1,
            1,
          )[0];
          const valor = envolverTexto(
            item.valor,
            anchoItem - 16,
            8.8,
            1,
          )[0];

          comandos.push(
            "0.42 0.47 0.56 rg",
            comandoTexto(
              x + 8,
              y - 11,
              etiqueta.toLocaleUpperCase("es"),
              6.1,
              true,
            ),
            "0.055 0.075 0.12 rg",
            comandoTexto(
              x + 8,
              y - 25,
              valor,
              8.8,
              true,
            ),
            "0 0 0 rg",
          );
        },
      );

      y -= altoResumen + 10;
    }

    comandos.push(
      "0.055 0.075 0.12 rg",
      comandoTexto(
        MARGEN,
        y,
        "Detalle del reporte",
        9,
        true,
      ),
      "0.38 0.43 0.51 rg",
      comandoTexto(
        ANCHO_PAGINA - MARGEN - 86,
        y,
        `${opciones.registros.length} registros`,
        6.8,
        true,
      ),
      "0 0 0 rg",
    );

    y -= 10;
    dibujarEncabezadoTabla();
  };

  iniciarPagina(false);

  opciones.registros.forEach(
    (registro, indiceRegistro) => {
      const celdas = columnas.map(
        (columna, indice) =>
          envolverTexto(
            columna.obtenerValor(
              registro,
            ),
            anchos[indice] - 8,
            6.8,
            4,
          ),
      );

      const maxLineas = Math.max(
        1,
        ...celdas.map(
          (lineas) => lineas.length,
        ),
      );

      const altoFila = Math.max(
        21,
        maxLineas * 8.5 + 7,
      );

      if (
        y - altoFila < MARGEN + 17
      ) {
        iniciarPagina(true);
      }

      if (indiceRegistro % 2 === 1) {
        comandos.push(
          "0.977 0.98 0.985 rg",
          comandoRectangulo(
            MARGEN,
            y - altoFila,
            ANCHO_CONTENIDO,
            altoFila,
            true,
          ),
        );
      }

      comandos.push(
        "0.88 0.895 0.92 RG",
        comandoLinea(
          MARGEN,
          y - altoFila,
          MARGEN + ANCHO_CONTENIDO,
          y - altoFila,
        ),
      );

      let x = MARGEN;

      columnas.forEach(
        (columna, indice) => {
          const ancho = anchos[indice];
          const alineacion =
            columna.alineacion ??
            "izquierda";

          celdas[indice].forEach(
            (linea, indiceLinea) => {
              comandos.push(
                "0.09 0.12 0.18 rg",
                comandoTexto(
                  posicionTextoCelda(
                    x,
                    ancho,
                    linea,
                    6.8,
                    alineacion,
                  ),
                  y - 11 - indiceLinea * 8.5,
                  linea,
                  6.8,
                ),
              );
            },
          );

          x += ancho;
        },
      );

      y -= altoFila;
    },
  );

  if (opciones.registros.length === 0) {
    comandos.push(
      "0.45 0.49 0.57 rg",
      comandoTexto(
        MARGEN + 8,
        y - 18,
        "No hay registros que coincidan con los filtros aplicados.",
        7.3,
      ),
      "0 0 0 rg",
    );
    y -= 30;
  }

  if (comandos.length > 0) {
    paginas.push(comandos);
  }

  const totalPaginas = paginas.length;
  const generado = new Date().toLocaleString(
    "es-BO",
  );

  paginas.forEach(
    (pagina, indice) => {
      pagina.push(
        "0.84 0.86 0.9 RG",
        comandoLinea(
          MARGEN,
          26,
          ANCHO_PAGINA - MARGEN,
          26,
        ),
        "0.38 0.43 0.51 rg",
        comandoTexto(
          MARGEN,
          14,
          "Roma Fast Food · Sistema interno",
          6.2,
          true,
        ),
        comandoTexto(
          ANCHO_PAGINA / 2 - 72,
          14,
          `Generado ${generado}`,
          6.2,
        ),
        comandoTexto(
          ANCHO_PAGINA - MARGEN - 68,
          14,
          `${indice + 1} / ${totalPaginas}`,
          6.2,
          true,
        ),
        "0 0 0 rg",
      );
    },
  );

  const objetos = new Map<
    number,
    string
  >();

  objetos.set(
    1,
    "<< /Type /Catalog /Pages 2 0 R >>",
  );

  objetos.set(
    3,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  );

  objetos.set(
    4,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );

  const idsPagina: number[] = [];

  paginas.forEach(
    (pagina, indice) => {
      const idPagina = 5 + indice * 2;
      const idContenido = idPagina + 1;
      const stream = pagina.join("\n");

      idsPagina.push(idPagina);

      objetos.set(
        idPagina,
        [
          "<< /Type /Page",
          "/Parent 2 0 R",
          `/MediaBox [0 0 ${ANCHO_PAGINA} ${ALTO_PAGINA}]`,
          "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>",
          `/Contents ${idContenido} 0 R >>`,
        ].join(" "),
      );

      objetos.set(
        idContenido,
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      );
    },
  );

  objetos.set(
    2,
    `<< /Type /Pages /Count ${idsPagina.length} /Kids [${idsPagina
      .map((id) => `${id} 0 R`)
      .join(" ")}] >>`,
  );

  const ultimoId = Math.max(
    ...objetos.keys(),
  );

  let pdf = "%PDF-1.4\n%ROMA\n";
  const offsets = new Array<number>(
    ultimoId + 1,
  ).fill(0);

  for (let id = 1; id <= ultimoId; id += 1) {
    const contenido = objetos.get(id);

    if (!contenido) {
      continue;
    }

    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${contenido}\nendobj\n`;
  }

  const inicioXref = pdf.length;

  pdf += `xref\n0 ${ultimoId + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let id = 1; id <= ultimoId; id += 1) {
    pdf += `${offsets[id]
      .toString()
      .padStart(10, "0")} 00000 n \n`;
  }

  pdf += [
    "trailer",
    `<< /Size ${ultimoId + 1} /Root 1 0 R >>`,
    "startxref",
    String(inicioXref),
    "%%EOF",
  ].join("\n");

  return new TextEncoder().encode(pdf);
}

export function descargarPdfReporte<T>(
  opciones: OpcionesPdfReporte<T>,
): void {
  const bytes = construirPdf(opciones);

  const buffer = new ArrayBuffer(
    bytes.byteLength,
  );
  new Uint8Array(buffer).set(bytes);

  const blob = new Blob(
    [buffer],
    {
      type: "application/pdf",
    },
  );

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = `${normalizarNombreArchivo(
    opciones.nombreArchivo,
  )}.pdf`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    0,
  );

  void auditarAccion({
    modulo: opciones.auditoria?.modulo ?? "Reportes",
    accion: opciones.auditoria?.accion ?? "Generar PDF",
    entidad: opciones.auditoria?.entidad ?? "Reporte",
    entidadId: null,
    descripcion:
      `Se generó el reporte PDF “${opciones.titulo}” con ${opciones.registros.length} registros.`,
    datosPosteriores: {
      titulo: opciones.titulo,
      cantidadRegistros:
        opciones.registros.length,
      cantidadColumnas:
        opciones.columnas.length,
    },
  });
}

export function imprimirReporte<T>(
  titulo: string,
  descripcion: string,
  registros: T[],
  columnas: ColumnaExportacion<T>[],
): void {
  const encabezados = columnas
    .map(
      (columna) =>
        `<th>${escaparHtml(
          columna.encabezado,
        )}</th>`,
    )
    .join("");

  const filas = registros
    .map(
      (registro, indice) =>
        `<tr class="${indice % 2 === 0 ? "par" : "impar"}">${columnas
          .map(
            (columna) =>
              `<td>${escaparHtml(
                columna.obtenerValor(
                  registro,
                ),
              )}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  const generadoEn = new Date().toLocaleString(
    "es-BO",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  );

  const contenido = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escaparHtml(titulo)}</title>
        <style>
          * { box-sizing: border-box; }

          @page {
            size: landscape;
            margin: 10mm;
          }

          body {
            margin: 0;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .encabezado {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid #991b1b;
          }

          .marca {
            margin: 0 0 4px;
            color: #991b1b;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            color: #0f172a;
            font-size: 21px;
            line-height: 1.15;
          }

          .descripcion {
            max-width: 760px;
            margin: 6px 0 0;
            color: #475569;
            font-size: 10.5px;
            line-height: 1.45;
          }

          .meta {
            min-width: 155px;
            text-align: right;
          }

          .meta strong {
            display: block;
            color: #0f172a;
            font-size: 11px;
          }

          .meta span {
            display: block;
            margin-top: 3px;
            color: #64748b;
            font-size: 9.5px;
          }

          .tabla-contenedor {
            margin-top: 14px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: auto;
            font-size: 9.5px;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          th {
            padding: 7px 8px;
            background: #0f172a;
            color: #ffffff;
            font-size: 8.5px;
            font-weight: 800;
            letter-spacing: .035em;
            text-align: left;
            text-transform: uppercase;
          }

          td {
            padding: 7px 8px;
            border-top: 1px solid #e2e8f0;
            color: #1e293b;
            line-height: 1.35;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          tbody tr.par td {
            background: #ffffff;
          }

          tbody tr.impar td {
            background: #f8fafc;
          }

          .pie {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 8.5px;
          }

          @media print {
            .tabla-contenedor {
              overflow: visible;
            }
          }
        </style>
      </head>
      <body>
        <header class="encabezado">
          <div>
            <p class="marca">Roma Fast Food · Sistema de gestión interna</p>
            <h1>${escaparHtml(titulo)}</h1>
            <p class="descripcion">${escaparHtml(descripcion)}</p>
          </div>
          <div class="meta">
            <strong>${registros.length} ${registros.length === 1 ? "registro" : "registros"}</strong>
            <span>Generado ${escaparHtml(generadoEn)}</span>
          </div>
        </header>

        <div class="tabla-contenedor">
          <table>
            <thead><tr>${encabezados}</tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>

        <footer class="pie">
          <span>Roma Fast Food · Documento interno</span>
          <span>${escaparHtml(generadoEn)}</span>
        </footer>
      </body>
    </html>
  `;

  const marco = document.createElement("iframe");
  marco.title = "Vista de impresión del reporte";
  marco.setAttribute("aria-hidden", "true");
  marco.style.position = "fixed";
  marco.style.left = "-10000px";
  marco.style.bottom = "0";
  marco.style.width = "1px";
  marco.style.height = "1px";
  marco.style.border = "0";
  marco.style.opacity = "0";

  let retirado = false;

  const retirarMarco = () => {
    if (retirado) return;
    retirado = true;
    marco.remove();
  };

  marco.onload = () => {
    const ventanaImpresion = marco.contentWindow;

    if (!ventanaImpresion) {
      retirarMarco();
      return;
    }

    ventanaImpresion.addEventListener(
      "afterprint",
      retirarMarco,
      { once: true },
    );

    window.setTimeout(() => {
      ventanaImpresion.focus();
      ventanaImpresion.print();
      window.setTimeout(retirarMarco, 1200);
    }, 80);
  };

  marco.srcdoc = contenido;
  document.body.appendChild(marco);

  void auditarAccion({
    modulo: "Reportes",
    accion: "Imprimir reporte",
    entidad: "Reporte",
    entidadId: null,
    descripcion:
      `Se preparó la impresión del reporte “${titulo}” con ${registros.length} registros.`,
    datosPosteriores: {
      titulo,
      descripcion,
      cantidadRegistros:
        registros.length,
      cantidadColumnas:
        columnas.length,
    },
  });
}
