import { once } from "node:events";
import { PassThrough, Readable } from "node:stream";

type ExcelXmlCellValue = string | number | boolean | Date | null | undefined;

export type ExcelXmlColumn = {
  key: string;
  header: string;
  width?: number;
};

export type ExcelXmlRow = Record<string, ExcelXmlCellValue> | ExcelXmlCellValue[];

export type ExcelXmlWriter = {
  addRow: (row: ExcelXmlRow) => Promise<void>;
};

type CreateExcelXmlResponseOptions = {
  fileName: string;
  sheetName: string;
  columns: ExcelXmlColumn[];
  writeRows: (writer: ExcelXmlWriter) => Promise<void>;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeSheetName(value: string) {
  const sanitized = value.replace(/[\\/:?*\[\]]/g, " ").trim();
  if (!sanitized) {
    return "Sheet1";
  }

  return sanitized.slice(0, 31);
}

function sanitizeFileName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "export.xls";
  }

  const base = trimmed.endsWith(".xls") ? trimmed : `${trimmed}.xls`;
  return base.replace(/[^\w.\- ]/g, "_");
}

function formatDateTime(value: Date) {
  return value.toISOString().replace("T", " ").replace("Z", "");
}

function serializeCell(value: ExcelXmlCellValue) {
  if (value === null || value === undefined) {
    return "<Cell/>";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  const normalized =
    value instanceof Date
      ? formatDateTime(value)
      : typeof value === "boolean"
        ? value
          ? "TRUE"
          : "FALSE"
        : String(value);

  return `<Cell><Data ss:Type="String">${escapeXml(normalized)}</Data></Cell>`;
}

function serializeRow(values: ExcelXmlCellValue[]) {
  return `<Row>${values.map((value) => serializeCell(value)).join("")}</Row>`;
}

async function writeChunk(stream: PassThrough, chunk: string) {
  if (!stream.write(chunk, "utf8")) {
    await once(stream, "drain");
  }
}

export function createExcelXmlResponse({
  fileName,
  sheetName,
  columns,
  writeRows,
}: CreateExcelXmlResponseOptions) {
  const stream = new PassThrough();
  const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;
  const safeFileName = sanitizeFileName(fileName);
  const safeSheetName = sanitizeSheetName(sheetName);

  void (async () => {
    try {
      await writeChunk(
        stream,
        '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>',
      );
      await writeChunk(
        stream,
        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
      );
      await writeChunk(
        stream,
        `<Worksheet ss:Name="${escapeXml(safeSheetName)}"><Table>`,
      );

      for (const column of columns) {
        if (column.width) {
          await writeChunk(
            stream,
            `<Column ss:AutoFitWidth="0" ss:Width="${column.width}"/>`,
          );
        }
      }

      await writeChunk(
        stream,
        serializeRow(columns.map((column) => column.header)),
      );

      const writer: ExcelXmlWriter = {
        addRow: async (row) => {
          const values = Array.isArray(row)
            ? row
            : columns.map((column) => row[column.key]);
          await writeChunk(stream, serializeRow(values));
        },
      };

      await writeRows(writer);

      await writeChunk(stream, "</Table></Worksheet></Workbook>");
      stream.end();
    } catch (error) {
      stream.destroy(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  })();

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
    },
  });
}
