import * as XLSX from 'xlsx';
import { Product, Transaction, ExpenseIncomeEntry, Customer, FinancialFilter, ServiceItem } from '../types/index.ts';
import { formatRupiah, formatDateTimeId } from './formatters.ts';

// 1. Stock Opname Excel - Columns strictly: No, Nama, Jenis, Merk Produk, Jumlah, Harga Modal, Harga Jual, Keterangan
export function exportStockOpnameExcel(products: Product[], branchId: string, branchName: string) {
  const metadata = [
    ['RCA SKINCARE MANAGEMENT SYSTEM'],
    ['LAPORAN STOCK OPNAME & NILAI PERSEDIAAN'],
    [`Cabang: ${branchName}`],
    [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} WIB`],
    [] // blank row
  ];

  const rows = products.map((p, idx) => {
    const qty = branchId === 'all'
      ? Object.values(p.stokPerCabang).reduce((a, b) => a + b, 0)
      : ((p.stokPerCabang as Record<string, number>)[branchId] || 0);

    return {
      'No': idx + 1,
      'Nama': p.namaProduk,
      'Jenis': p.kategori,
      'Merk Produk': p.merk,
      'Jumlah': qty,
      'Harga Modal': p.hargaModal,
      'Harga Jual': p.hargaJual,
      'Keterangan': qty <= p.minStok ? 'Perlu Restock' : 'Stok Aman'
    };
  });

  const ws = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A6' });

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 35 }, // Nama
    { wch: 18 }, // Jenis
    { wch: 22 }, // Merk
    { wch: 10 }, // Jumlah
    { wch: 16 }, // Harga Modal
    { wch: 16 }, // Harga Jual
    { wch: 18 }  // Keterangan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Opname');

  const filename = `RCA_Stock_Opname_${branchName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 2. Sales Transactions Excel
export function exportTransactionsExcel(transactions: Transaction[], filter: FinancialFilter, branchName: string) {
  const metadata = [
    ['RCA SKINCARE MANAGEMENT SYSTEM'],
    ['LAPORAN TRANSAKSI PENJUALAN & JASA KLINIK'],
    [`Cabang: ${branchName}`],
    [`Periode: ${filter.startDate} s/d ${filter.endDate}`],
    []
  ];

  const rows = transactions.map((t, idx) => ({
    'No': idx + 1,
    'No Invoice': t.invoiceNumber,
    'Tanggal Transaksi': formatDateTimeId(t.createdAt),
    'Cabang': t.branchId.toUpperCase(),
    'Pelanggan': t.customerSnapshot?.nama || (t.isWalkIn ? 'Walk-in Guest' : '-'),
    'Total Produk': t.subtotalProduk,
    'Total Jasa': t.subtotalJasa,
    'Total Diskon': t.totalDiskon,
    'Total Tagihan': t.totalTagihan,
    'HPP': t.totalHpp,
    'Laba Kotor': (t.totalTagihan - t.totalHpp),
    'Metode Bayar': t.metodePembayaran,
    'Akun Kas': t.akunKas,
    'Status': t.status,
    'Kasir': t.kasirName
  }));

  const ws = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A6' });

  ws['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 25 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 20 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi Penjualan');

  const filename = `RCA_Laporan_Penjualan_${branchName.replace(/\s+/g, '_')}_${filter.startDate}_${filter.endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 3. Financial Statements (Laba Rugi & Arus Kas) Excel
export function exportProfitLossExcel(reportData: any, filter: FinancialFilter, branchName: string) {
  const pnlData = [
    ['RCA SKINCARE MANAGEMENT SYSTEM'],
    ['LAPORAN LABA RUGI & ARUS KAS KONSOLIDASI'],
    [`Cabang: ${branchName}`],
    [`Periode: ${filter.startDate} s/d ${filter.endDate}`],
    [],
    ['KOMPONEN AKUNTANSI', 'NOMINAL (IDR)'],
    ['1. PENDAPATAN OPERASIONAL', ''],
    ['   Penjualan Bersih Produk Skincare', reportData.kpi.pendapatanProduk],
    ['   Pendapatan Bersih Jasa & Treatment', reportData.kpi.pendapatanJasa],
    ['   Diskon Promosi Yang Diberikan', -reportData.kpi.totalDiskon],
    ['   TOTAL OMZET PENJUALAN', reportData.kpi.totalOmzet],
    [],
    ['2. HARGA POKOK PENJUALAN (HPP)', ''],
    ['   Beban Pokok Persediaan Produk', -reportData.kpi.hpp],
    ['   TOTAL LABA KOTOR (GROSS PROFIT)', reportData.kpi.labaKotor],
    [],
    ['3. BIAYA OPERASIONAL (EXPENSES)', '']
  ];

  Object.entries(reportData.breakdownKategoriPengeluaran).forEach(([cat, val]) => {
    pnlData.push([`   ${cat}`, -(val as number)]);
  });

  pnlData.push(
    ['   TOTAL BEBAN OPERASIONAL', -reportData.kpi.totalPengeluaran],
    [],
    ['4. PENDAPATAN & BEBAN LAIN-LAIN', ''],
    ['   Pemasukan Non-Operasional', reportData.kpi.pemasukanLainnya],
    ['   Koreksi Refund / Retur', -reportData.kpi.totalRefund],
    [],
    ['ESTIMASI LABA / RUGI BERSIH (NET PROFIT)', reportData.kpi.labaRugiBersih],
    [],
    ['5. SALDO AKUN KAS & REKENING (REAL-TIME)', ''],
    ['   Saldo Kas Tunai Kasir', reportData.kpi.saldoKasTunai],
    ['   Saldo Bank BCA Operasional', reportData.kpi.saldoBankBCA],
    ['   Saldo Bank Mandiri Klinik', reportData.kpi.saldoBankMandiri]
  );

  const ws = XLSX.utils.aoa_to_sheet(pnlData);
  ws['!cols'] = [{ wch: 45 }, { wch: 22 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laba Rugi');

  const filename = `RCA_Laba_Rugi_${branchName.replace(/\s+/g, '_')}_${filter.startDate}_${filter.endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 4. Expenses & Other Income Excel
export function exportExpensesExcel(expenses: ExpenseIncomeEntry[], filter: FinancialFilter, branchName: string) {
  const metadata = [
    ['RCA SKINCARE MANAGEMENT SYSTEM'],
    ['BUKU PENGELUARAN & PEMASUKAN LAIN'],
    [`Cabang: ${branchName}`],
    [`Periode: ${filter.startDate} s/d ${filter.endDate}`],
    []
  ];

  const rows = expenses.map((e, idx) => ({
    'No': idx + 1,
    'No Transaksi': e.transactionNumber,
    'Tipe': e.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan Lain',
    'Tanggal': e.tanggal,
    'Cabang': e.branchId.toUpperCase(),
    'Kategori': e.kategori,
    'Deskripsi': e.deskripsi,
    'Nominal': e.nominal,
    'Metode Bayar': e.metodePembayaran,
    'Akun Kas': e.akunKas,
    'Petugas Input': e.petugasInput,
    'Pemberi Persetujuan': e.pemberiPersetujuan,
    'Status': e.status
  }));

  const ws = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A6' });

  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 35 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran & Pemasukan');

  const filename = `RCA_Buku_Pengeluaran_${branchName.replace(/\s+/g, '_')}_${filter.startDate}_${filter.endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 5. Customer List Excel
export function exportCustomersExcel(customers: Customer[]) {
  const metadata = [
    ['RCA SKINCARE MANAGEMENT SYSTEM'],
    ['DATABASE MASTER PELANGGAN / CRM'],
    [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} WIB`],
    []
  ];

  const rows = customers.map((c, idx) => ({
    'No': idx + 1,
    'Kode Customer': c.customerCode,
    'Nama Lengkap': c.namaLengkap,
    'Nomor Telepon': c.nomorTelepon,
    'Email': c.email || '-',
    'Tanggal Registrasi': c.tanggalRegistrasi,
    'Cabang Pendaftaran': c.cabangPendaftaran,
    'Persetujuan Komunikasi': c.persetujuanKomunikasi ? 'Ya' : 'Tidak',
    'Catatan Non-Medis': c.catatanNonmedis || '-',
    'Status': c.status
  }));

  const ws = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5' });

  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 30 },
    { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Database Pelanggan');

  const filename = `RCA_Database_Customer_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 6. Services Master Excel
export function exportServicesExcel(services: ServiceItem[], branchName: string) {
  const metadata = [
    ['RCA SKINCARE MANAGEMENT SYSTEM'],
    ['MASTER DATA LAYANAN & JASA KLINIK'],
    [`Cabang Cakupan: ${branchName}`],
    [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')} WIB`],
    []
  ];

  const rows = services.map((s, idx) => ({
    'No': idx + 1,
    'Kode Jasa': s.kodeJasa,
    'Nama Jasa': s.namaJasa,
    'Kategori Jasa': s.kategoriJasa,
    'Harga Dasar': s.hargaDasar,
    'Durasi (Menit)': s.durasiMenit,
    'Cabang Penyedia': s.cabangPenyedia.join(', '),
    'Wewenang Petugas': s.petugasWewenang.join(', '),
    'Status': s.status === 'active' ? 'Aktif' : 'Non-Aktif',
    'Deskripsi': s.deskripsi
  }));

  const ws = XLSX.utils.aoa_to_sheet(metadata);
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5' });

  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 35 },
    { wch: 22 },
    { wch: 16 },
    { wch: 15 },
    { wch: 30 },
    { wch: 30 },
    { wch: 12 },
    { wch: 45 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Jasa');

  const filename = `RCA_Master_Jasa_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// --- CLEAN DOWNLOADABLE IMPORT TEMPLATES ---
export function downloadProductTemplate() {
  const wsData = [
    ['PANDUAN:', 'Isi kolom di bawah ini. Kode Produk boleh dikosongkan (otomatis di-generate jika kosong). Nilai rupiah tanpa titik/koma.'],
    ['Kode Produk', 'Nama Produk', 'Kategori', 'Merk / Brand', 'Harga Modal / HPP', 'Harga Jual', 'Batas Min Stok', 'Stok Spring Hill', 'Stok Sudirman', 'Stok Pangkalan Balai'],
    ['RCA-BR-01', 'Brightening Facial Wash AHA/BHA 100ml', 'Cleanser', 'RCA Clinical Skin', 45000, 95000, 10, 45, 30, 20],
    ['RCA-SRM-02', 'Glow Radiance Serum Niacinamide 10% 30ml', 'Serum', 'RCA Clinical Skin', 85000, 175000, 8, 35, 25, 15]
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 16 }, { wch: 38 }, { wch: 18 }, { wch: 20 },
    { wch: 18 }, { wch: 16 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 18 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Produk');
  XLSX.writeFile(wb, 'Template_Import_Produk_RCA.xlsx');
}

export function downloadCustomerTemplate() {
  const wsData = [
    ['PANDUAN:', 'Kolom Nama Lengkap dan Nomor Telepon wajib diisi. Cabang: spring-hill / sudirman / pangkalan-balai.'],
    ['Kode Customer', 'Nama Lengkap', 'Nomor Telepon', 'Email', 'Tanggal Lahir', 'Alamat', 'Cabang Pendaftaran', 'Catatan Non-Medis'],
    ['RCA-CUST-101', 'drg. Amanda Kartika', '081271234567', 'amanda.kartika@gmail.com', '1992-05-14', 'Jl. Basuki Rahmat No. 12 Palembang', 'spring-hill', 'VIP Member, alergi fragrance sintetis'],
    ['', 'Ibu Shinta Maharani', '081398765432', 'shinta.m@yahoo.com', '1988-11-20', 'Komplek Sudirman Indah Blok B3', 'sudirman', 'Treatment bulanan']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 26 },
    { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 35 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Customer');
  XLSX.writeFile(wb, 'Template_Import_Customer_RCA.xlsx');
}

export function downloadServiceTemplate() {
  const wsData = [
    ['PANDUAN:', 'Kode Jasa boleh dikosongkan. Cabang Penyedia bisa: Semua Cabang atau nama cabang dipisah koma.'],
    ['Kode Jasa', 'Nama Jasa', 'Kategori Jasa', 'Deskripsi', 'Harga Dasar', 'Durasi (Menit)', 'Cabang Penyedia'],
    ['JS-FCL-10', 'Hydra Peeling & Oxygen Infusion', 'Facial', 'Eksfoliasi lembut microdermabrasi dan serum oksigen', 220000, 60, 'Semua Cabang'],
    ['JS-LSR-11', 'Carbon Black Doll Laser Peel', 'Anti-Aging & Laser', 'Peremajaan pori dan pengurangan sebum dengan laser carbon', 500000, 45, 'spring-hill, sudirman']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 16 }, { wch: 35 }, { wch: 22 }, { wch: 45 },
    { wch: 16 }, { wch: 16 }, { wch: 28 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Jasa');
  XLSX.writeFile(wb, 'Template_Import_Jasa_RCA.xlsx');
}

export function downloadExpenseTemplate() {
  const wsData = [
    ['PANDUAN:', 'Cabang: spring-hill / sudirman / pangkalan-balai. Tipe: EXPENSE atau INCOME. Nominal angka bulat.'],
    ['Cabang', 'Tipe', 'Kategori', 'Nominal', 'Deskripsi', 'Tanggal', 'Metode Pembayaran', 'Akun Kas'],
    ['spring-hill', 'EXPENSE', 'Bahan Habis Pakai Medis', 350000, 'Kasa steril, jarum meso, alkohol swab', '2026-10-25', 'Cash', 'Kas Tunai Kasir'],
    ['sudirman', 'INCOME', 'Pemasukan Lainnya', 500000, 'Pendapatan sewa stan promosi booth', '2026-10-26', 'Transfer BCA', 'Bank BCA Operasional']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 16 }, { wch: 14 }, { wch: 26 }, { wch: 16 },
    { wch: 40 }, { wch: 14 }, { wch: 18 }, { wch: 24 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Pengeluaran');
  XLSX.writeFile(wb, 'Template_Import_Pengeluaran_RCA.xlsx');
}
