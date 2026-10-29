import React, { useState } from 'react';
import { X, GitMerge, AlertCircle, CheckCircle } from 'lucide-react';
import { Customer } from '../types/index.ts';

interface CustomerMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onMergedSuccess: () => void;
}

export const CustomerMergeModal: React.FC<CustomerMergeModalProps> = ({
  isOpen,
  onClose,
  customers,
  onMergedSuccess
}) => {
  const [primaryId, setPrimaryId] = useState('');
  const [mergedId, setMergedId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const primaryCustomer = customers.find(c => c.id === primaryId);
  const duplicateCustomer = customers.find(c => c.id === mergedId);

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!primaryId || !mergedId) {
      setError('Pilih customer profil utama dan customer yang akan digabungkan');
      return;
    }
    if (primaryId === mergedId) {
      setError('Customer utama dan duplikat tidak boleh profil yang sama');
      return;
    }
    if (!reason.trim()) {
      setError('Alasan penggabungan wajib diisi untuk kepatuhan audit log');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/customers/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId, mergedId, reason: reason.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menggabungkan customer');

      alert(`Penggabungan berhasil: ${data.updatedTrxCount} riwayat transaksi telah dialihkan ke profil ${data.primary.customerCode}`);
      onMergedSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Merge / Gabung Profil Customer Duplikat</h3>
              <p className="text-xs text-slate-500">Merapikan duplikasi data dengan audit log tersimpan</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleMerge} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">1. Customer Utama (Target yang Dipertahankan) *</label>
            <select
              value={primaryId}
              onChange={(e) => setPrimaryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500"
              required
            >
              <option value="">-- Pilih Customer Utama --</option>
              {customers.filter(c => c.status === 'active').map(c => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} - {c.namaLengkap} ({c.nomorTelepon}) [{c.cabangPendaftaran.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">2. Customer Duplikat (Akan Dinonaktifkan & Histori Dipindahkan) *</label>
            <select
              value={mergedId}
              onChange={(e) => setMergedId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500"
              required
            >
              <option value="">-- Pilih Customer Duplikat --</option>
              {customers.filter(c => c.status === 'active' && c.id !== primaryId).map(c => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} - {c.namaLengkap} ({c.nomorTelepon}) [{c.cabangPendaftaran.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {primaryCustomer && duplicateCustomer && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
              <p className="font-semibold text-slate-800">Ringkasan Tindakan:</p>
              <p className="text-slate-600">
                • Semua transaksi, invoice, dan riwayat treatment dari <strong className="text-rose-600">{duplicateCustomer.namaLengkap} ({duplicateCustomer.customerCode})</strong> akan dialihkan ke profil <strong className="text-emerald-600">{primaryCustomer.namaLengkap} ({primaryCustomer.customerCode})</strong>.
              </p>
              <p className="text-slate-600">• Profil duplikat akan ditandai nonaktif dengan referensi log ke profil utama.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">Alasan Penggabungan (Audit Trail) *</label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Kesalahan pendaftaran kasir di cabang Sudirman, nomor telepon terbukti milik orang yang sama."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500"
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
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Memproses Penggabungan...' : 'Konfirmasi Penggabungan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
