import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  RotateCcw, 
  FileSpreadsheet, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  X, 
  TrendingDown, 
  TrendingUp, 
  Building,
  Edit2,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { ExpenseIncomeEntry, BranchId, Branch, PaymentMethod, CashAccount } from '../types/index.ts';
import { formatRupiah, formatDateId } from '../lib/formatters.ts';
import { exportExpensesExcel, downloadExpenseTemplate } from '../lib/excelExport.ts';
import { ExcelImportModal } from '../components/ExcelImportModal.tsx';

interface ExpensesViewProps {
  expenses: ExpenseIncomeEntry[];
  branches: Branch[];
  currentBranchId: BranchId;
  currentUserName: string;
  onRefreshData: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  branches,
  currentBranchId,
  currentUserName,
  onRefreshData
}) => {
  const [branchFilter, setBranchFilter] = useState<'all' | BranchId>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'EXPENSE' | 'OTHER_INCOME'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEntryForReversal, setSelectedEntryForReversal] = useState<ExpenseIncomeEntry | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Edit Expense State
  const [editingEntry, setEditingEntry] = useState<ExpenseIncomeEntry | null>(null);
  const [editDeskripsi, setEditDeskripsi] = useState('');
  const [editKategori, setEditKategori] = useState('');
  const [editNominal, setEditNominal] = useState<number>(0);
  const [editBranchId, setEditBranchId] = useState<BranchId>('spring-hill');
  const [editMetode, setEditMetode] = useState<PaymentMethod>('Cash');
  const [editAkunKas, setEditAkunKas] = useState<CashAccount>('Kas Tunai Kasir');
  const [editPersetujuan, setEditPersetujuan] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Add Form State
  const [entryType, setEntryType] = useState<'EXPENSE' | 'OTHER_INCOME'>('EXPENSE');
  const [branchId, setBranchId] = useState<BranchId>(currentBranchId);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kategori, setKategori] = useState('Bahan Treatment Klinis');
  const [deskripsi, setDeskripsi] = useState('');
  const [nominal, setNominal] = useState<number>(100000);
  const [metodePembayaran, setMetodePembayaran] = useState<PaymentMethod>('Cash');
  const [akunKas, setAkunKas] = useState<CashAccount>('Kas Tunai Kasir');
  const [pemberiPersetujuan, setPemberiPersetujuan] = useState('Head Branch Manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredList = expenses.filter(e => {
    const matchBranch = branchFilter === 'all' || e.branchId === branchFilter;
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchBranch && matchType;
  });

  const totalExpense = filteredList.filter(e => e.type === 'EXPENSE' && e.status === 'approved').reduce((acc, e) => acc + e.nominal, 0);
  const totalOtherIncome = filteredList.filter(e => e.type === 'OTHER_INCOME' && e.status === 'approved').reduce((acc, e) => acc + e.nominal, 0);

  const handleOpenEdit = (entry: ExpenseIncomeEntry) => {
    setEditingEntry(entry);
    setEditDeskripsi(entry.deskripsi);
    setEditKategori(entry.kategori);
    setEditNominal(entry.nominal);
    setEditBranchId(entry.branchId);
    setEditMetode(entry.metodePembayaran);
    setEditAkunKas(entry.akunKas);
    setEditPersetujuan(entry.pemberiPersetujuan);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/finance/expenses/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deskripsi: editDeskripsi.trim(),
          kategori: editKategori,
          nominal: Number(editNominal),
          branchId: editBranchId,
          metodePembayaran: editMetode,
          akunKas: editAkunKas,
          pemberiPersetujuan: editPersetujuan.trim()
        })
      });

      if (res.ok) {
        setEditingEntry(null);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteExpense = async (entry: ExpenseIncomeEntry) => {
    if (confirm(`Hapus transaksi ${entry.transactionNumber} (${entry.deskripsi})? Tindakan ini akan menghapus catatan dari buku pengeluaran.`)) {
      try {
        const res = await fetch(`/api/finance/expenses/${entry.id}`, { method: 'DELETE' });
        if (res.ok) {
          onRefreshData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!deskripsi.trim()) {
      setError('Deskripsi pengeluaran/pemasukan wajib diisi');
      return;
    }
    if (nominal <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entryType,
          branchId,
          tanggal,
          kategori,
          deskripsi: deskripsi.trim(),
          nominal: Number(nominal),
          metodePembayaran,
          akunKas,
          petugasInput: currentUserName,
          pemberiPersetujuan: pemberiPersetujuan.trim(),
          status: 'approved'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan pengeluaran');
      }

      setShowAddModal(false);
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryForReversal || !reversalReason.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/finance/expenses/${selectedEntryForReversal.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reversalReason.trim() })
      });
      if (res.ok) {
        setSelectedEntryForReversal(null);
        setReversalReason('');
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Buku Kas & Pengeluaran Operasional</h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {filteredList.length} Catatan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tambah catatan biaya, edit rincian transaksi, hapus atau reversal pengeluaran dengan audit log akuntansi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportExpensesExcel(filteredList, { startDate: '2026-01-01', endDate: '2026-12-31', branchId: branchFilter } as any, branchFilter)}
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
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Pengeluaran / Pemasukan</span>
          </button>
        </div>
      </div>

      {/* KPI Subtotals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800">Total Beban Operasional Disetujui</p>
            <p className="text-xl font-bold text-rose-950 mt-0.5">{formatRupiah(totalExpense)}</p>
          </div>
          <TrendingDown className="h-8 w-8 text-rose-500 opacity-60" />
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800">Pemasukan Lainnya (Non-Sales)</p>
            <p className="text-xl font-bold text-emerald-950 mt-0.5">{formatRupiah(totalOtherIncome)}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-emerald-500 opacity-60" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Cabang:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as any)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Semua Cabang (Konsolidasi)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name.replace('RCA Skincare - ', '')}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              typeFilter === 'EXPENSE' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Hanya Pengeluaran
          </button>
          <button
            onClick={() => setTypeFilter('OTHER_INCOME')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              typeFilter === 'OTHER_INCOME' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Pemasukan Lain
          </button>
        </div>
      </div>

      {/* Expense Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-semibold">No. Dokumen</th>
                <th className="px-4 py-3.5 font-semibold">Tanggal</th>
                <th className="px-4 py-3.5 font-semibold">Cabang</th>
                <th className="px-4 py-3.5 font-semibold">Kategori</th>
                <th className="px-4 py-3.5 font-semibold">Deskripsi Pengeluaran</th>
                <th className="px-4 py-3.5 font-semibold text-right">Nominal</th>
                <th className="px-4 py-3.5 font-semibold">Akun Kas / Bank</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                    {item.transactionNumber}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {formatDateId(item.tanggal)}
                  </td>
                  <td className="px-4 py-3.5 uppercase font-medium text-slate-600">
                    {item.branchId}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {item.kategori}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 max-w-xs">
                    <div>{item.deskripsi}</div>
                    <div className="text-[10px] text-slate-400">Penyetuju: {item.pemberiPersetujuan} · Input: {item.petugasInput}</div>
                  </td>
                  <td className={`px-4 py-3.5 text-right font-bold ${
                    item.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {item.type === 'EXPENSE' ? '-' : '+'}{formatRupiah(item.nominal)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {item.akunKas}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : item.status === 'reversed' 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status === 'approved' && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Edit Catatan Biaya"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {item.status === 'approved' && (
                        <button
                          onClick={() => setSelectedEntryForReversal(item)}
                          className="p-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded"
                          title="Reversal / Batalkan Pengeluaran"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteExpense(item)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT EXPENSE MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Edit Catatan Biaya / Pemasukan</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editingEntry.transactionNumber}</p>
              </div>
              <button onClick={() => setEditingEntry(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Cabang</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kategori</label>
                  <select
                    value={editKategori}
                    onChange={(e) => setEditKategori(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    <option value="Bahan Treatment Klinis">Bahan Treatment Klinis</option>
                    <option value="Listrik & Utilitas">Listrik & Utilitas</option>
                    <option value="Gaji & Insentif Karyawan">Gaji & Insentif Karyawan</option>
                    <option value="Sewa Tempat & Gedung">Sewa Tempat & Gedung</option>
                    <option value="Marketing & Promosi Iklan">Marketing & Promosi Iklan</option>
                    <option value="Logistik & Ekspedisi Pengiriman">Logistik & Ekspedisi</option>
                    <option value="Maintenance Alat Medis">Maintenance Alat Medis</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Deskripsi / Peruntukan Biaya *</label>
                <textarea
                  rows={2}
                  required
                  value={editDeskripsi}
                  onChange={(e) => setEditDeskripsi(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nominal (IDR) *</label>
                  <input
                    type="number"
                    min={1000}
                    step={5000}
                    required
                    value={editNominal}
                    onChange={(e) => setEditNominal(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Akun Kas / Bank</label>
                  <select
                    value={editAkunKas}
                    onChange={(e) => setEditAkunKas(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    <option value="Kas Tunai Kasir">Kas Tunai Kasir</option>
                    <option value="Bank BCA Operasional">Bank BCA Operasional</option>
                    <option value="Bank Mandiri Klinik">Bank Mandiri Klinik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Pemberi Persetujuan</label>
                <input
                  type="text"
                  required
                  value={editPersetujuan}
                  onChange={(e) => setEditPersetujuan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-bold text-slate-800">Catat Pengeluaran / Pemasukan Lain</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Jenis Transaksi</label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="EXPENSE">Pengeluaran Operasional</option>
                    <option value="OTHER_INCOME">Pemasukan Non-Operasional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Cabang Terkait</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name.replace('RCA Skincare - ', '')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    <option value="Bahan Treatment Klinis">Bahan Treatment Klinis</option>
                    <option value="Listrik & Utilitas">Listrik & Utilitas</option>
                    <option value="Gaji & Insentif Karyawan">Gaji & Insentif Karyawan</option>
                    <option value="Sewa Tempat & Gedung">Sewa Tempat & Gedung</option>
                    <option value="Marketing & Promosi Iklan">Marketing & Promosi Iklan</option>
                    <option value="Logistik & Ekspedisi Pengiriman">Logistik & Ekspedisi</option>
                    <option value="Maintenance Alat Medis">Maintenance Alat Medis</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Deskripsi / Peruntukan Transaksi *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Misal: Pembelian jarum mesotherapy dan toner disinfektan untuk klinik"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nominal (IDR) *</label>
                  <input
                    type="number"
                    min={1000}
                    step={5000}
                    required
                    value={nominal}
                    onChange={(e) => setNominal(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Akun Kas / Bank Pemotong</label>
                  <select
                    value={akunKas}
                    onChange={(e) => setAkunKas(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    <option value="Kas Tunai Kasir">Kas Tunai Kasir</option>
                    <option value="Bank BCA Operasional">Bank BCA Operasional</option>
                    <option value="Bank Mandiri Klinik">Bank Mandiri Klinik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Pemberi Persetujuan (Approval)</label>
                <input
                  type="text"
                  required
                  value={pemberiPersetujuan}
                  onChange={(e) => setPemberiPersetujuan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {selectedEntryForReversal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-bold text-slate-800">Reversal Transaksi Pengeluaran</h3>
              <button onClick={() => setSelectedEntryForReversal(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReversal} className="p-6 space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                Data yang sudah disetujui tidak dihapus fisik, melainkan dibatalkan dengan status <strong>REVERSED</strong> pada audit trail akuntansi.
              </div>

              <div>
                <span className="text-xs text-slate-500">Nomor Transaksi:</span>
                <p className="font-mono text-sm font-bold text-slate-800">{selectedEntryForReversal.transactionNumber}</p>
                <p className="text-xs text-slate-600 mt-1">Nominal: {formatRupiah(selectedEntryForReversal.nominal)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Alasan Reversal (Audit Log) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Salah input jumlah kuantitas, kuitansi ganda"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEntryForReversal(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Memproses Reversal...' : 'Konfirmasi Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Batch Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        type="expenses"
        onDownloadTemplate={downloadExpenseTemplate}
        onSuccess={onRefreshData}
      />

    </div>
  );
};
