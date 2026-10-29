import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Sparkles, 
  Clock, 
  CreditCard, 
  RotateCcw, 
  FileText,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Customer, Branch } from '../types/index.ts';
import { formatRupiah, formatDateTimeId, formatDateId } from '../lib/formatters.ts';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  branches: Branch[];
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customerId,
  branches
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'produk' | 'jasa' | 'kunjungan' | 'pembayaran' | 'refund'>('ringkasan');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      loadCustomerData(customerId);
    }
  }, [isOpen, customerId]);

  const loadCustomerData = async (id: string) => {
    setLoading(true);
    try {
      const [cRes, hRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/customers/${id}/history`)
      ]);
      if (cRes.ok && hRes.ok) {
        setCustomer(await cRes.json());
        setHistory(await hRes.json());
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold text-lg">
              {customer?.namaLengkap ? customer.namaLengkap.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{customer?.namaLengkap || 'Memuat Customer...'}</h3>
                <span className="font-mono text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {customer?.customerCode}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${customer?.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {customer?.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Terdaftar sejak: {formatDateId(customer?.tanggalRegistrasi)} · Cabang Pendaftaran: {customer?.cabangPendaftaran?.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === 'ringkasan' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ringkasan & Profil
          </button>
          <button
            onClick={() => setActiveTab('produk')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === 'produk' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pembelian Produk ({history?.productPurchases?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('jasa')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === 'jasa' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Jasa & Treatment ({history?.serviceTreatments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('kunjungan')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === 'kunjungan' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Kunjungan ({history?.visitCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('pembayaran')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === 'pembayaran' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Pembayaran
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeTab === 'refund' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Refund & Retur ({history?.refunds?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <span className="text-sm">Memuat data histori pelanggan...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: RINGKASAN */}
              {activeTab === 'ringkasan' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                      <p className="text-xs font-medium text-slate-500">Total Nilai Belanja</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{formatRupiah(history?.totalSpent)}</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">Lifetime Customer Value</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                      <p className="text-xs font-medium text-slate-500">Total Kunjungan</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{history?.visitCount || 0} Kali</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Frekuensi Transaksi</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                      <p className="text-xs font-medium text-slate-500">Kunjungan Terakhir</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{formatDateId(history?.lastVisit) || 'Belum ada'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Status: Aktif Berkala</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                      <p className="text-xs font-medium text-slate-500">Cabang Favorit</p>
                      <p className="mt-1 text-sm font-bold text-rose-600 uppercase">{history?.favoriteBranch || '-'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Layanan: {history?.topService}</p>
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Informasi Kontak & Biodata</h4>
                      <dl className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <dt className="text-slate-500">Nomor Telepon / WhatsApp</dt>
                          <dd className="font-semibold text-slate-800">{customer?.nomorTelepon}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <dt className="text-slate-500">Email</dt>
                          <dd className="font-medium text-slate-800">{customer?.email || '-'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <dt className="text-slate-500">Tanggal Lahir</dt>
                          <dd className="font-medium text-slate-800">{formatDateId(customer?.tanggalLahir) || '-'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <dt className="text-slate-500">Alamat Lengkap</dt>
                          <dd className="font-medium text-slate-800 text-right max-w-xs">{customer?.alamat || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Izin Pesan Edukasi & Promo</dt>
                          <dd className="font-medium text-slate-800">{customer?.persetujuanKomunikasi ? 'Disetujui' : 'Tidak disetujui'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Catatan Non-Medis & Preferensi</h4>
                        <div className="rounded-lg bg-amber-50/60 border border-amber-200/80 p-3.5 text-xs text-amber-900 leading-relaxed">
                          {customer?.catatanNonmedis || 'Belum ada catatan preferensi pelanggan.'}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 italic">
                          *Catatan medis dan resep obat tersimpan aman di rekam medis terpisah.
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                        ID Sistem: <span className="font-mono text-slate-600">{customer?.id}</span> · Versi Data: v{customer?.version}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PEMBELIAN PRODUK */}
              {activeTab === 'produk' && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">No. Invoice</th>
                        <th className="px-4 py-3">Produk Skincare</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Harga Satuan</th>
                        <th className="px-4 py-3 text-right">Diskon</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history?.productPurchases?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Belum ada riwayat pembelian produk.</td>
                        </tr>
                      ) : (
                        history?.productPurchases?.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 text-slate-600">{formatDateTimeId(p.date)}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{p.invoiceNumber}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{p.item.snapshotNama}</td>
                            <td className="px-4 py-3 text-center font-semibold">{p.item.kuantitas}</td>
                            <td className="px-4 py-3 text-right">{formatRupiah(p.item.snapshotHargaSatuan)}</td>
                            <td className="px-4 py-3 text-right text-rose-600">{p.item.diskon > 0 ? `-${formatRupiah(p.item.diskon)}` : '-'}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(p.item.subtotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: JASA & TREATMENT */}
              {activeTab === 'jasa' && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">No. Invoice</th>
                        <th className="px-4 py-3">Layanan Treatment</th>
                        <th className="px-4 py-3">Dokter / Petugas</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Tarif</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history?.serviceTreatments?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Belum ada riwayat jasa/treatment.</td>
                        </tr>
                      ) : (
                        history?.serviceTreatments?.map((s: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 text-slate-600">{formatDateTimeId(s.date)}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{s.invoiceNumber}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{s.item.snapshotNama}</td>
                            <td className="px-4 py-3 text-slate-600">{s.dokter || 'Beautician'}</td>
                            <td className="px-4 py-3 text-center font-semibold">{s.item.kuantitas}</td>
                            <td className="px-4 py-3 text-right">{formatRupiah(s.item.snapshotHargaSatuan)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(s.item.subtotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: RIWAYAT KUNJUNGAN */}
              {activeTab === 'kunjungan' && (
                <div className="space-y-3">
                  {history?.transactions?.map((t: any) => (
                    <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{t.invoiceNumber}</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-medium">{t.branchId}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDateTimeId(t.createdAt)} · Kasir: {t.kasirName} · {t.items.length} Item Perawatan/Produk
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">Total Tagihan</p>
                        <p className="text-sm font-bold text-slate-900">{formatRupiah(t.totalTagihan)}</p>
                        <p className="text-[11px] text-slate-500">{t.metodePembayaran}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: RIWAYAT PEMBAYARAN */}
              {activeTab === 'pembayaran' && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">No. Invoice</th>
                        <th className="px-4 py-3">Cabang</th>
                        <th className="px-4 py-3">Metode Bayar</th>
                        <th className="px-4 py-3 text-right">Nominal</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history?.payments?.map((pm: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 text-slate-600">{formatDateTimeId(pm.date)}</td>
                          <td className="px-4 py-3 font-mono text-slate-700">{pm.invoiceNumber}</td>
                          <td className="px-4 py-3 uppercase text-slate-600">{pm.branchId}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{pm.method}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(pm.total)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${pm.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              {pm.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 6: REFUND & RETUR */}
              {activeTab === 'refund' && (
                <div className="space-y-4">
                  {history?.refunds?.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-xs">
                      Tidak ada riwayat refund atau retur untuk pelanggan ini.
                    </div>
                  ) : (
                    history?.refunds?.map((rf: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-800">Refund Ref: {rf.invoiceNumber}</span>
                            <span className="ml-2 text-xs text-slate-500">{formatDateTimeId(rf.date)}</span>
                          </div>
                          <span className="text-sm font-bold text-amber-700">
                            -{formatRupiah(rf.refundAmount)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-2">
                          <span className="font-semibold">Alasan Refund:</span> {rf.reason}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
