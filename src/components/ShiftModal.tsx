import React, { useState } from 'react';
import { X, Clock, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import { ShiftRecord, BranchId } from '../types/index.ts';
import { formatRupiah, formatDateTimeId } from '../lib/formatters.ts';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ShiftRecord | null;
  branchId: BranchId;
  kasirName: string;
  onStartShift: (modalAwal: number) => Promise<void>;
  onCloseShift: (shiftId: string, totalKasAktual: number, catatan: string) => Promise<void>;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  branchId,
  kasirName,
  onStartShift,
  onCloseShift
}) => {
  const [modalAwal, setModalAwal] = useState<number>(500000);
  const [kasAktual, setKasAktual] = useState<number>(0);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'view' | 'close'>('view');

  if (!isOpen) return null;

  const expectedCash = activeShift ? (activeShift.modalAwal + activeShift.totalPenjualanCash - activeShift.totalPengeluaranKas) : 0;
  const selisih = kasAktual - expectedCash;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onStartShift(modalAwal);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    setLoading(true);
    try {
      await onCloseShift(activeShift.id, kasAktual, catatan);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-800">
              {activeShift ? 'Manajemen Shift Kasir Aktif' : 'Buka Shift Kasir Baru'}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!activeShift ? (
            /* START SHIFT FORM */
            <form onSubmit={handleStart} className="space-y-4">
              <p className="text-xs text-slate-600">
                Silakan masukkan modal awal kas kecil (petty cash) di laci kasir cabang <strong className="uppercase">{branchId}</strong> untuk memulai shift.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Petugas Kasir</label>
                <input
                  type="text"
                  disabled
                  value={kasirName}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Modal Awal Kas di Laci (IDR)</label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={modalAwal}
                  onChange={(e) => setModalAwal(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-rose-500"
                  required
                />
              </div>

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
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Membuka Shift...' : 'Buka Shift Sekarang'}
                </button>
              </div>
            </form>
          ) : mode === 'view' ? (
            /* ACTIVE SHIFT SUMMARY */
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Waktu Buka Shift:</span>
                  <span className="font-semibold text-slate-800">{formatDateTimeId(activeShift.startTime)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kasir Bertugas:</span>
                  <span className="font-semibold text-slate-800">{activeShift.kasirName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Modal Awal Kas:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(activeShift.modalAwal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Penjualan Tunai (Cash):</span>
                  <span className="font-bold text-emerald-600">+{formatRupiah(activeShift.totalPenjualanCash)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pengeluaran Kas Laci:</span>
                  <span className="font-bold text-rose-600">-{formatRupiah(activeShift.totalPengeluaranKas)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Penjualan Non-Tunai (BCA/QRIS/EDC):</span>
                  <span className="font-semibold text-blue-600">{formatRupiah(activeShift.totalPenjualanNonCash)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Target Kas Fisik di Laci:</span>
                  <span className="text-rose-600">{formatRupiah(expectedCash)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tutup Jendela
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKasAktual(expectedCash);
                    setMode('close');
                  }}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Tutup Shift & Rekonsiliasi Kas
                </button>
              </div>
            </div>
          ) : (
            /* CLOSE SHIFT FORM */
            <form onSubmit={handleClose} className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                Hitung uang fisik di laci kasir dan masukkan total nominal aktual yang dihitung.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Target Kas Seharusnya (Expected)</label>
                <p className="mt-1 font-bold text-slate-900 text-base">{formatRupiah(expectedCash)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Total Uang Fisik Aktual di Laci (IDR) *</label>
                <input
                  type="number"
                  min={0}
                  value={kasAktual}
                  onChange={(e) => setKasAktual(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-rose-500"
                  required
                />
              </div>

              {/* Difference badge */}
              <div className={`p-3 rounded-lg text-xs font-bold flex justify-between items-center ${
                selisih === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}>
                <span>Selisih Kas (Variance):</span>
                <span>{selisih === 0 ? 'Tepat Pas (Rp 0)' : `${selisih > 0 ? '+' : ''}${formatRupiah(selisih)}`}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Catatan Rekonsiliasi (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Uang receh 2.000 untuk kembalian dibulatkan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Menutup Shift...' : 'Konfirmasi Tutup Shift'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
