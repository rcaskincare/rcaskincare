import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  History, 
  Edit3, 
  Archive, 
  Trash2,
  Clock, 
  Shield, 
  Building, 
  Check, 
  X,
  AlertCircle,
  FileSpreadsheet,
  UploadCloud,
  Search,
  Building2
} from 'lucide-react';
import { ServiceItem, ServiceCategory, BranchId, Branch } from '../types/index.ts';
import { formatRupiah, formatDateId } from '../lib/formatters.ts';
import { PriceHistoryModal } from '../components/PriceHistoryModal.tsx';
import { exportServicesExcel, downloadServiceTemplate } from '../lib/excelExport.ts';
import { ExcelImportModal } from '../components/ExcelImportModal.tsx';

interface ServicesMasterViewProps {
  services: ServiceItem[];
  branches: Branch[];
  onRefreshData: () => void;
}

export const ServicesMasterView: React.FC<ServicesMasterViewProps> = ({
  services,
  branches,
  onRefreshData
}) => {
  const [selectedServiceForHistory, setSelectedServiceForHistory] = useState<ServiceItem | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [branchFilter, setBranchFilter] = useState<'all' | BranchId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State
  const [kodeJasa, setKodeJasa] = useState('');
  const [namaJasa, setNamaJasa] = useState('');
  const [kategoriJasa, setKategoriJasa] = useState<ServiceCategory>('Facial');
  const [deskripsi, setDeskripsi] = useState('');
  const [hargaDasar, setHargaDasar] = useState<number>(150000);
  const [durasiMenit, setDurasiMenit] = useState<number>(60);
  const [petugasWewenang, setPetugasWewenang] = useState<string>('Dokter SpKK, Dokter Aesthetic, Senior Beautician');
  const [cabangPenyedia, setCabangPenyedia] = useState<BranchId[]>(['spring-hill', 'sudirman', 'pangkalan-balai']);
  const [priceChangeReason, setPriceChangeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchBranch = branchFilter === 'all' || s.cabangPenyedia.includes(branchFilter);
      const matchSearch = s.namaJasa.toLowerCase().includes(searchQuery.toLowerCase()) || s.kodeJasa.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBranch && matchSearch;
    });
  }, [services, branchFilter, searchQuery]);

  const openAddModal = () => {
    setEditingService(null);
    setKodeJasa(`JS-${Date.now().toString().slice(-4)}`);
    setNamaJasa('');
    setKategoriJasa('Facial');
    setDeskripsi('');
    setHargaDasar(150000);
    setDurasiMenit(60);
    setPetugasWewenang('Senior Beautician');
    setCabangPenyedia(['spring-hill', 'sudirman', 'pangkalan-balai']);
    setPriceChangeReason('');
    setError(null);
    setShowFormModal(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setKodeJasa(srv.kodeJasa);
    setNamaJasa(srv.namaJasa);
    setKategoriJasa(srv.kategoriJasa as ServiceCategory);
    setDeskripsi(srv.deskripsi);
    setHargaDasar(srv.hargaDasar);
    setDurasiMenit(srv.durasiMenit);
    setPetugasWewenang(srv.petugasWewenang.join(', '));
    setCabangPenyedia(srv.cabangPenyedia);
    setPriceChangeReason('');
    setError(null);
    setShowFormModal(true);
  };

  const handleBranchToggle = (bId: BranchId) => {
    setCabangPenyedia(prev => 
      prev.includes(bId) ? prev.filter(id => id !== bId) : [...prev, bId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!namaJasa.trim()) {
      setError('Nama layanan jasa klinik wajib diisi');
      return;
    }
    if (hargaDasar <= 0) {
      setError('Harga tarif jasa harus lebih dari 0');
      return;
    }
    if (cabangPenyedia.length === 0) {
      setError('Pilih minimal satu cabang penyedia layanan');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        kodeJasa,
        namaJasa: namaJasa.trim(),
        kategoriJasa,
        deskripsi: deskripsi.trim(),
        hargaDasar: Number(hargaDasar),
        durasiMenit: Number(durasiMenit),
        petugasWewenang: petugasWewenang.split(',').map(s => s.trim()).filter(Boolean),
        cabangPenyedia,
        status: 'active' as const,
        reason: priceChangeReason.trim() || undefined
      };

      let res;
      if (editingService) {
        res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan master jasa');

      setShowFormModal(false);
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveService = async (id: string, name: string) => {
    if (confirm(`Hapus atau arsipkan layanan "${name}"? Jika layanan memiliki histori transaksi, sistem akan otomatis mengarsipkannya agar data transaksi lama tetap utuh.`)) {
      try {
        const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          if (data.archived) {
            alert('Layanan memiliki riwayat transaksi, berhasil diarsipkan.');
          } else {
            alert('Layanan berhasil dihapus permanen.');
          }
          onRefreshData();
        } else {
          alert(data.error || 'Gagal menghapus layanan');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Master Layanan Jasa & Treatment Klinik</h1>
            <span className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-rose-200">
              {services.length} Layanan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan katalog perawatan facial, acne protocol, laser medis, durasi, petugas, dan audit kenaikan tarif
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const bName = branchFilter === 'all' ? 'Semua Cabang' : (branches.find(b => b.id === branchFilter)?.name || branchFilter);
              exportServicesExcel(filteredServices, bName);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Ekspor XLSX</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-2xs transition"
          >
            <UploadCloud className="h-4 w-4 text-rose-600" />
            <span>Import XLSX Jasa</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Layanan Baru</span>
          </button>
        </div>
      </div>

      {/* Search and Branch Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama layanan treatment atau kode jasa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Filter Cabang:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Cabang Tersedia</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name.replace('RCA Skincare - ', '')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Kode</th>
                <th className="px-4 py-3.5 font-semibold">Nama Jasa / Treatment</th>
                <th className="px-4 py-3.5 font-semibold">Kategori</th>
                <th className="px-4 py-3.5 font-semibold text-right">Tarif Dasar</th>
                <th className="px-4 py-3.5 font-semibold text-center">Durasi</th>
                <th className="px-4 py-3.5 font-semibold">Petugas Berwenang</th>
                <th className="px-4 py-3.5 font-semibold">Cabang Tersedia</th>
                <th className="px-4 py-3.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map(srv => (
                <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                    {srv.kodeJasa}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{srv.namaJasa}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{srv.deskripsi}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]">
                      {srv.kategoriJasa}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                    {formatRupiah(srv.hargaDasar)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-600 font-medium">
                    {srv.durasiMenit} menit
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-[11px]">
                    {srv.petugasWewenang.slice(0, 2).join(', ')}
                    {srv.petugasWewenang.length > 2 && '...'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {srv.cabangPenyedia.map(cb => (
                        <span key={cb} className="uppercase font-mono text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {cb === 'spring-hill' ? 'SH' : cb === 'sudirman' ? 'SDR' : 'PKB'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedServiceForHistory(srv)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Riwayat Perubahan Harga"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(srv)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                        title="Edit Layanan"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleArchiveService(srv.id, srv.namaJasa)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Hapus / Arsipkan Layanan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-bold text-slate-800">
                {editingService ? 'Edit Layanan Klinik' : 'Pendaftaran Jasa / Treatment Baru'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kode Layanan</label>
                  <input
                    type="text"
                    required
                    value={kodeJasa}
                    onChange={(e) => setKodeJasa(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kategori</label>
                  <select
                    value={kategoriJasa}
                    onChange={(e) => setKategoriJasa(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    <option value="Facial">Facial</option>
                    <option value="Acne Care">Acne Care</option>
                    <option value="Anti-Aging & Laser">Anti-Aging & Laser</option>
                    <option value="Peeling & Brightening">Peeling & Brightening</option>
                    <option value="Konsultasi Dokter">Konsultasi Dokter</option>
                    <option value="Treatment Khusus">Treatment Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Nama Layanan Jasa / Treatment *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Oxy-Geneo Bright Infusion Facial"
                  value={namaJasa}
                  onChange={(e) => setNamaJasa(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Deskripsi Protokol Perawatan</label>
                <textarea
                  rows={2}
                  placeholder="Langkah medis, fungsi, dan indikasi perawatan..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tarif Dasar (IDR) *</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={hargaDasar}
                    onChange={(e) => setHargaDasar(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Durasi Tindakan (Menit)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    required
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              {editingService && editingService.hargaDasar !== hargaDasar && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <label className="block text-xs font-bold text-amber-900">Alasan Penyesuaian Harga (Audit Trail) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kenaikan biaya ampul impor serum klinik"
                    value={priceChangeReason}
                    onChange={(e) => setPriceChangeReason(e.target.value)}
                    className="mt-1 w-full rounded border border-amber-300 px-3 py-1 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">Petugas Medis Berwenang (Pisahkan Koma)</label>
                <input
                  type="text"
                  value={petugasWewenang}
                  onChange={(e) => setPetugasWewenang(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cabang Penyedia Layanan</label>
                <div className="flex gap-2">
                  {branches.map(b => (
                    <label key={b.id} className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cabangPenyedia.includes(b.id)}
                        onChange={() => handleBranchToggle(b.id)}
                        className="rounded border-slate-300 text-rose-600"
                      />
                      <span>{b.code}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Master Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Audit Modal */}
      <PriceHistoryModal
        isOpen={Boolean(selectedServiceForHistory)}
        onClose={() => setSelectedServiceForHistory(null)}
        service={selectedServiceForHistory}
      />

      {/* Excel Batch Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        type="services"
        onDownloadTemplate={downloadServiceTemplate}
        onSuccess={onRefreshData}
      />

    </div>
  );
};
