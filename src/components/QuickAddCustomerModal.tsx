import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { BranchId, Customer } from '../types/index.ts';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: BranchId;
  onCustomerAdded: (customer: Customer) => void;
}

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen,
  onClose,
  branchId,
  onCustomerAdded
}) => {
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nomorTelepon, setNomorTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [catatanNonmedis, setCatatanNonmedis] = useState('');
  const [persetujuanKomunikasi, setPersetujuanKomunikasi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!namaLengkap.trim()) {
      setError('Nama lengkap customer wajib diisi');
      return;
    }
    if (!nomorTelepon.trim() || nomorTelepon.length < 8) {
      setError('Nomor telepon valid wajib diisi (minimal 8 digit)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaLengkap: namaLengkap.trim(),
          nomorTelepon: nomorTelepon.trim(),
          email: email.trim() || undefined,
          tanggalRegistrasi: new Date().toISOString().slice(0, 10),
          cabangPendaftaran: branchId,
          persetujuanKomunikasi,
          catatanNonmedis: catatanNonmedis.trim() || undefined,
          status: 'active'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan customer');
      }

      onCustomerAdded(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-800">Registrasi Customer Baru di POS</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Ibu Rina Agustina"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Nomor WhatsApp / HP *</label>
            <input
              type="tel"
              required
              placeholder="0812xxxxxxxx"
              value={nomorTelepon}
              onChange={(e) => setNomorTelepon(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email (Opsional)</label>
            <input
              type="email"
              placeholder="customer@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Catatan Non-Medis / Preferensi</label>
            <textarea
              rows={2}
              placeholder="Misal: Lebih suka terapis wanita, langganan treatment sore hari"
              value={catatanNonmedis}
              onChange={(e) => setCatatanNonmedis(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="persetujuan"
              checked={persetujuanKomunikasi}
              onChange={(e) => setPersetujuanKomunikasi(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="persetujuan" className="text-xs text-slate-600">
              Customer menyetujui pengiriman struk digital & info perawatan via WhatsApp/SMS
            </label>
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
              {loading ? 'Menyimpan...' : 'Simpan & Pilih Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
