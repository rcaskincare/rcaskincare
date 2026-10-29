export type BranchId = 'spring-hill' | 'sudirman' | 'pangkalan-balai';

export interface Branch {
  id: BranchId;
  name: string;
  code: string;
  address: string;
  phone: string;
  headerNote: string;
  managerName?: string;
  email?: string;
  isActive?: boolean;
}

export interface SystemSettings {
  clinicName: string;
  tagline: string;
  defaultTaxPercentage: number;
  operatingHours: string;
  currencySymbol: string;
  receiptFooter: string;
  phonePusat: string;
  emailPusat: string;
  website: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BackupSnapshot {
  appName: string;
  backupVersion: string;
  timestamp: string;
  exportedBy: string;
  summary: {
    branchCount: number;
    productCount: number;
    serviceCount: number;
    customerCount: number;
    transactionCount: number;
    expenseCount: number;
    shiftCount: number;
  };
  data: {
    branches: Branch[];
    products: Product[];
    services: ServiceItem[];
    customers: Customer[];
    transactions: Transaction[];
    expenses: ExpenseIncomeEntry[];
    shifts: ShiftRecord[];
    systemSettings: SystemSettings;
    auditLogs: any[];
  };
}

export type UserRole = 'owner' | 'branch_manager' | 'kasir' | 'dokter_beautician';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  branchId: BranchId;
}

export interface Customer {
  id: string; // customerId unik (UUID)
  customerCode: string; // RCA-CUST-XXX
  namaLengkap: string;
  nomorTelepon: string;
  email?: string;
  tanggalLahir?: string;
  alamat?: string;
  tanggalRegistrasi: string;
  cabangPendaftaran: BranchId;
  persetujuanKomunikasi: boolean;
  catatanNonmedis?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CustomerMergeLog {
  id: string;
  primaryCustomerId: string;
  mergedCustomerId: string;
  mergedCustomerName: string;
  mergedCustomerPhone: string;
  mergedAt: string;
  mergedBy: string;
  reason: string;
}

export interface Product {
  id: string;
  kodeProduk: string;
  namaProduk: string;
  kategori: string;
  merk: string;
  stokPerCabang: Record<BranchId, number>;
  hargaModal: number; // Integer IDR
  hargaJual: number; // Integer IDR
  minStok: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategory = 
  | 'Facial'
  | 'Acne Care'
  | 'Anti-Aging & Laser'
  | 'Peeling & Brightening'
  | 'Konsultasi Dokter'
  | 'Treatment Khusus';

export interface PriceHistoryItem {
  date: string;
  changedBy: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
}

export interface ServiceItem {
  id: string; // serviceId unik
  kodeJasa: string;
  namaJasa: string;
  kategoriJasa: ServiceCategory | string;
  deskripsi: string;
  hargaDasar: number; // Integer IDR
  hargaCabang?: Partial<Record<BranchId, number>>;
  durasiMenit: number;
  petugasWewenang: string[]; // e.g. ["Dokter SpKK", "Dokter Aesthetic", "Senior Beautician", "Terapis"]
  cabangPenyedia: BranchId[];
  status: 'active' | 'inactive';
  riwayatHarga: PriceHistoryItem[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TransactionItem {
  id: string;
  itemType: 'PRODUCT' | 'SERVICE';
  referenceId: string;
  snapshotKode: string;
  snapshotNama: string;
  snapshotHargaSatuan: number;
  snapshotHargaModal: number; // Untuk HPP akurat
  kuantitas: number;
  diskon: number; // Rupiah per line item
  subtotal: number; // (harga * qty) - diskon
  petugasDokter?: string; // Khusus jasa
}

export type PaymentMethod = 'Cash' | 'Transfer BCA' | 'QRIS' | 'Mandiri EDC';
export type CashAccount = 'Kas Tunai Kasir' | 'Bank BCA Operasional' | 'Bank Mandiri Klinik';
export type TransactionStatus = 'COMPLETED' | 'VOID' | 'REFUNDED';

export interface RefundItem {
  itemId: string;
  nama: string;
  qty: number;
  amount: number;
}

export interface RefundRecord {
  refundId: string;
  originalInvoiceNumber: string;
  amount: number;
  reason: string;
  refundedAt: string;
  refundedBy: string;
  refundItems: RefundItem[];
}

export interface Transaction {
  id: string;
  invoiceNumber: string; // INV/SH/20261029/0001
  branchId: BranchId;
  customerId: string; // or 'WALK-IN'
  isWalkIn: boolean;
  customerSnapshot?: {
    nama: string;
    telepon: string;
    code?: string;
  };
  items: TransactionItem[];
  subtotalProduk: number;
  subtotalJasa: number;
  totalDiskon: number;
  pajak: number;
  totalTagihan: number;
  totalHpp: number; // Sum of (snapshotHargaModal * kuantitas) for products
  nominalBayar: number;
  kembalian: number;
  sisaTagihan: number;
  metodePembayaran: PaymentMethod;
  akunKas: CashAccount;
  status: TransactionStatus;
  voidReason?: string;
  voidAt?: string;
  voidBy?: string;
  refundRecord?: RefundRecord;
  kasirName: string;
  shiftId?: string;
  idempotencyKey: string;
  isOfflineQueue?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseIncomeEntry {
  id: string;
  transactionNumber: string; // EXP/SH/202610/001 or INC/SH/202610/001
  type: 'EXPENSE' | 'OTHER_INCOME';
  branchId: BranchId;
  tanggal: string; // YYYY-MM-DD
  kategori: string;
  deskripsi: string;
  nominal: number;
  metodePembayaran: PaymentMethod;
  akunKas: CashAccount;
  referensiTransaksi?: string;
  buktiPembayaran?: string;
  petugasInput: string;
  pemberiPersetujuan: string;
  status: 'approved' | 'pending' | 'reversed';
  catatan?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ShiftRecord {
  id: string;
  branchId: BranchId;
  kasirName: string;
  startTime: string;
  endTime?: string;
  modalAwal: number;
  totalPenjualanCash: number;
  totalPenjualanNonCash: number;
  totalPengeluaranKas: number;
  totalKasAktual?: number;
  selisih?: number;
  status: 'open' | 'closed';
  catatan?: string;
}

export interface FinancialFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  periodMode: 'today' | 'monthly' | 'yearly' | 'custom';
  selectedMonth: number; // 1-12
  selectedYear: number;
  branchId: 'all' | BranchId;
  kategori?: string;
  jenisTransaksi?: 'all' | 'sale' | 'expense' | 'income' | 'refund';
  metodePembayaran?: 'all' | PaymentMethod;
  statusTransaksi?: 'all' | TransactionStatus;
}

export interface FinancialSummaryKPI {
  totalOmzet: number;
  penerimaanKas: number;
  totalPengeluaran: number;
  hpp: number;
  labaKotor: number;
  labaRugiBersih: number;
  totalRefund: number;
  jumlahTransaksi: number;
  pendapatanJasa: number;
  pendapatanProduk: number;
  pemasukanLainnya: number;
  totalDiskon: number;
  saldoKasTunai: number;
  saldoBankBCA: number;
  saldoBankMandiri: number;
}
