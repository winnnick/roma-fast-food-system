import type {
  ColumnaExportacion,
} from "../tipos/reportes";

import {
  auditarAccion,
} from "./auditoriaAccionesServicio";

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
    return valor.toISOString();
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

function escaparCsv(
  valor: unknown,
): string {
  const texto =
    convertirValorTexto(valor);

  return `"${texto.replaceAll(
    '"',
    '""',
  )}"`;
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

export function convertirRegistrosCsv<T>(
  registros: T[],
  columnas: ColumnaExportacion<T>[],
): string {
  const encabezados = columnas
    .map((columna) =>
      escaparCsv(columna.encabezado),
    )
    .join(",");

  const filas = registros.map(
    (registro) =>
      columnas
        .map((columna) =>
          escaparCsv(
            columna.obtenerValor(
              registro,
            ),
          ),
        )
        .join(","),
  );

  return [
    encabezados,
    ...filas,
  ].join("\r\n");
}

export function descargarCsv<T>(
  nombreArchivo: string,
  registros: T[],
  columnas: ColumnaExportacion<T>[],
): void {
  const contenido =
    convertirRegistrosCsv(
      registros,
      columnas,
    );

  const blob = new Blob(
    [`\uFEFF${contenido}`],
    {
      type:
        "text/csv;charset=utf-8",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const enlace =
    document.createElement("a");

  enlace.href = url;
  enlace.download =
    `${normalizarNombreArchivo(
      nombreArchivo,
    )}.csv`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);

  void auditarAccion({
    modulo: "Reportes",
    accion: "Exportar CSV",
    entidad: "Reporte",
    entidadId: null,
    descripcion:
      `Se exportó ${nombreArchivo} con ${registros.length} registros.`,
    datosPosteriores: {
      nombreArchivo,
      cantidadRegistros:
        registros.length,
      cantidadColumnas:
        columnas.length,
    },
  });
}

export function imprimirReporte<T>(
  titulo: string,
  descripcion: string,
  registros: T[],
  columnas: ColumnaExportacion<T>[],
): void {
  const ventana = window.open(
    "",
    "_blank",
    "noopener,noreferrer",
  );

  if (!ventana) {
    throw new Error(
      "El navegador bloqueó la ventana de impresión.",
    );
  }

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
      (registro) =>
        `<tr>${columnas
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

  ventana.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escaparHtml(titulo)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #0f172a;
            margin: 32px;
          }
          h1 { margin: 0; font-size: 24px; }
          p { color: #475569; margin: 8px 0 24px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th { background: #f1f5f9; }
          .fecha {
            margin-top: 24px;
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            body { margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <h1>${escaparHtml(titulo)}</h1>
        <p>${escaparHtml(descripcion)}</p>
        <table>
          <thead><tr>${encabezados}</tr></thead>
          <tbody>${filas}</tbody>
        </table>
        <div class="fecha">
          Generado el ${escaparHtml(
            new Date().toLocaleString(
              "es-BO",
            ),
          )}
        </div>
      </body>
    </html>
  `);

  ventana.document.close();

  window.setTimeout(() => {
    ventana.focus();
    ventana.print();
  }, 250);

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
