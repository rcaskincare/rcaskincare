import * as XLSX from 'xlsx';

export interface ParseResult {
  data: any[];
  headers: string[];
  totalRows: number;
  previewRows: any[];
  error?: string;
}

/**
 * Reads an Excel (.xlsx / .xls) or CSV file and extracts clean tabular data.
 * Skips guidance/meta rows like 'PANDUAN:' or empty headers.
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          return resolve({ data: [], headers: [], totalRows: 0, previewRows: [], error: 'File kosong atau tidak dapat dibaca' });
        }

        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          return resolve({ data: [], headers: [], totalRows: 0, previewRows: [], error: 'Worksheet tidak ditemukan di dalam file Excel' });
        }

        const sheet = wb.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length === 0) {
          return resolve({ data: [], headers: [], totalRows: 0, previewRows: [], error: 'Data sheet Excel kosong' });
        }

        // Find header row: first row that doesn't start with "PANDUAN:" or metadata and has at least 2 non-empty columns
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;
          const firstCell = String(row[0] || '').trim();
          if (firstCell.startsWith('PANDUAN') || firstCell.startsWith('RCA SKINCARE') || firstCell.startsWith('Cabang:')) {
            continue;
          }
          const validCells = row.filter((c: any) => String(c).trim() !== '');
          if (validCells.length >= 2) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          return resolve({ data: [], headers: [], totalRows: 0, previewRows: [], error: 'Baris kolom header tabel tidak terdeteksi' });
        }

        const rawHeaders = rawJson[headerRowIdx].map((h: any) => String(h || '').trim());
        const headers = rawHeaders.filter((h: string) => h.length > 0);

        const dataRows: any[] = [];
        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;
          const hasContent = row.some((c: any) => String(c).trim() !== '');
          if (!hasContent) continue;

          const rowObj: Record<string, any> = {};
          rawHeaders.forEach((colName: string, colIdx: number) => {
            if (colName) {
              rowObj[colName] = row[colIdx] ?? '';
            }
          });
          dataRows.push(rowObj);
        }

        resolve({
          data: dataRows,
          headers,
          totalRows: dataRows.length,
          previewRows: dataRows.slice(0, 5)
        });
      } catch (err: any) {
        resolve({
          data: [],
          headers: [],
          totalRows: 0,
          previewRows: [],
          error: `Gagal memproses file Excel: ${err.message || 'Format tidak valid'}`
        });
      }
    };

    reader.onerror = () => {
      resolve({ data: [], headers: [], totalRows: 0, previewRows: [], error: 'Gagal membaca berkas file' });
    };

    reader.readAsArrayBuffer(file);
  });
}
