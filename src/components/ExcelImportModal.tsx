import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, 
  X, RefreshCw, AlertCircle, FileCheck 
} from 'lucide-react';
import { parseExcelFile, ParseResult } from '../lib/excelImport.ts';

export type ImportType = 'products' | 'customers' | 'services' | 'expenses';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ImportType;
  onSuccess: () => void;
  onDownloadTemplate: () => void;
}

const TYPE_CONFIG: Record<ImportType, {
  title: string;
  subtitle: string;
  apiEndpoint: string;
  templateName: string;
  expectedColumns: string[];
}> = {
  products: {
    title: 'Import Data Produk & Stok',
    subtitle: 'Upload file Excel untuk menambah atau memperbarui katalog produk serta stok per cabang.',
    apiEndpoint: '/api/products/batch-import',
    templateName: 'Template_Import_Produk_RCA.xlsx',
    expectedColumns: ['Nama Produk', 'Harga Jual', 'Harga Modal / HPP', 'Stok Spring Hill', 'Stok Sudirman', 'Stok Pangkalan Balai']
  },
  customers: {
    title: 'Import Database Pelanggan CRM',
    subtitle: 'Upload file Excel untuk mendaftarkan atau memperbarui kontak pelanggan RCA Skincare.',
    apiEndpoint: '/api/customers/batch-import',
    templateName: 'Template_Import_Customer_RCA.xlsx',
    expectedColumns: ['Nama Lengkap', 'Nomor Telepon', 'Cabang Pendaftaran']
  },
  services: {
    title: 'Import Master Jasa Klinik',
    subtitle: 'Upload file Excel untuk mendaftarkan layanan facial, laser, dan treatment klinik.',
    apiEndpoint: '/api/services/batch-import',
    templateName: 'Template_Import_Jasa_RCA.xlsx',
    expectedColumns: ['Nama Jasa', 'Kategori Jasa', 'Harga Dasar', 'Durasi (Menit)']
  },
  expenses: {
    title: 'Import Buku Pengeluaran & Kas',
    subtitle: 'Upload file Excel untuk mencatat mutasi pengeluaran operasional dan pemasukan lain.',
    apiEndpoint: '/api/finance/expenses/batch-import',
    templateName: 'Template_Import_Pengeluaran_RCA.xlsx',
    expectedColumns: ['Cabang', 'Tipe', 'Kategori', 'Nominal', 'Deskripsi']
  }
};

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
  onDownloadTemplate
}) => {
  const config = TYPE_CONFIG[type];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted?: number;
    updated?: number;
    total?: number;
    errors?: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setParsing(true);
    setErrorMessage(null);
    setImportResult(null);

    const result = await parseExcelFile(file);
    setParsing(false);

    if (result.error) {
      setErrorMessage(result.error);
      setParsedData(null);
    } else {
      setParsedData(result);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!parsedData || parsedData.data.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedData.data })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Terjadi kesalahan saat memproses batch import');
      }

      setImportResult(json);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim data import ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setParsedData(null);
    setImportResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{config.title}</h3>
              <p className="text-xs text-slate-500">{config.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => { resetState(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Download Official Template */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Unduh Format File Excel Standar
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan template resmi agar susunan kolom otomatis dikenali sistem dengan benar.
              </p>
            </div>
            <button
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4 text-rose-600" />
              Download Template (.xlsx)
            </button>
          </div>

          {/* Success Result View */}
          {importResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-base">Proses Import Berhasil Selesai!</h4>
                  <p className="text-xs text-emerald-700">Data telah tersimpan secara persisten ke database klinik.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-white/80 p-3 rounded-lg border border-emerald-100 text-center">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Baris</div>
                  <div className="text-lg font-bold text-slate-800">{importResult.total || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-emerald-600 font-medium">Data Baru (Insert)</div>
                  <div className="text-lg font-bold text-emerald-600">{importResult.inserted || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 font-medium">Data Diperbarui (Update)</div>
                  <div className="text-lg font-bold text-blue-600">{importResult.updated || 0}</div>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Catatan ({importResult.errors.length} baris dilewati):
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-700 max-h-24 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={resetState}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Import File Lain
                </button>
                <button
                  onClick={() => { resetState(); onClose(); }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 2: Upload Area */}
              <div>
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Pilih atau Tarik Berkas File (.xlsx / .xls / .csv)
                </label>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    selectedFile 
                      ? 'border-emerald-400 bg-emerald-50/20' 
                      : 'border-slate-300 hover:border-rose-400 hover:bg-rose-50/20 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {parsing ? (
                    <div className="py-4 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                      <p className="text-sm font-semibold text-slate-700">Membaca dan memverifikasi data file Excel...</p>
                    </div>
                  ) : selectedFile ? (
                    <div className="py-2 flex flex-col items-center justify-center gap-1.5">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull; Klik untuk mengganti berkas
                      </p>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-1">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Klik untuk upload atau tarik berkas Excel ke area ini
                      </p>
                      <p className="text-xs text-slate-400">
                        Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Kesalahan Validasi:</span> {errorMessage}
                  </div>
                </div>
              )}

              {/* Step 3: Data Preview Table */}
              {parsedData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                      Pratinjau Data ({parsedData.totalRows} baris siap diimpor)
                    </label>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                      Header Valid & Terbaca
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">#</th>
                          {parsedData.headers.map((h, i) => (
                            <th key={i} className="py-2 px-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {parsedData.previewRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-center text-slate-400">{rIdx + 1}</td>
                            {parsedData.headers.map((h, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                                {String(row[h] ?? '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedData.totalRows > 5 && (
                    <p className="text-[11px] text-slate-400 italic text-right">
                      * Menampilkan 5 baris pertama dari total {parsedData.totalRows} baris.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!importResult && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => { resetState(); onClose(); }}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            <button
              onClick={handleSubmit}
              disabled={!parsedData || parsedData.totalRows === 0 || isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                !parsedData || parsedData.totalRows === 0 || isSubmitting
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/20 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sedang Mengimpor {parsedData?.totalRows} Data...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Mulai Import Sekarang ({parsedData?.totalRows || 0} Baris)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
