import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  GitMerge, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar, 
  Building2,
  Eye,
  Edit2,
  Archive,
  Trash2,
  X,
  AlertCircle,
  UploadCloud
} from 'lucide-react';
import { Customer, Branch, BranchId } from '../types/index.ts';
import { formatDateId } from '../lib/formatters.ts';
import { CustomerDetailModal } from '../components/CustomerDetailModal.tsx';
import { CustomerMergeModal } from '../components/CustomerMergeModal.tsx';
import { QuickAddCustomerModal } from '../components/QuickAddCustomerModal.tsx';
import { exportCustomersExcel, downloadCustomerTemplate } from '../lib/excelExport.ts';
import { ExcelImportModal } from '../components/ExcelImportModal.tsx';

interface CustomerCrmViewProps {
  customers: Customer[];
  branches: Branch[];
  currentBranchId: BranchId;
  onRefreshData: () => void;
}

export const CustomerCrmView: React.FC<CustomerCrmViewProps> = ({
  customers,
  branches,
  currentBranchId,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<'all' | BranchId>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editTelepon, setEditTelepon] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTanggalLahir, setEditTanggalLahir] = useState('');
  const [editAlamat, setEditAlamat] = useState('');
  const [editCabang, setEditCabang] = useState<BranchId>('spring-hill');
  const [editPersetujuan, setEditPersetujuan] = useState(true);
  const [editCatatan, setEditCatatan] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchBranch = branchFilter === 'all' || c.cabangPendaftaran === branchFilter;
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        c.namaLengkap.toLowerCase().includes(q) ||
        c.nomorTelepon.includes(q) ||
        c.customerCode.toLowerCase().includes(q);
      return matchBranch && matchSearch;
    });
  }, [customers, branchFilter, search]);

  const handleOpenDetail = (id: string) => {
    setSelectedCustomerId(id);
    setShowDetailModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditNama(c.namaLengkap);
    setEditTelepon(c.nomorTelepon);
    setEditEmail(c.email || '');
    setEditTanggalLahir(c.tanggalLahir || '');
    setEditAlamat(c.alamat || '');
    setEditCabang(c.cabangPendaftaran);
    setEditPersetujuan(c.persetujuanKomunikasi);
    setEditCatatan(c.catatanNonmedis || '');
    setEditStatus(c.status);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditError(null);

    if (!editNama.trim() || !editTelepon.trim()) {
      setEditError('Nama lengkap dan nomor telepon wajib diisi');
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaLengkap: editNama.trim(),
          nomorTelepon: editTelepon.trim(),
          email: editEmail.trim() || undefined,
          tanggalLahir: editTanggalLahir || undefined,
          alamat: editAlamat.trim() || undefined,
          cabangPendaftaran: editCabang,
          persetujuanKomunikasi: editPersetujuan,
          catatanNonmedis: editCatatan.trim() || undefined,
          status: editStatus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan');

      setEditingCustomer(null);
      onRefreshData();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteOrArchive = async (id: string, name: string) => {
    if (confirm(`Hapus atau arsipkan profil customer "${name}"? Jika customer memiliki riwayat transaksi, sistem akan otomatis mengarsipkannya agar data transaksi masa lalu tetap utuh.`)) {
      try {
        const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          if (data.archived) {
            alert('Customer memiliki histori transaksi, berhasil diarsipkan.');
          } else {
            alert('Customer berhasil dihapus permanen.');
          }
          onRefreshData();
        } else {
          alert(data.error || 'Gagal menghapus customer');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Database Pelanggan / CRM</h1>
            <span className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-rose-200">
              {filteredCustomers.length} Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tambah pelanggan baru, edit data kontak, merge duplikat dengan audit log, dan ekspor database
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCustomersExcel(filteredCustomers)}
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
            <span>Import XLSX</span>
          </button>

          <button
            onClick={() => setShowMergeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-2xs transition"
          >
            <GitMerge className="h-4 w-4" />
            <span>Merge Duplikat</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Customer Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama customer, nomor telepon (0812...), atau customer code (RCA-CUST-...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Cabang:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as any)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-rose-500"
          >
            <option value="all">Semua Cabang (Konsolidasi)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name.replace('RCA Skincare - ', '')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Kode Customer</th>
                <th className="px-4 py-3.5 font-semibold">Nama Lengkap</th>
                <th className="px-4 py-3.5 font-semibold">Nomor WhatsApp</th>
                <th className="px-4 py-3.5 font-semibold">Cabang Registrasi</th>
                <th className="px-4 py-3.5 font-semibold">Tgl Terdaftar</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Aksi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Tidak ditemukan data customer dengan filter pencarian tersebut.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                      {c.customerCode}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div>{c.namaLengkap}</div>
                      {c.email && <div className="text-[11px] font-normal text-slate-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {c.nomorTelepon}
                    </td>
                    <td className="px-4 py-3.5 uppercase font-medium text-slate-600">
                      {c.cabangPendaftaran}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDateId(c.tanggalRegistrasi)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(c.id)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                          title="Lihat 6 Tab Histori & Profil Lengkap"
                        >
                          <Eye className="h-3.5 w-3.5 text-rose-600" />
                          <span>Histori</span>
                        </button>
                        
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Edit Profil Customer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteOrArchive(c.id, c.namaLengkap)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Hapus / Arsipkan Customer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Edit Profil Customer</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editingCustomer.customerCode} · v{editingCustomer.version}</p>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {editError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nomor WhatsApp / HP *</label>
                  <input
                    type="tel"
                    required
                    value={editTelepon}
                    onChange={(e) => setEditTelepon(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editTanggalLahir}
                    onChange={(e) => setEditTanggalLahir(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status Akun</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif / Terarsip</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Alamat Tempat Tinggal</label>
                <input
                  type="text"
                  value={editAlamat}
                  onChange={(e) => setEditAlamat(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Cabang Pendaftaran</label>
                <select
                  value={editCabang}
                  onChange={(e) => setEditCabang(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Catatan Non-Medis & Preferensi</label>
                <textarea
                  rows={2}
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPersetujuan"
                  checked={editPersetujuan}
                  onChange={(e) => setEditPersetujuan(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600"
                />
                <label htmlFor="editPersetujuan" className="text-xs text-slate-600">
                  Customer menyetujui komunikasi via WhatsApp/SMS
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer 6-Tab Detail Modal */}
      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        customerId={selectedCustomerId}
        branches={branches}
      />

      {/* Merge Duplicates Modal */}
      <CustomerMergeModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        customers={customers}
        onMergedSuccess={onRefreshData}
      />

      {/* Quick Add Modal */}
      <QuickAddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        branchId={currentBranchId}
        onCustomerAdded={() => onRefreshData()}
      />

      {/* Excel Batch Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        type="customers"
        onDownloadTemplate={downloadCustomerTemplate}
        onSuccess={onRefreshData}
      />

    </div>
  );
};
