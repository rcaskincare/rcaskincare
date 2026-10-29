import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Branch, Product, ServiceItem, Customer, ExpenseIncomeEntry, ShiftRecord, FinancialFilter } from '../types/index.ts';
import { formatRupiah, formatDateTimeId, formatDateId } from './formatters.ts';

// Helper to open PDF in a new preview window or trigger download
export function triggerPdfDownload(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function getPdfBlobUrl(doc: jsPDF): string {
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

// 1. POS Thermal Receipt (58mm or 80mm)
export function generateThermalReceipt(transaction: Transaction, branch: Branch, format: '58mm' | '80mm' = '80mm'): jsPDF {
  const width = format === '58mm' ? 58 : 80;
  // Calculate approximate height based on item count
  const estimatedHeight = Math.max(160, 90 + (transaction.items.length * 14) + 60);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, estimatedHeight]
  });

  const margin = 4;
  const contentWidth = width - (margin * 2);
  let y = 8;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(format === '58mm' ? 10 : 12);
  doc.text('RCA SKINCARE CLINIC', width / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(format === '58mm' ? 7 : 8);
  doc.text(branch.name, width / 2, y, { align: 'center' });
  y += 3.5;

  const addressLines = doc.splitTextToSize(branch.address, contentWidth);
  doc.text(addressLines, width / 2, y, { align: 'center' });
  y += (addressLines.length * 3) + 1;

  doc.text(`Telp: ${branch.phone}`, width / 2, y, { align: 'center' });
  y += 4;

  // Divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, width - margin, y);
  y += 4;

  // Transaction Meta
  doc.setFontSize(format === '58mm' ? 7 : 8);
  doc.text(`No: ${transaction.invoiceNumber}`, margin, y);
  y += 3.5;
  doc.text(`Tgl: ${formatDateTimeId(transaction.createdAt)}`, margin, y);
  y += 3.5;
  doc.text(`Kasir: ${transaction.kasirName}`, margin, y);
  y += 3.5;

  const customerName = transaction.isWalkIn ? (transaction.customerSnapshot?.nama || 'Walk-In Guest') : (transaction.customerSnapshot?.nama || 'Customer Member');
  doc.text(`Pelanggan: ${customerName}`, margin, y);
  y += 4;

  // Divider
  doc.line(margin, y, width - margin, y);
  y += 4;

  // Items
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM', margin, y);
  doc.text('TOTAL', width - margin, y, { align: 'right' });
  y += 3.5;
  doc.setFont('helvetica', 'normal');

  transaction.items.forEach(it => {
    const itemTitle = `${it.snapshotNama} [${it.itemType === 'SERVICE' ? 'Jasa' : 'Produk'}]`;
    const titleLines = doc.splitTextToSize(itemTitle, contentWidth - 2);
    doc.text(titleLines, margin, y);
    y += (titleLines.length * 3);

    const priceCalculation = `${it.kuantitas} x ${formatRupiah(it.snapshotHargaSatuan)}${it.diskon > 0 ? ` (Disc: -${formatRupiah(it.diskon)})` : ''}`;
    doc.text(priceCalculation, margin + 2, y);
    doc.text(formatRupiah(it.subtotal), width - margin, y, { align: 'right' });
    y += 3.5;
  });

  // Divider
  doc.line(margin, y, width - margin, y);
  y += 4;

  // Totals
  doc.setFontSize(format === '58mm' ? 7 : 8);
  if (transaction.subtotalProduk > 0) {
    doc.text('Subtotal Produk:', margin, y);
    doc.text(formatRupiah(transaction.subtotalProduk), width - margin, y, { align: 'right' });
    y += 3.5;
  }
  if (transaction.subtotalJasa > 0) {
    doc.text('Subtotal Jasa/Treatment:', margin, y);
    doc.text(formatRupiah(transaction.subtotalJasa), width - margin, y, { align: 'right' });
    y += 3.5;
  }
  if (transaction.totalDiskon > 0) {
    doc.text('Total Diskon:', margin, y);
    doc.text(`-${formatRupiah(transaction.totalDiskon)}`, width - margin, y, { align: 'right' });
    y += 3.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL TAGIHAN:', margin, y);
  doc.text(formatRupiah(transaction.totalTagihan), width - margin, y, { align: 'right' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.text(`Metode: ${transaction.metodePembayaran}`, margin, y);
  y += 3.5;
  doc.text('Bayar:', margin, y);
  doc.text(formatRupiah(transaction.nominalBayar), width - margin, y, { align: 'right' });
  y += 3.5;
  doc.text('Kembalian:', margin, y);
  doc.text(formatRupiah(transaction.kembalian), width - margin, y, { align: 'right' });
  y += 5;

  // Status Indicator
  if (transaction.status === 'VOID') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('*** TRANSAKSI INI DIBATALKAN (VOID) ***', width / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 4;
  } else if (transaction.status === 'REFUNDED') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text('*** TRANSAKSI DI-REFUND ***', width / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  // Footer Greeting
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(format === '58mm' ? 6.5 : 7.5);
  doc.text('Terima kasih atas kunjungan Anda di RCA Skincare.', width / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Kulit Cantik, Sehat, dan Terawat.', width / 2, y, { align: 'center' });

  return doc;
}

// 2. Official A4 Invoice / Thermal Print
export function generateInvoiceA4(transaction: Transaction, branch: Branch): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;

  // Clinic Header Banner
  doc.setFillColor(244, 63, 94); // RCA Rose Accent
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Letterhead
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('RCA SKINCARE MANAGEMENT', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(branch.name, 14, 25);
  doc.text(branch.address, 14, 29);
  doc.text(`Telepon: ${branch.phone} | Zona Waktu: Asia/Jakarta (WIB)`, 14, 33);

  // Invoice Title Right Aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(244, 63, 94);
  doc.text('OFFICIAL INVOICE', pageWidth - 14, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`No: ${transaction.invoiceNumber}`, pageWidth - 14, 26, { align: 'right' });
  doc.text(`Tanggal: ${formatDateTimeId(transaction.createdAt)}`, pageWidth - 14, 31, { align: 'right' });
  doc.text(`Status: ${transaction.status}`, pageWidth - 14, 36, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, pageWidth - 14, 40);

  // Customer & Cashier Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Informasi Pelanggan:', 14, 47);
  doc.text('Informasi Kasir & Pembayaran:', pageWidth / 2 + 10, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const custName = transaction.customerSnapshot?.nama || (transaction.isWalkIn ? 'Walk-in Guest' : 'Pelanggan');
  const custPhone = transaction.customerSnapshot?.telepon || '-';
  const custCode = transaction.customerSnapshot?.code || (transaction.isWalkIn ? 'WALK-IN' : '-');

  doc.text(`Nama: ${custName}`, 14, 53);
  doc.text(`No. Telp: ${custPhone}`, 14, 58);
  doc.text(`ID Customer: ${custCode}`, 14, 63);

  doc.text(`Kasir: ${transaction.kasirName}`, pageWidth / 2 + 10, 53);
  doc.text(`Metode: ${transaction.metodePembayaran}`, pageWidth / 2 + 10, 58);
  doc.text(`Akun Kas: ${transaction.akunKas}`, pageWidth / 2 + 10, 63);

  // Table of Items
  const tableData = transaction.items.map((it, idx) => [
    idx + 1,
    it.snapshotNama,
    it.itemType === 'SERVICE' ? 'Jasa Klinik' : 'Produk Skincare',
    it.petugasDokter || '-',
    it.kuantitas,
    formatRupiah(it.snapshotHargaSatuan),
    it.diskon > 0 ? `-${formatRupiah(it.diskon)}` : 'Rp 0',
    formatRupiah(it.subtotal)
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['No', 'Deskripsi Item', 'Jenis', 'Dokter/Petugas', 'Qty', 'Harga Satuan', 'Diskon', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 30 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' }
    },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Summary box right aligned
  const summaryX = pageWidth - 80;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal Produk:', summaryX, finalY);
  doc.text(formatRupiah(transaction.subtotalProduk), pageWidth - 14, finalY, { align: 'right' });

  doc.text('Subtotal Jasa/Treatment:', summaryX, finalY + 5);
  doc.text(formatRupiah(transaction.subtotalJasa), pageWidth - 14, finalY + 5, { align: 'right' });

  if (transaction.totalDiskon > 0) {
    doc.text('Total Diskon Promo:', summaryX, finalY + 10);
    doc.text(`-${formatRupiah(transaction.totalDiskon)}`, pageWidth - 14, finalY + 10, { align: 'right' });
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, finalY + 13, pageWidth - 14, finalY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL TAGIHAN:', summaryX, finalY + 19);
  doc.text(formatRupiah(transaction.totalTagihan), pageWidth - 14, finalY + 19, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Nominal Dibayar:', summaryX, finalY + 25);
  doc.text(formatRupiah(transaction.nominalBayar), pageWidth - 14, finalY + 25, { align: 'right' });

  doc.text('Kembalian:', summaryX, finalY + 30);
  doc.text(formatRupiah(transaction.kembalian), pageWidth - 14, finalY + 30, { align: 'right' });

  // Notes and Signatures
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Catatan & Ketentuan:', 14, finalY);
  doc.text('1. Produk skincare tersegel dapat ditukar dalam 1x24 jam bila terjadi kerusakan kemasan pabrik.', 14, finalY + 5);
  doc.text('2. Untuk perawatan injeksi & laser, ikuti anjuran post-treatment dari dokter penanggung jawab.', 14, finalY + 10);
  doc.text('3. Struk / Invoice resmi ini merupakan bukti sah transaksi di RCA Skincare.', 14, finalY + 15);

  // Signatures
  const signY = finalY + 35;
  doc.text('Pelanggan,', 25, signY);
  doc.text('(____________________)', 15, signY + 20);

  doc.text('Kasir / Petugas RCA,', pageWidth - 55, signY);
  doc.text(`(${transaction.kasirName.slice(0, 18)})`, pageWidth - 60, signY + 20);

  // Footer Page Number
  doc.setFontSize(8);
  doc.text(`Dokumen dibuat secara otomatis oleh RCA Skincare Management System - Halaman 1 dari 1`, pageWidth / 2, 287, { align: 'center' });

  return doc;
}

// 3. Financial Statements PDF (P&L & Cash Flow Multi-page)
export function generateFinancialStatementsPdf(
  reportData: any,
  filter: FinancialFilter,
  branchName: string,
  generatedBy: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('RCA SKINCARE CLINIC - LAPORAN KEUANGAN & LABA RUGI', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Cabang: ${branchName} | Periode: ${filter.startDate} s/d ${filter.endDate} | Dicetak: ${new Date().toLocaleString('id-ID')} (${generatedBy})`, 14, 18);

  // KPI Cards in PDF
  let y = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('I. RINGKASAN EKSEKUTIF KEUANGAN (KPI)', 14, y);
  y += 6;

  const kpiData = [
    ['Total Omzet Penjualan', formatRupiah(reportData.kpi.totalOmzet), 'Pendapatan Bersih Jasa', formatRupiah(reportData.kpi.pendapatanJasa)],
    ['Harga Pokok Penjualan (HPP)', formatRupiah(reportData.kpi.hpp), 'Pendapatan Bersih Produk', formatRupiah(reportData.kpi.pendapatanProduk)],
    ['Laba Kotor (Gross Profit)', formatRupiah(reportData.kpi.labaKotor), 'Pemasukan Lainnya', formatRupiah(reportData.kpi.pemasukanLainnya)],
    ['Total Pengeluaran Operasional', formatRupiah(reportData.kpi.totalPengeluaran), 'Total Nilai Refund/Retur', formatRupiah(reportData.kpi.totalRefund)],
    ['LABA BERSIH (NET PROFIT)', formatRupiah(reportData.kpi.labaRugiBersih), 'Total Transaksi Selesai', `${reportData.kpi.jumlahTransaksi} Transaksi`]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Indikator Finansial', 'Nilai (IDR)', 'Indikator Operasional', 'Nilai (IDR)']],
    body: kpiData,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 2.2 }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Laporan Laba Rugi Detil
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('II. RINCIAN LAPORAN LABA RUGI (INCOME STATEMENT)', 14, y);
  y += 5;

  const pnlRows = [
    ['1. PENDAPATAN OPERASIONAL', ''],
    ['   - Penjualan Produk Skincare', formatRupiah(reportData.kpi.pendapatanProduk)],
    ['   - Pendapatan Jasa Facial & Treatment Medis', formatRupiah(reportData.kpi.pendapatanJasa)],
    ['   Total Penjualan Kotor (Gross Sales)', formatRupiah(reportData.kpi.totalOmzet + reportData.kpi.totalDiskon)],
    ['   Dikurangi: Potongan & Diskon Promosi', `-${formatRupiah(reportData.kpi.totalDiskon)}`],
    ['   Total Penjualan Bersih (Net Sales)', formatRupiah(reportData.kpi.totalOmzet)],
    ['2. HARGA POKOK PENJUALAN (HPP)', ''],
    ['   - Beban Pokok Persediaan Produk Skincare', formatRupiah(reportData.kpi.hpp)],
    ['   TOTAL LABA KOTOR (GROSS PROFIT)', formatRupiah(reportData.kpi.labaKotor)],
    ['3. BEBAN PENGELUARAN OPERASIONAL', '']
  ];

  Object.entries(reportData.breakdownKategoriPengeluaran).forEach(([cat, val]) => {
    pnlRows.push([`   - ${cat}`, formatRupiah(val as number)]);
  });

  pnlRows.push(['   Total Beban Operasional', formatRupiah(reportData.kpi.totalPengeluaran)]);
  pnlRows.push(['4. PENDAPATAN / BEBAN LAINNYA', '']);
  pnlRows.push(['   - Pemasukan Non-Operasional / Komisi', formatRupiah(reportData.kpi.pemasukanLainnya)]);
  pnlRows.push(['   - Beban Refund & Retur', `-${formatRupiah(reportData.kpi.totalRefund)}`]);
  pnlRows.push(['ESTIMASI LABA / RUGI BERSIH', formatRupiah(reportData.kpi.labaRugiBersih)]);

  autoTable(doc, {
    startY: y,
    head: [['Komponen Akuntansi', 'Jumlah (IDR)']],
    body: pnlRows,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right' }
    },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  // Footer Page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`RCA Skincare Management System - Laporan Keuangan Resmi | Halaman ${i} dari ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
  }

  return doc;
}

// 4. Stock Opname & Inventory Valuation PDF
export function generateStockOpnamePdf(products: Product[], branchId: string, branchName: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('BERITA ACARA & LAPORAN NILAI STOK PERSIDANGAN (STOCK OPNAME)', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Cabang: ${branchName} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} WIB | Format Standar RCA Skincare`, 14, 16);

  let totalQty = 0;
  let totalNilaiModal = 0;
  let totalNilaiJual = 0;

  const tableData = products.map((p, idx) => {
    const qty = branchId === 'all' 
      ? Object.values(p.stokPerCabang).reduce((a, b) => a + b, 0) 
      : ((p.stokPerCabang as Record<string, number>)[branchId] || 0);

    const nilaiModal = qty * p.hargaModal;
    const nilaiJual = qty * p.hargaJual;

    totalQty += qty;
    totalNilaiModal += nilaiModal;
    totalNilaiJual += nilaiJual;

    return [
      idx + 1,
      p.namaProduk,
      p.kategori,
      p.merk,
      qty,
      formatRupiah(p.hargaModal),
      formatRupiah(p.hargaJual),
      qty <= p.minStok ? 'PERLU RESTOCK' : 'Aman'
    ];
  });

  autoTable(doc, {
    startY: 26,
    head: [['No', 'Nama Produk', 'Jenis', 'Merk Produk', 'Jumlah', 'Harga Modal', 'Harga Jual', 'Keterangan']],
    body: tableData,
    foot: [['', 'TOTAL KESELURUHAN', '', '', totalQty, formatRupiah(totalNilaiModal), formatRupiah(totalNilaiJual), '']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 75 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 32, halign: 'right' },
      6: { cellWidth: 32, halign: 'right' },
      7: { cellWidth: 35, halign: 'center' }
    },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Petugas Pemeriksa Fisik:', 25, finalY);
  doc.text('(_________________________)', 20, finalY + 18);

  doc.text('Apoteker / Penanggung Jawab Farmasi:', 110, finalY);
  doc.text('(_________________________)', 115, finalY + 18);

  doc.text('Kepala Cabang / Manager:', 210, finalY);
  doc.text('(_________________________)', 210, finalY + 18);

  return doc;
}
