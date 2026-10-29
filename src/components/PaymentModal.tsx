import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  CheckCircle, 
  Printer, 
  FileText, 
  AlertCircle,
  Banknote,
  QrCode,
  Building
} from 'lucide-react';
import { PaymentMethod, CashAccount, Transaction, Branch } from '../types/index.ts';
import { formatRupiah } from '../lib/formatters.ts';
import { generateThermalReceipt, generateInvoiceA4 } from '../lib/pdfGenerator.ts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotalProduk: number;
  subtotalJasa: number;
  totalDiskon: number;
  totalTagihan: number;
  branch: Branch;
  onConfirmCheckout: (paymentDetails: {
    nominalBayar: number;
    metodePembayaran: PaymentMethod;
    akunKas: CashAccount;
    notes?: string;
  }) => Promise<Transaction | null>;
  onShowPdfPreview: (doc: any, filename: string, title: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subtotalProduk,
  subtotalJasa,
  totalDiskon,
  totalTagihan,
  branch,
  onConfirmCheckout,
  onShowPdfPreview
}) => {
  const [metode, setMetode] = useState<PaymentMethod>('Cash');
  const [akunKas, setAkunKas] = useState<CashAccount>('Kas Tunai Kasir');
  const [nominalBayar, setNominalBayar] = useState<number>(totalTagihan);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedTrx, setCompletedTrx] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMetodeChange = (newMetode: PaymentMethod) => {
    setMetode(newMetode);
    if (newMetode === 'Cash') {
      setAkunKas('Kas Tunai Kasir');
    } else if (newMetode === 'Transfer BCA' || newMetode === 'QRIS') {
      setAkunKas('Bank BCA Operasional');
      setNominalBayar(totalTagihan);
    } else if (newMetode === 'Mandiri EDC') {
      setAkunKas('Bank Mandiri Klinik');
      setNominalBayar(totalTagihan);
    }
  };

  const handleQuickCash = (amount: number) => {
    setNominalBayar(amount);
  };

  const kembalian = Math.max(0, nominalBayar - totalTagihan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nominalBayar < totalTagihan) {
      setError(`Nominal pembayaran kurang dari total tagihan (Kurang: ${formatRupiah(totalTagihan - nominalBayar)})`);
      return;
    }

    setLoading(true);
    try {
      const trx = await onConfirmCheckout({
        nominalBayar,
        metodePembayaran: metode,
        akunKas,
        notes: notes.trim() || undefined
      });

      if (trx) {
        setCompletedTrx(trx);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses transaksi');
    } finally {
      setLoading(false);
    }
  };

  const printThermal = (format: '58mm' | '80mm') => {
    if (!completedTrx) return;
    const doc = generateThermalReceipt(completedTrx, branch, format);
    onShowPdfPreview(doc, `Struk_${completedTrx.invoiceNumber.replace(/\//g, '_')}_${format}.pdf`, `Struk Kasir (${format})`);
  };

  const printInvoiceA4 = () => {
    if (!completedTrx) return;
    const doc = generateInvoiceA4(completedTrx, branch);
    onShowPdfPreview(doc, `Invoice_${completedTrx.invoiceNumber.replace(/\//g, '_')}_A4.pdf`, 'Invoice Resmi A4');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="text-base font-bold text-slate-800">
            {completedTrx ? 'Transaksi Selesai & Berhasil' : 'Pembayaran & Checkout Kasir'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {completedTrx ? (
          /* Success Screen with Immediate Print Options */
          <div className="p-6 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle className="h-10 w-10" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nomor Transaksi</p>
              <p className="font-mono text-lg font-bold text-slate-900 mt-0.5">{completedTrx.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-1">
                Total Tagihan: <strong className="text-slate-800">{formatRupiah(completedTrx.totalTagihan)}</strong> · Bayar: {formatRupiah(completedTrx.nominalBayar)}
              </p>
              {completedTrx.kembalian > 0 && (
                <div className="mt-3 inline-block rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2">
                  <span className="text-xs text-emerald-800">Kembalian Kasir: </span>
                  <span className="text-sm font-bold text-emerald-800">{formatRupiah(completedTrx.kembalian)}</span>
                </div>
              )}
            </div>

            {/* Print Selection Buttons */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-700">Pilih Dokumen & Format Cetak:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => printThermal('58mm')}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-3 hover:border-rose-500 hover:bg-rose-50/50 transition group"
                >
                  <Printer className="h-5 w-5 text-slate-500 group-hover:text-rose-600" />
                  <span className="text-xs font-bold text-slate-800 mt-1">Thermal 58mm</span>
                  <span className="text-[10px] text-slate-400">Mini Struk</span>
                </button>

                <button
                  type="button"
                  onClick={() => printThermal('80mm')}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-3 hover:border-rose-500 hover:bg-rose-50/50 transition group"
                >
                  <Printer className="h-5 w-5 text-slate-500 group-hover:text-rose-600" />
                  <span className="text-xs font-bold text-slate-800 mt-1">Thermal 80mm</span>
                  <span className="text-[10px] text-slate-400">Struk Standar</span>
                </button>

                <button
                  type="button"
                  onClick={printInvoiceA4}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-3 hover:border-rose-500 hover:bg-rose-50/50 transition group"
                >
                  <FileText className="h-5 w-5 text-slate-500 group-hover:text-rose-600" />
                  <span className="text-xs font-bold text-slate-800 mt-1">Invoice A4</span>
                  <span className="text-[10px] text-slate-400">Format Resmi</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Selesai & Transaksi Baru
              </button>
            </div>
          </div>
        ) : (
          /* Payment Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bill Breakdown Box */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk Skincare:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(subtotalProduk)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Jasa & Treatment:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(subtotalJasa)}</span>
              </div>
              {totalDiskon > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Total Potongan Diskon:</span>
                  <span>-{formatRupiah(totalDiskon)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Total Tagihan:</span>
                <span className="text-rose-600 text-base">{formatRupiah(totalTagihan)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-4 gap-2">
                {(['Cash', 'Transfer BCA', 'QRIS', 'Mandiri EDC'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMetodeChange(m)}
                    className={`rounded-lg border p-2 text-center text-xs font-semibold transition ${
                      metode === m
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Input & Quick Denominations */}
            {metode === 'Cash' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Nominal Diterima Kasir (IDR)</label>
                <input
                  type="number"
                  min={0}
                  value={nominalBayar || ''}
                  onChange={(e) => setNominalBayar(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-rose-500 focus:outline-hidden"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalTagihan)}
                    className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                  >
                    Uang Pas ({formatRupiah(totalTagihan)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(50000)}
                    className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    Rp 50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(100000)}
                    className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    Rp 100.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(200000)}
                    className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    Rp 200.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(500000)}
                    className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    Rp 500.000
                  </button>
                </div>

                {nominalBayar > 0 && (
                  <div className="flex justify-between items-center bg-slate-100/80 p-2.5 rounded-lg text-xs mt-2">
                    <span className="font-medium text-slate-600">Kembalian Kasir:</span>
                    <span className="font-bold text-slate-900 text-sm">{formatRupiah(kembalian)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Non-Cash Info */}
            {metode !== 'Cash' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
                <p className="font-semibold">Akun Rekening Tujuan:</p>
                <p className="mt-0.5">{akunKas} · Pembayaran Lunas Sejumlah: {formatRupiah(totalTagihan)}</p>
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Catatan Struk (Opsional)</label>
              <input
                type="text"
                placeholder="Misal: Paket promo weekend, customer appointment dr. Nadira"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-rose-500"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? 'Memproses Transaksi...' : `Bayar & Terbitkan Struk (${formatRupiah(totalTagihan)})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
