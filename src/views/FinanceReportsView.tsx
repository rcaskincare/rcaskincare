import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Building2, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  RefreshCw, 
  Filter, 
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertCircle,
  Eye,
  CreditCard
} from 'lucide-react';
import { FinancialFilter, Branch, BranchId, Transaction, PaymentMethod, CashAccount } from '../types/index.ts';
import { formatRupiah, formatDateTimeId, formatDateId } from '../lib/formatters.ts';
import { generateFinancialStatementsPdf, generateThermalReceipt, generateInvoiceA4 } from '../lib/pdfGenerator.ts';
import { exportProfitLossExcel, exportTransactionsExcel } from '../lib/excelExport.ts';

interface FinanceReportsViewProps {
  branches: Branch[];
  currentBranchId: BranchId;
  currentUserName: string;
  onShowPdfPreview: (doc: any, filename: string, title: string) => void;
}

export const FinanceReportsView: React.FC<FinanceReportsViewProps> = ({
  branches,
  currentBranchId,
  currentUserName,
  onShowPdfPreview
}) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'pnl' | 'cashflow' | 'transactions' | 'shifts'>('kpi');
  
  // Filter State
  const [filter, setFilter] = useState<FinancialFilter>({
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    periodMode: 'monthly',
    selectedMonth: 10,
    selectedYear: 2026,
    branchId: 'all',
    kategori: 'all',
    jenisTransaksi: 'all',
    metodePembayaran: 'all',
    statusTransaksi: 'all'
  });

  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);

  // Void and Refund state
  const [voidTrxId, setVoidTrxId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [refundTrx, setRefundTrx] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        fetch('/api/finance/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filter)
        }),
        fetch(`/api/finance/shifts?branchId=${filter.branchId}`)
      ]);
      if (rRes.ok) setReportData(await rRes.json());
      if (sRes.ok) setShifts(await sRes.json());
    } catch (err) {
      console.error('Failed to load financial reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filter.periodMode, filter.selectedMonth, filter.selectedYear, filter.branchId]);

  // Handle Preset Period Mode Change
  const handlePeriodPreset = (mode: 'today' | 'monthly' | 'yearly' | 'custom') => {
    const today = new Date().toISOString().slice(0, 10);
    if (mode === 'today') {
      setFilter(prev => ({ ...prev, periodMode: mode, startDate: today, endDate: today }));
    } else if (mode === 'monthly') {
      const monthStr = String(filter.selectedMonth).padStart(2, '0');
      const start = `${filter.selectedYear}-${monthStr}-01`;
      const end = `${filter.selectedYear}-${monthStr}-31`;
      setFilter(prev => ({ ...prev, periodMode: mode, startDate: start, endDate: end }));
    } else if (mode === 'yearly') {
      const start = `${filter.selectedYear}-01-01`;
      const end = `${filter.selectedYear}-12-31`;
      setFilter(prev => ({ ...prev, periodMode: mode, startDate: start, endDate: end }));
    } else {
      setFilter(prev => ({ ...prev, periodMode: mode }));
    }
  };

  const handleResetFilter = () => {
    setFilter({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      periodMode: 'monthly',
      selectedMonth: 10,
      selectedYear: 2026,
      branchId: 'all',
      kategori: 'all',
      jenisTransaksi: 'all',
      metodePembayaran: 'all',
      statusTransaksi: 'all'
    });
  };

  const activeBranchName = filter.branchId === 'all' 
    ? 'Konsolidasi 3 Cabang' 
    : (branches.find(b => b.id === filter.branchId)?.name || filter.branchId);

  // PDF & Excel triggers
  const handleDownloadPdf = () => {
    if (!reportData) return;
    const doc = generateFinancialStatementsPdf(reportData, filter, activeBranchName, currentUserName);
    onShowPdfPreview(doc, `RCA_Laporan_Keuangan_${filter.branchId}_${filter.startDate}_${filter.endDate}.pdf`, 'Laporan Keuangan & Laba Rugi');
  };

  const handleExportExcelPnl = () => {
    if (!reportData) return;
    exportProfitLossExcel(reportData, filter, activeBranchName);
  };

  const handleExportExcelSales = () => {
    if (!reportData) return;
    exportTransactionsExcel(reportData.filteredTransactions || [], filter, activeBranchName);
  };

  // Transaction Actions: Void & Refund
  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTrxId || !voidReason.trim()) return;
    try {
      const res = await fetch(`/api/pos/transactions/${voidTrxId}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason.trim() })
      });
      if (res.ok) {
        setVoidTrxId(null);
        setVoidReason('');
        loadReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTrx || !refundReason.trim() || refundAmount <= 0) return;
    try {
      const res = await fetch(`/api/pos/transactions/${refundTrx.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(refundAmount),
          reason: refundReason.trim(),
          refundItems: refundTrx.items.map(it => ({ itemId: it.id, qty: it.kuantitas, amount: it.subtotal })),
          restoreStock: true
        })
      });
      if (res.ok) {
        setRefundTrx(null);
        setRefundReason('');
        loadReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const printReceipt = (trx: Transaction, format: '58mm' | '80mm' | 'a4') => {
    const branchObj = branches.find(b => b.id === trx.branchId) || branches[0];
    if (format === 'a4') {
      const doc = generateInvoiceA4(trx, branchObj);
      onShowPdfPreview(doc, `Invoice_${trx.invoiceNumber.replace(/\//g, '_')}_A4.pdf`, 'Invoice A4 Resmi');
    } else {
      const doc = generateThermalReceipt(trx, branchObj, format);
      onShowPdfPreview(doc, `Struk_${trx.invoiceNumber.replace(/\//g, '_')}_${format}.pdf`, `Struk Kasir ${format}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Laporan Keuangan & Akuntansi Klinik</h1>
            <span className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-rose-200">
              {activeBranchName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit omzet penjualan, HPP produk, margin jasa, laba kotor, laba bersih, dan arus kas per cabang
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <FileText className="h-4 w-4 text-rose-600" />
            <span>Unduh PDF Laporan</span>
          </button>

          <button
            onClick={handleExportExcelPnl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Ekspor XLSX Laba Rugi</span>
          </button>

          <button
            onClick={handleExportExcelSales}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            <span>Ekspor XLSX Penjualan</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['today', 'monthly', 'yearly', 'custom'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => handlePeriodPreset(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition capitalize ${
                  filter.periodMode === mode ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'today' ? 'Hari Ini' : mode === 'monthly' ? 'Bulanan' : mode === 'yearly' ? 'Tahunan' : 'Custom'}
              </button>
            ))}
          </div>

          {/* Month / Year Pickers if monthly or yearly */}
          {filter.periodMode === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={filter.selectedMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  const mStr = String(m).padStart(2, '0');
                  setFilter(prev => ({
                    ...prev,
                    selectedMonth: m,
                    startDate: `${prev.selectedYear}-${mStr}-01`,
                    endDate: `${prev.selectedYear}-${mStr}-31`
                  }));
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium"
              >
                {[
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ].map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>{mName}</option>
                ))}
              </select>

              <select
                value={filter.selectedYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  const mStr = String(filter.selectedMonth).padStart(2, '0');
                  setFilter(prev => ({
                    ...prev,
                    selectedYear: y,
                    startDate: `${y}-${mStr}-01`,
                    endDate: `${y}-${mStr}-31`
                  }));
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          )}

          {/* Date range picker if custom */}
          {filter.periodMode === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Second Row: Specific Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filter Cabang</label>
            <select
              value={filter.branchId}
              onChange={(e) => setFilter(prev => ({ ...prev, branchId: e.target.value as any }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium"
            >
              <option value="all">Semua Cabang (Konsolidasi)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name.replace('RCA Skincare - ', '')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Metode Pembayaran</label>
            <select
              value={filter.metodePembayaran}
              onChange={(e) => setFilter(prev => ({ ...prev, metodePembayaran: e.target.value as any }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="all">Semua Metode Bayar</option>
              <option value="Cash">Cash (Tunai)</option>
              <option value="Transfer BCA">Transfer BCA</option>
              <option value="QRIS">QRIS</option>
              <option value="Mandiri EDC">Mandiri EDC</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Transaksi</label>
            <select
              value={filter.statusTransaksi}
              onChange={(e) => setFilter(prev => ({ ...prev, statusTransaksi: e.target.value as any }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="all">Semua Status</option>
              <option value="COMPLETED">Selesai (Completed)</option>
              <option value="REFUNDED">Di-Refund</option>
              <option value="VOID">Dibatalkan (Void)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kategori Beban</label>
            <select
              value={filter.kategori}
              onChange={(e) => setFilter(prev => ({ ...prev, kategori: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="all">Semua Kategori Beban</option>
              <option value="Bahan Treatment Klinis">Bahan Treatment</option>
              <option value="Listrik & Utilitas">Listrik & Utilitas</option>
              <option value="Gaji & Insentif Karyawan">Gaji Karyawan</option>
              <option value="Sewa Tempat & Gedung">Sewa Tempat</option>
              <option value="Marketing & Promosi Iklan">Marketing & Iklan</option>
              <option value="Logistik & Ekspedisi Pengiriman">Logistik</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS */}
      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Card 1: Total Omzet */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Omzet Penjualan</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{formatRupiah(reportData.kpi.totalOmzet)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{reportData.kpi.jumlahTransaksi} Transaksi Selesai</p>
          </div>

          {/* Card 2: Pendapatan Jasa vs Produk */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jasa Treatment vs Produk</p>
            <p className="mt-1 text-xs font-bold text-rose-600">Jasa: {formatRupiah(reportData.kpi.pendapatanJasa)}</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">Produk: {formatRupiah(reportData.kpi.pendapatanProduk)}</p>
          </div>

          {/* Card 3: HPP Persediaan */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Harga Pokok Penjualan (HPP)</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{formatRupiah(reportData.kpi.hpp)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Unit modal barang skincare</p>
          </div>

          {/* Card 4: Laba Kotor */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Laba Kotor (Gross Profit)</p>
            <p className="mt-1 text-lg font-bold text-emerald-950">{formatRupiah(reportData.kpi.labaKotor)}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Margin: {((reportData.kpi.labaKotor / (reportData.kpi.totalOmzet || 1)) * 100).toFixed(1)}%</p>
          </div>

          {/* Card 5: Laba Bersih */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-2xs">
            <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Estimasi Laba Bersih</p>
            <p className="mt-1 text-lg font-bold text-rose-950">{formatRupiah(reportData.kpi.labaRugiBersih)}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">Setelah beban: {formatRupiah(reportData.kpi.totalPengeluaran)}</p>
          </div>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-xl">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'kpi' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ringkasan & Grafik Performa
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'pnl' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Laporan Laba Rugi (P&L)
        </button>
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'cashflow' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Arus Kas & Saldo Akun Rekening
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'transactions' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tabel Transaksi Terkini ({reportData?.filteredTransactions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'shifts' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rekonsiliasi Kasir & Shift ({shifts.length})
        </button>
      </div>

      {/* TAB CONTENT AREA */}
      {reportData && (
        <div className="space-y-6">
          
          {/* TAB 1: KPI & CHARTS */}
          {activeTab === 'kpi' && (
            <div className="space-y-6">
              {/* Branch Comparison Table */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Perbandingan Performa 3 Cabang RCA Skincare
                  </h4>
                  <span className="text-[11px] text-slate-400">Palembang & Banyuasin</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Cabang Klinik</th>
                        <th className="px-4 py-3 font-semibold text-right">Omzet Total</th>
                        <th className="px-4 py-3 font-semibold text-right">Penjualan Jasa</th>
                        <th className="px-4 py-3 font-semibold text-right">Penjualan Produk</th>
                        <th className="px-4 py-3 font-semibold text-center">Jumlah Transaksi</th>
                        <th className="px-4 py-3 font-semibold text-right">Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branches.map(b => {
                        const perf = reportData.branchPerformance[b.id] || { omzet: 0, productSales: 0, serviceSales: 0, trxCount: 0 };
                        const share = reportData.kpi.totalOmzet > 0 ? ((perf.omzet / reportData.kpi.totalOmzet) * 100).toFixed(1) : '0';

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              <div>{b.name}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{b.address}</div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                              {formatRupiah(perf.omzet)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-rose-600">
                              {formatRupiah(perf.serviceSales)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                              {formatRupiah(perf.productSales)}
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                              {perf.trxCount}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span className="inline-block bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                                {share}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Method Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Rekonsiliasi Metode Pembayaran
                  </h4>
                  <div className="space-y-2.5">
                    {Object.entries(reportData.breakdownMetodePembayaran).map(([m, val]) => (
                      <div key={m} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-700">{m}</span>
                        <span className="font-bold text-slate-900">{formatRupiah(val as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Beban Pengeluaran Berdasarkan Kategori
                  </h4>
                  <div className="space-y-2.5">
                    {Object.keys(reportData.breakdownKategoriPengeluaran).length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">Tidak ada catatan pengeluaran pada filter ini.</p>
                    ) : (
                      Object.entries(reportData.breakdownKategoriPengeluaran).map(([cat, val]) => (
                        <div key={cat} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                          <span className="font-semibold text-slate-700">{cat}</span>
                          <span className="font-bold text-rose-600">{formatRupiah(val as number)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LABA RUGI (P&L) */}
          {activeTab === 'pnl' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs max-w-4xl mx-auto space-y-4">
              <div className="border-b border-slate-200 pb-4 text-center">
                <h3 className="text-base font-bold text-slate-900">RCA SKINCARE CLINIC</h3>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cabang: {activeBranchName} · Periode: {filter.startDate} s/d {filter.endDate} (WIB)
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Revenue */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-2 rounded">
                    <span>1. PENDAPATAN OPERASIONAL</span>
                    <span>NOMINAL (IDR)</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-700 py-1">
                    <span>Penjualan Bersih Produk Skincare</span>
                    <span className="font-semibold">{formatRupiah(reportData.kpi.pendapatanProduk)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-700 py-1">
                    <span>Pendapatan Bersih Layanan Jasa & Treatment</span>
                    <span className="font-semibold">{formatRupiah(reportData.kpi.pendapatanJasa)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500 py-1 border-t border-slate-100">
                    <span>Total Penjualan Kotor (Gross Sales)</span>
                    <span>{formatRupiah(reportData.kpi.totalOmzet + reportData.kpi.totalDiskon)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-rose-600 py-1">
                    <span>Dikurangi: Diskon & Potongan Promo</span>
                    <span>-{formatRupiah(reportData.kpi.totalDiskon)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pl-4 py-1.5 border-t border-slate-200">
                    <span>TOTAL PENJUALAN BERSIH (NET REVENUE)</span>
                    <span className="text-sm">{formatRupiah(reportData.kpi.totalOmzet)}</span>
                  </div>
                </div>

                {/* 2. COGS */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-2 rounded">
                    <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-700 py-1">
                    <span>Beban Pokok Persediaan Produk Skincare Terjual</span>
                    <span className="font-semibold">-{formatRupiah(reportData.kpi.hpp)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-200">
                    <span>LABA KOTOR (GROSS PROFIT)</span>
                    <span className="text-sm font-extrabold">{formatRupiah(reportData.kpi.labaKotor)}</span>
                  </div>
                </div>

                {/* 3. Operating Expenses */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-2 rounded">
                    <span>3. BEBAN PENGELUARAN OPERASIONAL</span>
                    <span></span>
                  </div>
                  {Object.entries(reportData.breakdownKategoriPengeluaran).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between pl-4 text-slate-700 py-1">
                      <span>{cat}</span>
                      <span className="font-semibold text-rose-600">-{formatRupiah(val as number)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-800 pl-4 py-1.5 border-t border-slate-200">
                    <span>Total Beban Operasional</span>
                    <span className="text-rose-600">-{formatRupiah(reportData.kpi.totalPengeluaran)}</span>
                  </div>
                </div>

                {/* 4. Other Income & Refund */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-2 rounded">
                    <span>4. PENDAPATAN & BEBAN LAIN-LAIN</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-700 py-1">
                    <span>Pemasukan Non-Operasional / Komisi</span>
                    <span className="font-semibold text-emerald-600">+{formatRupiah(reportData.kpi.pemasukanLainnya)}</span>
                  </div>
                  {reportData.kpi.totalRefund > 0 && (
                    <div className="flex justify-between pl-4 text-rose-600 py-1">
                      <span>Beban Refund & Retur Penjualan</span>
                      <span className="font-semibold">-{formatRupiah(reportData.kpi.totalRefund)}</span>
                    </div>
                  )}
                </div>

                {/* NET PROFIT */}
                <div className="flex justify-between font-extrabold text-base text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-200 mt-4">
                  <span>ESTIMASI LABA / RUGI BERSIH (NET PROFIT)</span>
                  <span className="text-lg">{formatRupiah(reportData.kpi.labaRugiBersih)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARUS KAS & SALDO AKUN */}
          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              {/* Account Balances Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Saldo Kas Tunai Kasir</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-slate-900">{formatRupiah(reportData.kpi.saldoKasTunai)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Petty cash fisik laci kasir</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Saldo Bank BCA Operasional</span>
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-slate-900">{formatRupiah(reportData.kpi.saldoBankBCA)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Rekening penampungan QRIS & Transfer</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Saldo Bank Mandiri Klinik</span>
                    <Building2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-slate-900">{formatRupiah(reportData.kpi.saldoBankMandiri)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Settlement mesin EDC Mandiri</p>
                </div>
              </div>

              {/* Cash Inflow vs Outflow */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Ringkasan Arus Kas Masuk & Keluar Periode Ini
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Penerimaan Kas & Bank dari Penjualan (Cash Inflow)</span>
                    <span className="font-bold text-emerald-600">+{formatRupiah(reportData.kpi.penerimaanKas)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Penerimaan Pemasukan Lainnya</span>
                    <span className="font-bold text-emerald-600">+{formatRupiah(reportData.kpi.pemasukanLainnya)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Total Pengeluaran Kas Operasional (Cash Outflow)</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(reportData.kpi.totalPengeluaran)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Pengembalian Dana Kas Refund (Cash Refund)</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(reportData.kpi.totalRefund)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-extrabold text-sm text-slate-900">
                    <span>Arus Kas Bersih (Net Cash Flow)</span>
                    <span className="text-emerald-700">
                      {formatRupiah(reportData.kpi.penerimaanKas + reportData.kpi.pemasukanLainnya - reportData.kpi.totalPengeluaran - reportData.kpi.totalRefund)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSAKSI TERKINI */}
          {activeTab === 'transactions' && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">No. Invoice</th>
                      <th className="px-4 py-3.5 font-semibold">Tanggal</th>
                      <th className="px-4 py-3.5 font-semibold">Cabang</th>
                      <th className="px-4 py-3.5 font-semibold">Pelanggan</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Total Tagihan</th>
                      <th className="px-4 py-3.5 font-semibold">Metode</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Cetak & Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.filteredTransactions?.map((t: Transaction) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                          {t.invoiceNumber}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {formatDateTimeId(t.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 uppercase font-medium text-slate-600">
                          {t.branchId}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800">
                          <div>{t.customerSnapshot?.nama || (t.isWalkIn ? 'Walk-In Guest' : 'Member')}</div>
                          <div className="text-[10px] text-slate-400">{t.items.length} item perawatan</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {formatRupiah(t.totalTagihan)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {t.metodePembayaran}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.status === 'COMPLETED' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : t.status === 'REFUNDED' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => printReceipt(t, '80mm')}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Cetak Struk Thermal 80mm"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => printReceipt(t, 'a4')}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Cetak Invoice A4"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {t.status === 'COMPLETED' && (
                              <>
                                <button
                                  onClick={() => {
                                    setRefundTrx(t);
                                    setRefundAmount(t.totalTagihan);
                                    setRefundReason('');
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                  title="Refund Transaksi"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setVoidTrxId(t.id);
                                    setVoidReason('');
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Void / Batalkan Transaksi"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SHIFTS */}
          {activeTab === 'shifts' && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">Cabang</th>
                    <th className="px-4 py-3.5 font-semibold">Kasir Bertugas</th>
                    <th className="px-4 py-3.5 font-semibold">Waktu Mulai</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Modal Awal</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Penjualan Tunai</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Penjualan Non-Tunai</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Pengeluaran Kas</th>
                    <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shifts.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 uppercase font-medium text-slate-700">{s.branchId}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{s.kasirName}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDateTimeId(s.startTime)}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700">{formatRupiah(s.modalAwal)}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">{formatRupiah(s.totalPenjualanCash)}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-blue-600">{formatRupiah(s.totalPenjualanNonCash)}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-rose-600">{formatRupiah(s.totalPengeluaranKas)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status === 'open' ? 'Shift Terbuka' : 'Ditutup'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Void Modal */}
      {voidTrxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Pembatalan Transaksi (Void)</h3>
            <p className="text-xs text-slate-600">
              Transaksi yang di-void akan memulihkan stok produk kembali ke gudang dan dicatat dalam audit log.
            </p>
            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Alasan Pembatalan *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Misal: Customer membatalkan sebelum treatment dimulai"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoidTrxId(null)}
                  className="rounded px-3 py-1.5 text-xs text-slate-600 border border-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                >
                  Konfirmasi Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Refund Transaksi Penjualan</h3>
            <p className="text-xs text-slate-600 font-mono">Invoice: {refundTrx.invoiceNumber}</p>
            <form onSubmit={handleConfirmRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Nominal Refund (IDR) *</label>
                <input
                  type="number"
                  min={1000}
                  max={refundTrx.totalTagihan}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Alasan Refund (Audit Log) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Misal: Retur produk botol rusak atau ketidakcocokan terapi"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundTrx(null)}
                  className="rounded px-3 py-1.5 text-xs text-slate-600 border border-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                >
                  Konfirmasi Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
