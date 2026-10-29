import fs from 'fs';
import path from 'path';
import { 
  Branch, 
  BranchId, 
  Customer, 
  CustomerMergeLog, 
  Product, 
  ServiceItem, 
  Transaction, 
  ExpenseIncomeEntry, 
  ShiftRecord, 
  FinancialFilter, 
  FinancialSummaryKPI,
  SystemSettings,
  BackupSnapshot
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'clinic_data.json');

export const BRANCHES: Branch[] = [
  {
    id: 'spring-hill',
    name: 'RCA Skincare - Spring Hill Pusat',
    code: 'SH',
    address: 'Ruko Spring Hill Garden Blok A No. 12, Jl. Mayor Santoso, Palembang',
    phone: '(0711) 567890 / 0812-7890-1111',
    headerNote: 'Klinik Utama & Laser Aesthetic Center',
    managerName: 'dr. Amanda SpKK (Owner & Kepala Medis)',
    email: 'springhill@rcaskincare.co.id',
    isActive: true
  },
  {
    id: 'sudirman',
    name: 'RCA Skincare - Cabang Sudirman',
    code: 'SDR',
    address: 'Jl. Jenderal Sudirman No. 88, Ilir Timur, Palembang',
    phone: '(0711) 456789 / 0812-7890-2222',
    headerNote: 'Klinik Pratama & Facial Bar',
    managerName: 'Rian Pratama, S.Farm (Branch Manager)',
    email: 'sudirman@rcaskincare.co.id',
    isActive: true
  },
  {
    id: 'pangkalan-balai',
    name: 'RCA Skincare - Cabang Pangkalan Balai',
    code: 'PKB',
    address: 'Jl. Merdeka No. 45, Pangkalan Balai, Banyuasin',
    phone: '(0711) 890123 / 0812-7890-3333',
    headerNote: 'Klinik Pratama & Skincare Lounge',
    managerName: 'dr. Fajar Aesthetic (Branch Head)',
    email: 'pangkalanbalai@rcaskincare.co.id',
    isActive: true
  }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  clinicName: 'RCA Skincare Clinic & Aesthetic Center',
  tagline: 'Klinik Estetika & Skincare Center Terpadu Palembang',
  defaultTaxPercentage: 0,
  operatingHours: 'Senin - Minggu: 08:00 - 20:00 WIB',
  currencySymbol: 'Rp',
  receiptFooter: 'Terima kasih atas kepercayaan Anda merawat kulit di RCA Skincare. Produk yang sudah dibeli tidak dapat ditukar kecuali cacat segel saat diterima.',
  phonePusat: '(0711) 567890 / 0812-7890-1111',
  emailPusat: 'care@rcaskincare.co.id',
  website: 'https://rcaskincare.co.id',
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Bootstrapper'
};

interface DatabaseSchema {
  branches: Branch[];
  systemSettings: SystemSettings;
  customers: Customer[];
  mergeLogs: CustomerMergeLog[];
  products: Product[];
  services: ServiceItem[];
  transactions: Transaction[];
  expenses: ExpenseIncomeEntry[];
  shifts: ShiftRecord[];
  auditLogs: { id: string; timestamp: string; user: string; action: string; details: any }[];
}

function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();

  const products: Product[] = [
    {
      id: 'prod-001',
      kodeProduk: 'RCA-BR-01',
      namaProduk: 'Brightening Facial Wash AHA/BHA 100ml',
      kategori: 'Cleanser',
      merk: 'RCA Clinical Skin',
      stokPerCabang: { 'spring-hill': 45, 'sudirman': 32, 'pangkalan-balai': 20 },
      hargaModal: 45000,
      hargaJual: 95000,
      minStok: 10,
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'prod-002',
      kodeProduk: 'RCA-SRM-02',
      namaProduk: 'Glow Radiance Serum Niacinamide 10% + Zinc 30ml',
      kategori: 'Serum',
      merk: 'RCA Clinical Skin',
      stokPerCabang: { 'spring-hill': 38, 'sudirman': 25, 'pangkalan-balai': 15 },
      hargaModal: 85000,
      hargaJual: 175000,
      minStok: 8,
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'prod-003',
      kodeProduk: 'RCA-SUN-03',
      namaProduk: 'UV Shield Physical Sunscreen SPF 50+ PA++++ 50g',
      kategori: 'Sunscreen',
      merk: 'RCA Clinical Skin',
      stokPerCabang: { 'spring-hill': 50, 'sudirman': 40, 'pangkalan-balai': 28 },
      hargaModal: 70000,
      hargaJual: 145000,
      minStok: 15,
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'prod-004',
      kodeProduk: 'RCA-CRM-04',
      namaProduk: 'Ceramide Barrier Restoring Gel Cream 50g',
      kategori: 'Moisturizer',
      merk: 'RCA Clinical Skin',
      stokPerCabang: { 'spring-hill': 28, 'sudirman': 20, 'pangkalan-balai': 12 },
      hargaModal: 80000,
      hargaJual: 165000,
      minStok: 10,
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'prod-005',
      kodeProduk: 'RCA-ACN-05',
      namaProduk: 'Acne Clarifying Intensive Spot Gel 15g',
      kategori: 'Acne Solution',
      merk: 'RCA Clinical Skin',
      stokPerCabang: { 'spring-hill': 35, 'sudirman': 18, 'pangkalan-balai': 22 },
      hargaModal: 50000,
      hargaJual: 110000,
      minStok: 10,
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'prod-006',
      kodeProduk: 'RCA-RET-06',
      namaProduk: 'Advanced Retinol 0.5% Night Elixir 30ml',
      kategori: 'Anti-Aging',
      merk: 'RCA Clinical Skin',
      stokPerCabang: { 'spring-hill': 24, 'sudirman': 14, 'pangkalan-balai': 9 },
      hargaModal: 115000,
      hargaJual: 235000,
      minStok: 6,
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
  ];

  const services: ServiceItem[] = [
    {
      id: 'srv-001',
      kodeJasa: 'JS-FCL-01',
      namaJasa: 'Signature Deep Pore Facial RCA',
      kategoriJasa: 'Facial',
      deskripsi: 'Pembersihan mendalam pori, ekstraksi komedo aseptik, serum oksigenasi, dan soothing rubber mask.',
      hargaDasar: 180000,
      durasiMenit: 60,
      petugasWewenang: ['Senior Beautician', 'Junior Beautician', 'Terapis'],
      cabangPenyedia: ['spring-hill', 'sudirman', 'pangkalan-balai'],
      status: 'active',
      riwayatHarga: [
        { date: '2026-01-01', changedBy: 'Admin Pusat', oldPrice: 165000, newPrice: 180000, reason: 'Penyesuaian biaya serum import' }
      ],
      createdAt: now,
      updatedAt: now,
      version: 1
    },
    {
      id: 'srv-002',
      kodeJasa: 'JS-ACN-02',
      namaJasa: 'Medical Acne Extraction & High-Frequency Therapy',
      kategoriJasa: 'Acne Care',
      deskripsi: 'Protokol steril ekstraksi jerawat, injeksi jerawat meradang, elektrokauter HF anti-bakteri P.acnes.',
      hargaDasar: 250000,
      durasiMenit: 75,
      petugasWewenang: ['Dokter SpKK', 'Dokter Aesthetic', 'Senior Beautician'],
      cabangPenyedia: ['spring-hill', 'sudirman', 'pangkalan-balai'],
      status: 'active',
      riwayatHarga: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    },
    {
      id: 'srv-003',
      kodeJasa: 'JS-GLW-03',
      namaJasa: 'Korean Glass Skin Meso Glow & Hydra-Infusion',
      kategoriJasa: 'Peeling & Brightening',
      deskripsi: 'Meso non-needle dengan infus PDRN Salmon DNA, Hyaluronic Acid mikro, dan Cryo Therapy pengencang.',
      hargaDasar: 450000,
      durasiMenit: 90,
      petugasWewenang: ['Dokter SpKK', 'Dokter Aesthetic'],
      cabangPenyedia: ['spring-hill', 'sudirman'],
      status: 'active',
      riwayatHarga: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    },
    {
      id: 'srv-004',
      kodeJasa: 'JS-LSR-04',
      namaJasa: 'Q-Switched Nd:YAG Laser Rejuvenation & Toning',
      kategoriJasa: 'Anti-Aging & Laser',
      deskripsi: 'Laser medis untuk memudarkan flek melasma, PIH bekas jerawat, mengecilkan pori, dan meratakan warna kulit.',
      hargaDasar: 650000,
      durasiMenit: 45,
      petugasWewenang: ['Dokter SpKK', 'Dokter Aesthetic'],
      cabangPenyedia: ['spring-hill'],
      status: 'active',
      riwayatHarga: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    },
    {
      id: 'srv-005',
      kodeJasa: 'JS-DOC-05',
      namaJasa: 'Konsultasi & Skin Analysis Dokter Spesialis',
      kategoriJasa: 'Konsultasi Dokter',
      deskripsi: 'Pemeriksaan komputerisasi dermoskopi 3D wajah dan rancangan personal regimen resep dokter.',
      hargaDasar: 100000,
      durasiMenit: 30,
      petugasWewenang: ['Dokter SpKK', 'Dokter Aesthetic'],
      cabangPenyedia: ['spring-hill', 'sudirman', 'pangkalan-balai'],
      status: 'active',
      riwayatHarga: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    }
  ];

  const customers: Customer[] = [
    {
      id: 'c-001',
      customerCode: 'RCA-CUST-001',
      namaLengkap: 'drg. Amanda Putri Kartika',
      nomorTelepon: '081271234567',
      email: 'amanda.putri@gmail.com',
      tanggalLahir: '1992-05-14',
      alamat: 'Jl. Demang Lebar Daun No. 24, Palembang',
      tanggalRegistrasi: '2026-02-10',
      cabangPendaftaran: 'spring-hill',
      persetujuanKomunikasi: true,
      catatanNonmedis: 'VIP Member. Lebih menyukai jadwal sore hari setelah jam 16:00.',
      status: 'active',
      createdAt: '2026-02-10T10:00:00Z',
      updatedAt: '2026-02-10T10:00:00Z',
      version: 1
    },
    {
      id: 'c-002',
      customerCode: 'RCA-CUST-002',
      namaLengkap: 'Siti Rahmawati SE',
      nomorTelepon: '081368998877',
      email: 'siti.rahma@yahoo.com',
      tanggalLahir: '1988-11-20',
      alamat: 'Perumahan Bukit Sejahtera Blok CD-05, Palembang',
      tanggalRegistrasi: '2026-03-01',
      cabangPendaftaran: 'sudirman',
      persetujuanKomunikasi: true,
      catatanNonmedis: 'Kulit sensitif terhadap wewangian tertentu.',
      status: 'active',
      createdAt: '2026-03-01T11:30:00Z',
      updatedAt: '2026-03-01T11:30:00Z',
      version: 1
    },
    {
      id: 'c-003',
      customerCode: 'RCA-CUST-003',
      namaLengkap: 'Bella Novitasari',
      nomorTelepon: '082182001122',
      email: 'bella.novita@gmail.com',
      tanggalLahir: '1999-08-04',
      alamat: 'Jl. Merdeka Komp. Pemkab Banyuasin No. 18, Pangkalan Balai',
      tanggalRegistrasi: '2026-04-15',
      cabangPendaftaran: 'pangkalan-balai',
      persetujuanKomunikasi: true,
      catatanNonmedis: 'Mahasiswi, rutin acne routine bulanan.',
      status: 'active',
      createdAt: '2026-04-15T09:15:00Z',
      updatedAt: '2026-04-15T09:15:00Z',
      version: 1
    },
    {
      id: 'c-004',
      customerCode: 'RCA-CUST-004',
      namaLengkap: 'Nadia Safitri',
      nomorTelepon: '085273344556',
      email: 'nadia.safitri@gmail.com',
      tanggalLahir: '1995-02-18',
      alamat: 'Kenten City Palembang',
      tanggalRegistrasi: '2026-05-20',
      cabangPendaftaran: 'spring-hill',
      persetujuanKomunikasi: false,
      catatanNonmedis: 'Langganan facial signature sebelum acara penting.',
      status: 'active',
      createdAt: '2026-05-20T14:20:00Z',
      updatedAt: '2026-05-20T14:20:00Z',
      version: 1
    }
  ];

  // Seed realistic historical transactions across branches to provide genuine production reports
  const transactions: Transaction[] = [
    {
      id: 'trx-sh-001',
      invoiceNumber: 'INV/SH/20261028/0001',
      branchId: 'spring-hill',
      customerId: 'c-001',
      isWalkIn: false,
      customerSnapshot: {
        nama: 'drg. Amanda Putri Kartika',
        telepon: '081271234567',
        code: 'RCA-CUST-001'
      },
      items: [
        {
          id: 'item-1',
          itemType: 'SERVICE',
          referenceId: 'srv-003',
          snapshotKode: 'JS-GLW-03',
          snapshotNama: 'Korean Glass Skin Meso Glow & Hydra-Infusion',
          snapshotHargaSatuan: 450000,
          snapshotHargaModal: 0,
          kuantitas: 1,
          diskon: 0,
          subtotal: 450000,
          petugasDokter: 'dr. Nadira SpKK'
        },
        {
          id: 'item-2',
          itemType: 'PRODUCT',
          referenceId: 'prod-002',
          snapshotKode: 'RCA-SRM-02',
          snapshotNama: 'Glow Radiance Serum Niacinamide 10% + Zinc 30ml',
          snapshotHargaSatuan: 175000,
          snapshotHargaModal: 85000,
          kuantitas: 1,
          diskon: 10000,
          subtotal: 165000
        },
        {
          id: 'item-3',
          itemType: 'PRODUCT',
          referenceId: 'prod-003',
          snapshotKode: 'RCA-SUN-03',
          snapshotNama: 'UV Shield Physical Sunscreen SPF 50+ PA++++ 50g',
          snapshotHargaSatuan: 145000,
          snapshotHargaModal: 70000,
          kuantitas: 1,
          diskon: 0,
          subtotal: 145000
        }
      ],
      subtotalProduk: 310000,
      subtotalJasa: 450000,
      totalDiskon: 10000,
      pajak: 0,
      totalTagihan: 760000,
      totalHpp: 155000, // 85000 + 70000
      nominalBayar: 760000,
      kembalian: 0,
      sisaTagihan: 0,
      metodePembayaran: 'QRIS',
      akunKas: 'Bank BCA Operasional',
      status: 'COMPLETED',
      kasirName: 'Kasir Rina (Spring Hill)',
      shiftId: 'shift-sh-01',
      idempotencyKey: 'idemp-sh-001',
      createdAt: '2026-10-28T11:45:00+07:00',
      updatedAt: '2026-10-28T11:45:00+07:00'
    },
    {
      id: 'trx-sdr-002',
      invoiceNumber: 'INV/SDR/20261028/0002',
      branchId: 'sudirman',
      customerId: 'c-002',
      isWalkIn: false,
      customerSnapshot: {
        nama: 'Siti Rahmawati SE',
        telepon: '081368998877',
        code: 'RCA-CUST-002'
      },
      items: [
        {
          id: 'item-4',
          itemType: 'SERVICE',
          referenceId: 'srv-001',
          snapshotKode: 'JS-FCL-01',
          snapshotNama: 'Signature Deep Pore Facial RCA',
          snapshotHargaSatuan: 180000,
          snapshotHargaModal: 0,
          kuantitas: 1,
          diskon: 0,
          subtotal: 180000,
          petugasDokter: 'Beautician Wulan'
        },
        {
          id: 'item-5',
          itemType: 'PRODUCT',
          referenceId: 'prod-001',
          snapshotKode: 'RCA-BR-01',
          snapshotNama: 'Brightening Facial Wash AHA/BHA 100ml',
          snapshotHargaSatuan: 95000,
          snapshotHargaModal: 45000,
          kuantitas: 1,
          diskon: 0,
          subtotal: 95000
        }
      ],
      subtotalProduk: 95000,
      subtotalJasa: 180000,
      totalDiskon: 0,
      pajak: 0,
      totalTagihan: 275000,
      totalHpp: 45000,
      nominalBayar: 300000,
      kembalian: 25000,
      sisaTagihan: 0,
      metodePembayaran: 'Cash',
      akunKas: 'Kas Tunai Kasir',
      status: 'COMPLETED',
      kasirName: 'Kasir Dimas (Sudirman)',
      shiftId: 'shift-sdr-01',
      idempotencyKey: 'idemp-sdr-002',
      createdAt: '2026-10-28T14:15:00+07:00',
      updatedAt: '2026-10-28T14:15:00+07:00'
    },
    {
      id: 'trx-pkb-003',
      invoiceNumber: 'INV/PKB/20261029/0001',
      branchId: 'pangkalan-balai',
      customerId: 'c-003',
      isWalkIn: false,
      customerSnapshot: {
        nama: 'Bella Novitasari',
        telepon: '082182001122',
        code: 'RCA-CUST-003'
      },
      items: [
        {
          id: 'item-6',
          itemType: 'SERVICE',
          referenceId: 'srv-002',
          snapshotKode: 'JS-ACN-02',
          snapshotNama: 'Medical Acne Extraction & High-Frequency Therapy',
          snapshotHargaSatuan: 250000,
          snapshotHargaModal: 0,
          kuantitas: 1,
          diskon: 0,
          subtotal: 250000,
          petugasDokter: 'dr. Fajar Aesthetic'
        },
        {
          id: 'item-7',
          itemType: 'PRODUCT',
          referenceId: 'prod-005',
          snapshotKode: 'RCA-ACN-05',
          snapshotNama: 'Acne Clarifying Intensive Spot Gel 15g',
          snapshotHargaSatuan: 110000,
          snapshotHargaModal: 50000,
          kuantitas: 1,
          diskon: 0,
          subtotal: 110000
        }
      ],
      subtotalProduk: 110000,
      subtotalJasa: 250000,
      totalDiskon: 0,
      pajak: 0,
      totalTagihan: 360000,
      totalHpp: 50000,
      nominalBayar: 360000,
      kembalian: 0,
      sisaTagihan: 0,
      metodePembayaran: 'Transfer BCA',
      akunKas: 'Bank BCA Operasional',
      status: 'COMPLETED',
      kasirName: 'Kasir Sari (Pangkalan Balai)',
      shiftId: 'shift-pkb-01',
      idempotencyKey: 'idemp-pkb-003',
      createdAt: '2026-10-29T10:20:00+07:00',
      updatedAt: '2026-10-29T10:20:00+07:00'
    },
    {
      id: 'trx-sh-004',
      invoiceNumber: 'INV/SH/20261029/0002',
      branchId: 'spring-hill',
      customerId: 'WALK-IN',
      isWalkIn: true,
      customerSnapshot: {
        nama: 'Walk-in Guest Ny. Ratna',
        telepon: '081922334455'
      },
      items: [
        {
          id: 'item-8',
          itemType: 'SERVICE',
          referenceId: 'srv-004',
          snapshotKode: 'JS-LSR-04',
          snapshotNama: 'Q-Switched Nd:YAG Laser Rejuvenation & Toning',
          snapshotHargaSatuan: 650000,
          snapshotHargaModal: 0,
          kuantitas: 1,
          diskon: 50000,
          subtotal: 600000,
          petugasDokter: 'dr. Nadira SpKK'
        },
        {
          id: 'item-9',
          itemType: 'PRODUCT',
          referenceId: 'prod-004',
          snapshotKode: 'RCA-CRM-04',
          snapshotNama: 'Ceramide Barrier Restoring Gel Cream 50g',
          snapshotHargaSatuan: 165000,
          snapshotHargaModal: 80000,
          kuantitas: 1,
          diskon: 0,
          subtotal: 165000
        }
      ],
      subtotalProduk: 165000,
      subtotalJasa: 600000,
      totalDiskon: 50000,
      pajak: 0,
      totalTagihan: 765000,
      totalHpp: 80000,
      nominalBayar: 765000,
      kembalian: 0,
      sisaTagihan: 0,
      metodePembayaran: 'Mandiri EDC',
      akunKas: 'Bank Mandiri Klinik',
      status: 'COMPLETED',
      kasirName: 'Kasir Rina (Spring Hill)',
      shiftId: 'shift-sh-01',
      idempotencyKey: 'idemp-sh-004',
      createdAt: '2026-10-29T11:00:00+07:00',
      updatedAt: '2026-10-29T11:00:00+07:00'
    }
  ];

  const expenses: ExpenseIncomeEntry[] = [
    {
      id: 'exp-001',
      transactionNumber: 'EXP/SH/202610/001',
      type: 'EXPENSE',
      branchId: 'spring-hill',
      tanggal: '2026-10-25',
      kategori: 'Bahan Treatment Klinis',
      deskripsi: 'Restock Kasa Steril, Jarum Insulin Meso 32G, Spuit, Gel Ultrasonic Laser',
      nominal: 350000,
      metodePembayaran: 'Transfer BCA',
      akunKas: 'Bank BCA Operasional',
      petugasInput: 'Supervisor Siska',
      pemberiPersetujuan: 'dr. Nadira (Branch Head)',
      status: 'approved',
      createdAt: '2026-10-25T10:00:00+07:00'
    },
    {
      id: 'exp-002',
      transactionNumber: 'EXP/SDR/202610/002',
      type: 'EXPENSE',
      branchId: 'sudirman',
      tanggal: '2026-10-26',
      kategori: 'Listrik & Utilitas',
      deskripsi: 'Tagihan Listrik PLN Pascabayar dan Internet Fiber Sudirman',
      nominal: 420000,
      metodePembayaran: 'Transfer BCA',
      akunKas: 'Bank BCA Operasional',
      petugasInput: 'Dimas Admin',
      pemberiPersetujuan: 'Manager Sudirman',
      status: 'approved',
      createdAt: '2026-10-26T13:30:00+07:00'
    },
    {
      id: 'exp-003',
      transactionNumber: 'EXP/PKB/202610/003',
      type: 'EXPENSE',
      branchId: 'pangkalan-balai',
      tanggal: '2026-10-27',
      kategori: 'Logistik & Pengiriman',
      deskripsi: 'Ongkos kirim ekspedisi paket produk skincare dari gudang pusat ke Pangkalan Balai',
      nominal: 125000,
      metodePembayaran: 'Cash',
      akunKas: 'Kas Tunai Kasir',
      petugasInput: 'Kasir Sari',
      pemberiPersetujuan: 'Manager Pangkalan Balai',
      status: 'approved',
      createdAt: '2026-10-27T09:45:00+07:00'
    },
    {
      id: 'inc-001',
      transactionNumber: 'INC/SH/202610/001',
      type: 'OTHER_INCOME',
      branchId: 'spring-hill',
      tanggal: '2026-10-27',
      kategori: 'Pemasukan Lainnya',
      deskripsi: 'Pemasukan komisi kemitraan sponsor brand botol eco-friendly',
      nominal: 200000,
      metodePembayaran: 'Transfer BCA',
      akunKas: 'Bank BCA Operasional',
      petugasInput: 'Finance Melly',
      pemberiPersetujuan: 'Direktur RCA',
      status: 'approved',
      createdAt: '2026-10-27T16:00:00+07:00'
    }
  ];

  const shifts: ShiftRecord[] = [
    {
      id: 'shift-sh-01',
      branchId: 'spring-hill',
      kasirName: 'Kasir Rina (Spring Hill)',
      startTime: '2026-10-29T08:00:00+07:00',
      modalAwal: 500000,
      totalPenjualanCash: 0,
      totalPenjualanNonCash: 765000,
      totalPengeluaranKas: 0,
      status: 'open'
    },
    {
      id: 'shift-sdr-01',
      branchId: 'sudirman',
      kasirName: 'Kasir Dimas (Sudirman)',
      startTime: '2026-10-29T08:00:00+07:00',
      modalAwal: 500000,
      totalPenjualanCash: 275000,
      totalPenjualanNonCash: 0,
      totalPengeluaranKas: 0,
      status: 'open'
    },
    {
      id: 'shift-pkb-01',
      branchId: 'pangkalan-balai',
      kasirName: 'Kasir Sari (Pangkalan Balai)',
      startTime: '2026-10-29T08:00:00+07:00',
      modalAwal: 300000,
      totalPenjualanCash: 0,
      totalPenjualanNonCash: 360000,
      totalPengeluaranKas: 125000,
      status: 'open'
    }
  ];

  return {
    branches: JSON.parse(JSON.stringify(BRANCHES)),
    systemSettings: JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SETTINGS)),
    customers,
    mergeLogs: [],
    products,
    services,
    transactions,
    expenses,
    shifts,
    auditLogs: [
      {
        id: 'aud-001',
        timestamp: now,
        user: 'System Bootstrapper',
        action: 'INITIALIZE_RCA_DATABASE',
        details: { branches: 3, products: products.length, services: services.length }
      }
    ]
  };
}

class ClinicDatabase {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;
  private dbVersion: number = Date.now();
  private changeListeners: Array<(event: { type: string; version: number; timestamp: string; details?: any }) => void> = [];

  constructor() {
    this.data = this.loadFromFile();
  }

  public getVersion(): number {
    return this.dbVersion;
  }

  public onChange(listener: (event: { type: string; version: number; timestamp: string; details?: any }) => void) {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  public notifyChange(type: string, details?: any) {
    this.dbVersion = Date.now();
    const event = {
      type,
      version: this.dbVersion,
      timestamp: new Date().toISOString(),
      details
    };
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error executing change listener:', err);
      }
    }
  }

  private loadFromFile(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Hydrate missing fields for backward compatibility
        if (!parsed.branches || !Array.isArray(parsed.branches) || parsed.branches.length === 0) {
          parsed.branches = JSON.parse(JSON.stringify(BRANCHES));
        }
        if (!parsed.systemSettings) {
          parsed.systemSettings = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
        }
        if (!Array.isArray(parsed.products)) parsed.products = [];
        if (!Array.isArray(parsed.services)) parsed.services = [];
        if (!Array.isArray(parsed.customers)) parsed.customers = [];
        if (!Array.isArray(parsed.transactions)) parsed.transactions = [];
        if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
        if (!Array.isArray(parsed.shifts)) parsed.shifts = [];
        if (!Array.isArray(parsed.auditLogs)) parsed.auditLogs = [];
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load database file, generating fresh seed:', err);
    }
    const initial = getInitialData();
    this.saveToFile(initial);
    return initial;
  }

  private saveToFile(stateToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(stateToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving clinic database:', err);
    }
  }

  public scheduleSave(changeType: string = 'DATA_MUTATED', details?: any) {
    this.notifyChange(changeType, details);
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToFile();
    }, 200);
  }

  // --- Audit Logging ---
  public logAudit(user: string, action: string, details: any) {
    const entry = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      user,
      action,
      details
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) this.data.auditLogs.pop();
    this.scheduleSave('AUDIT_LOG_ADDED', { action });
    return entry;
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  // --- Branch Management ---
  public getBranches(): Branch[] {
    if (!this.data.branches || this.data.branches.length === 0) {
      this.data.branches = JSON.parse(JSON.stringify(BRANCHES));
    }
    return this.data.branches;
  }

  public getBranchById(id: string): Branch | undefined {
    return this.getBranches().find(b => b.id === id);
  }

  public updateBranch(id: BranchId, updates: Partial<Branch>, actor: string): Branch {
    const branches = this.getBranches();
    const idx = branches.findIndex(b => b.id === id);
    if (idx === -1) {
      throw new Error(`Cabang dengan ID "${id}" tidak ditemukan.`);
    }

    const current = branches[idx];
    const updated: Branch = {
      ...current,
      ...updates,
      id: current.id, // Preserve ID
      code: updates.code ? updates.code.trim().toUpperCase() : current.code
    };

    branches[idx] = updated;
    this.data.branches = branches;
    this.logAudit(actor, 'UPDATE_BRANCH', { branchId: id, updates });
    this.scheduleSave('BRANCH_UPDATED', { branchId: id });
    return updated;
  }

  // --- System Settings ---
  public getSystemSettings(): SystemSettings {
    if (!this.data.systemSettings) {
      this.data.systemSettings = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
    }
    return this.data.systemSettings;
  }

  public updateSystemSettings(updates: Partial<SystemSettings>, actor: string): SystemSettings {
    const current = this.getSystemSettings();
    const updated: SystemSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };
    this.data.systemSettings = updated;
    this.logAudit(actor, 'UPDATE_SYSTEM_SETTINGS', { updates });
    this.scheduleSave('SYSTEM_SETTINGS_UPDATED');
    return updated;
  }

  // --- Database Backup & Restore ---
  public getBackupSnapshot(actor: string): BackupSnapshot {
    const branches = this.getBranches();
    const settings = this.getSystemSettings();
    const snapshot: BackupSnapshot = {
      appName: 'RCA Skincare Management System',
      backupVersion: '2.5',
      timestamp: new Date().toISOString(),
      exportedBy: actor,
      summary: {
        branchCount: branches.length,
        productCount: this.data.products.length,
        serviceCount: this.data.services.length,
        customerCount: this.data.customers.length,
        transactionCount: this.data.transactions.length,
        expenseCount: this.data.expenses.length,
        shiftCount: this.data.shifts.length
      },
      data: {
        branches,
        products: this.data.products,
        services: this.data.services,
        customers: this.data.customers,
        transactions: this.data.transactions,
        expenses: this.data.expenses,
        shifts: this.data.shifts,
        systemSettings: settings,
        auditLogs: this.data.auditLogs
      }
    };
    this.logAudit(actor, 'GENERATE_BACKUP_SNAPSHOT', { summary: snapshot.summary });
    return snapshot;
  }

  public restoreBackup(payload: any, actor: string): { success: boolean; stats: any } {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Format file backup tidak valid: Bukan objek JSON yang sesuai.');
    }

    const backupData = payload.data || payload;

    if (!Array.isArray(backupData.products) || !Array.isArray(backupData.services) || !Array.isArray(backupData.customers)) {
      throw new Error('Struktur data backup tidak lengkap: Membutuhkan data tabel products, services, dan customers.');
    }

    // Safety emergency dump
    try {
      const emergencyDir = path.join(DATA_DIR, 'recovery');
      if (!fs.existsSync(emergencyDir)) fs.mkdirSync(emergencyDir, { recursive: true });
      fs.writeFileSync(
        path.join(emergencyDir, `pre_restore_${Date.now()}.json`),
        JSON.stringify(this.data, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.warn('Could not write pre-restore safety dump:', e);
    }

    this.data.products = backupData.products;
    this.data.services = backupData.services;
    this.data.customers = backupData.customers;
    if (Array.isArray(backupData.transactions)) this.data.transactions = backupData.transactions;
    if (Array.isArray(backupData.expenses)) this.data.expenses = backupData.expenses;
    if (Array.isArray(backupData.shifts)) this.data.shifts = backupData.shifts;
    if (Array.isArray(backupData.branches) && backupData.branches.length > 0) this.data.branches = backupData.branches;
    if (backupData.systemSettings && typeof backupData.systemSettings === 'object') this.data.systemSettings = backupData.systemSettings;
    if (Array.isArray(backupData.mergeLogs)) this.data.mergeLogs = backupData.mergeLogs;

    const stats = {
      branches: this.data.branches.length,
      products: this.data.products.length,
      services: this.data.services.length,
      customers: this.data.customers.length,
      transactions: this.data.transactions.length,
      expenses: this.data.expenses.length
    };

    this.logAudit(actor, 'RESTORE_DATABASE_SNAPSHOT', {
      sourceTimestamp: payload.timestamp || 'Unknown',
      restoredStats: stats
    });

    this.saveToFile();
    this.notifyChange('DATABASE_RESTORED', { stats });

    return { success: true, stats };
  }

  // --- Customers ---
  public getCustomers(branchId?: string, query?: string) {
    let list = this.data.customers;
    if (branchId && branchId !== 'all') {
      list = list.filter(c => c.cabangPendaftaran === branchId);
    }
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(c => 
        c.namaLengkap.toLowerCase().includes(q) ||
        c.nomorTelepon.includes(q) ||
        c.customerCode.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getCustomerById(id: string) {
    return this.data.customers.find(c => c.id === id);
  }

  public checkCustomerDuplicate(phone: string, name: string, excludeId?: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanName = name.trim().toLowerCase();
    
    return this.data.customers.find(c => {
      if (excludeId && c.id === excludeId) return false;
      const cPhone = c.nomorTelepon.replace(/[^0-9]/g, '');
      const cName = c.namaLengkap.trim().toLowerCase();
      return (cleanPhone && cPhone === cleanPhone) || (cleanName && cName === cleanName);
    });
  }

  public addCustomer(data: Omit<Customer, 'id' | 'customerCode' | 'createdAt' | 'updatedAt' | 'version'>, actor: string) {
    const duplicate = this.checkCustomerDuplicate(data.nomorTelepon, data.namaLengkap);
    if (duplicate) {
      throw new Error(`Customer dengan nomor telepon ${data.nomorTelepon} atau nama serupa sudah terdaftar (${duplicate.customerCode} - ${duplicate.namaLengkap})`);
    }

    const count = this.data.customers.length + 1;
    const customerCode = `RCA-CUST-${String(count).padStart(3, '0')}`;
    const id = 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const now = new Date().toISOString();

    const newCust: Customer = {
      ...data,
      id,
      customerCode,
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    this.data.customers.unshift(newCust);
    this.logAudit(actor, 'CREATE_CUSTOMER', { id, customerCode, name: newCust.namaLengkap });
    this.scheduleSave();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>, actor: string) {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer tidak ditemukan');

    if (updates.nomorTelepon || updates.namaLengkap) {
      const targetPhone = updates.nomorTelepon || this.data.customers[idx].nomorTelepon;
      const targetName = updates.namaLengkap || this.data.customers[idx].namaLengkap;
      const duplicate = this.checkCustomerDuplicate(targetPhone, targetName, id);
      if (duplicate) {
        throw new Error(`Data nomor telepon atau nama bentrok dengan customer lain: ${duplicate.customerCode} - ${duplicate.namaLengkap}`);
      }
    }

    const current = this.data.customers[idx];
    const updated: Customer = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: current.version + 1
    };

    this.data.customers[idx] = updated;
    this.logAudit(actor, 'UPDATE_CUSTOMER', { id, updates });
    this.scheduleSave();
    return updated;
  }

  public archiveCustomer(id: string, actor: string) {
    const cust = this.getCustomerById(id);
    if (!cust) throw new Error('Customer tidak ditemukan');
    return this.updateCustomer(id, { status: 'inactive' }, actor);
  }

  public deleteCustomer(id: string, actor: string) {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer tidak ditemukan');
    const cust = this.data.customers[idx];
    const hasTransactions = this.data.transactions.some(t => t.customerId === id);
    if (hasTransactions) {
      cust.status = 'inactive';
      cust.updatedAt = new Date().toISOString();
      this.logAudit(actor, 'ARCHIVE_CUSTOMER', { id, name: cust.namaLengkap, reason: 'Memiliki riwayat transaksi' });
      this.scheduleSave();
      return { ...cust, archived: true };
    } else {
      this.data.customers.splice(idx, 1);
      this.logAudit(actor, 'DELETE_CUSTOMER', { id, name: cust.namaLengkap });
      this.scheduleSave();
      return { id, deleted: true };
    }
  }

  public mergeCustomers(primaryId: string, mergedId: string, reason: string, actor: string) {
    if (primaryId === mergedId) throw new Error('Customer utama dan duplikat tidak boleh sama');
    const primary = this.getCustomerById(primaryId);
    const merged = this.getCustomerById(mergedId);
    if (!primary || !merged) throw new Error('Customer yang akan digabung tidak ditemukan');

    // Re-link all transactions from merged to primary
    let updatedTrxCount = 0;
    this.data.transactions.forEach(t => {
      if (t.customerId === mergedId) {
        t.customerId = primaryId;
        updatedTrxCount++;
      }
    });

    // Mark merged customer as inactive with note
    merged.status = 'inactive';
    merged.catatanNonmedis = `[MERGED KE ${primary.customerCode} (${primary.namaLengkap})]: ${merged.catatanNonmedis || ''} - Alasan: ${reason}`;
    merged.updatedAt = new Date().toISOString();

    const mergeLog: CustomerMergeLog = {
      id: 'mrg-' + Date.now(),
      primaryCustomerId: primaryId,
      mergedCustomerId: mergedId,
      mergedCustomerName: merged.namaLengkap,
      mergedCustomerPhone: merged.nomorTelepon,
      mergedAt: new Date().toISOString(),
      mergedBy: actor,
      reason
    };

    this.data.mergeLogs.push(mergeLog);
    this.logAudit(actor, 'MERGE_CUSTOMERS', { primaryId, mergedId, updatedTrxCount, reason });
    this.scheduleSave();
    return { primary, merged, updatedTrxCount, mergeLog };
  }

  public getCustomerHistory(customerId: string) {
    const transactions = this.data.transactions.filter(t => t.customerId === customerId);
    
    const productPurchases: { transactionId: string; invoiceNumber: string; date: string; branchId: BranchId; item: any }[] = [];
    const serviceTreatments: { transactionId: string; invoiceNumber: string; date: string; branchId: BranchId; item: any; dokter?: string }[] = [];
    const payments: { transactionId: string; invoiceNumber: string; date: string; branchId: BranchId; total: number; method: string; status: string }[] = [];
    const refunds: any[] = [];

    let totalSpent = 0;
    const branchVisitCount: Record<string, number> = {};
    const serviceCount: Record<string, number> = {};

    transactions.forEach(t => {
      branchVisitCount[t.branchId] = (branchVisitCount[t.branchId] || 0) + 1;

      if (t.status === 'COMPLETED') {
        totalSpent += t.totalTagihan;
      }

      payments.push({
        transactionId: t.id,
        invoiceNumber: t.invoiceNumber,
        date: t.createdAt,
        branchId: t.branchId,
        total: t.totalTagihan,
        method: t.metodePembayaran,
        status: t.status
      });

      if (t.refundRecord) {
        refunds.push({
          transactionId: t.id,
          invoiceNumber: t.invoiceNumber,
          date: t.refundRecord.refundedAt,
          refundAmount: t.refundRecord.amount,
          reason: t.refundRecord.reason,
          refundItems: t.refundRecord.refundItems
        });
      }

      t.items.forEach(it => {
        if (it.itemType === 'PRODUCT') {
          productPurchases.push({
            transactionId: t.id,
            invoiceNumber: t.invoiceNumber,
            date: t.createdAt,
            branchId: t.branchId,
            item: it
          });
        } else {
          serviceCount[it.snapshotNama] = (serviceCount[it.snapshotNama] || 0) + it.kuantitas;
          serviceTreatments.push({
            transactionId: t.id,
            invoiceNumber: t.invoiceNumber,
            date: t.createdAt,
            branchId: t.branchId,
            item: it,
            dokter: it.petugasDokter
          });
        }
      });
    });

    const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Belum ada';
    const favoriteBranch = Object.entries(branchVisitCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return {
      totalSpent,
      visitCount: transactions.length,
      lastVisit: transactions[transactions.length - 1]?.createdAt || null,
      topService,
      favoriteBranch,
      transactions,
      productPurchases,
      serviceTreatments,
      payments,
      refunds
    };
  }

  // --- Products & Inventory ---
  public getProducts(branchId?: BranchId) {
    return this.data.products;
  }

  public getProductById(id: string) {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, actor: string) {
    const id = 'prod-' + Date.now();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.products.push(newProduct);
    this.logAudit(actor, 'CREATE_PRODUCT', { id, code: newProduct.kodeProduk, name: newProduct.namaProduk });
    this.scheduleSave();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>, actor: string) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produk tidak ditemukan');
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logAudit(actor, 'UPDATE_PRODUCT', { id, updates });
    this.scheduleSave();
    return this.data.products[idx];
  }

  public updateStockOpname(id: string, branchId: BranchId, newStock: number, keterangan: string, actor: string) {
    const prod = this.getProductById(id);
    if (!prod) throw new Error('Produk tidak ditemukan');
    const oldStock = prod.stokPerCabang[branchId] || 0;
    prod.stokPerCabang[branchId] = newStock;
    prod.updatedAt = new Date().toISOString();

    this.logAudit(actor, 'STOCK_OPNAME_ADJUSTMENT', {
      productId: id,
      branchId,
      oldStock,
      newStock,
      difference: newStock - oldStock,
      keterangan
    });
    this.scheduleSave();
    return prod;
  }

  public deleteProduct(id: string, actor: string) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produk tidak ditemukan');
    const prod = this.data.products[idx];
    const hasTransactions = this.data.transactions.some(t => t.items.some(i => i.itemType === 'PRODUCT' && i.referenceId === id));
    if (hasTransactions) {
      prod.status = 'archived';
      prod.updatedAt = new Date().toISOString();
      this.logAudit(actor, 'ARCHIVE_PRODUCT', { id, name: prod.namaProduk, reason: 'Memiliki riwayat transaksi' });
      this.scheduleSave();
      return { ...prod, archived: true };
    } else {
      this.data.products.splice(idx, 1);
      this.logAudit(actor, 'DELETE_PRODUCT', { id, name: prod.namaProduk });
      this.scheduleSave();
      return { id, deleted: true };
    }
  }

  // --- Services Master ---
  public getServices(branchId?: BranchId) {
    if (!branchId || branchId === ('all' as any)) {
      return this.data.services;
    }
    return this.data.services.filter(s => s.cabangPenyedia.includes(branchId));
  }

  public getServiceById(id: string) {
    return this.data.services.find(s => s.id === id);
  }

  public addService(serviceData: Omit<ServiceItem, 'id' | 'riwayatHarga' | 'createdAt' | 'updatedAt' | 'version'>, actor: string) {
    const id = 'srv-' + Date.now();
    const now = new Date().toISOString();
    const newService: ServiceItem = {
      ...serviceData,
      id,
      riwayatHarga: [],
      createdAt: now,
      updatedAt: now,
      version: 1
    };
    this.data.services.push(newService);
    this.logAudit(actor, 'CREATE_SERVICE', { id, code: newService.kodeJasa, name: newService.namaJasa });
    this.scheduleSave();
    return newService;
  }

  public updateService(id: string, updates: Partial<ServiceItem>, reason: string | undefined, actor: string) {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Jasa tidak ditemukan');
    const current = this.data.services[idx];

    const riwayatHarga = [...current.riwayatHarga];
    if (updates.hargaDasar !== undefined && updates.hargaDasar !== current.hargaDasar) {
      riwayatHarga.unshift({
        date: new Date().toISOString().split('T')[0],
        changedBy: actor,
        oldPrice: current.hargaDasar,
        newPrice: updates.hargaDasar,
        reason: reason || 'Penyesuaian tarif jasa klinik'
      });
    }

    this.data.services[idx] = {
      ...current,
      ...updates,
      riwayatHarga,
      updatedAt: new Date().toISOString(),
      version: current.version + 1
    };

    this.logAudit(actor, 'UPDATE_SERVICE', { id, updates, reason });
    this.scheduleSave();
    return this.data.services[idx];
  }

  public archiveService(id: string, actor: string) {
    return this.updateService(id, { status: 'inactive' }, 'Arsip layanan klinik', actor);
  }

  public deleteService(id: string, actor: string) {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Jasa tidak ditemukan');
    const srv = this.data.services[idx];
    const hasTransactions = this.data.transactions.some(t => t.items.some(i => i.itemType === 'SERVICE' && i.referenceId === id));
    if (hasTransactions) {
      srv.status = 'inactive';
      srv.updatedAt = new Date().toISOString();
      this.logAudit(actor, 'ARCHIVE_SERVICE', { id, name: srv.namaJasa, reason: 'Memiliki riwayat transaksi' });
      this.scheduleSave();
      return { ...srv, archived: true };
    } else {
      this.data.services.splice(idx, 1);
      this.logAudit(actor, 'DELETE_SERVICE', { id, name: srv.namaJasa });
      this.scheduleSave();
      return { id, deleted: true };
    }
  }

  // --- POS Transactions ---
  public getTransactions(filter?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    customerId?: string;
  }) {
    let list = this.data.transactions;
    if (filter?.branchId && filter.branchId !== 'all') {
      list = list.filter(t => t.branchId === filter.branchId);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(t => t.status === filter.status);
    }
    if (filter?.customerId) {
      list = list.filter(t => t.customerId === filter.customerId);
    }
    if (filter?.startDate) {
      list = list.filter(t => t.createdAt.slice(0, 10) >= filter.startDate!);
    }
    if (filter?.endDate) {
      list = list.filter(t => t.createdAt.slice(0, 10) <= filter.endDate!);
    }
    return list;
  }

  public getTransactionById(id: string) {
    return this.data.transactions.find(t => t.id === id);
  }

  public checkout(payload: {
    branchId: BranchId;
    customerId: string;
    isWalkIn: boolean;
    customerSnapshot?: { nama: string; telepon: string; code?: string };
    items: {
      itemType: 'PRODUCT' | 'SERVICE';
      referenceId: string;
      kuantitas: number;
      diskon: number;
      petugasDokter?: string;
    }[];
    totalDiskon: number;
    pajak: number;
    nominalBayar: number;
    metodePembayaran: any;
    akunKas: any;
    kasirName: string;
    shiftId?: string;
    idempotencyKey: string;
    notes?: string;
  }, actor: string): Transaction {
    // 1. Idempotency Check: prevent duplicate billing on double click
    const existing = this.data.transactions.find(t => t.idempotencyKey === payload.idempotencyKey);
    if (existing) {
      return existing;
    }

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Keranjang belanja kosong');
    }

    // 2. Validate and snapshot items with atomic stock verification
    const processedItems: any[] = [];
    let subtotalProduk = 0;
    let subtotalJasa = 0;
    let calculatedHpp = 0;

    for (const item of payload.items) {
      if (item.kuantitas <= 0) throw new Error('Kuantitas item harus lebih dari 0');

      if (item.itemType === 'PRODUCT') {
        const prod = this.getProductById(item.referenceId);
        if (!prod) throw new Error(`Produk dengan ID ${item.referenceId} tidak ditemukan`);

        const currentStock = prod.stokPerCabang[payload.branchId] || 0;
        if (currentStock < item.kuantitas) {
          throw new Error(`Stok produk "${prod.namaProduk}" tidak mencukupi di cabang ini (Tersisa: ${currentStock}, Diminta: ${item.kuantitas})`);
        }

        // Deduct inventory atomically
        prod.stokPerCabang[payload.branchId] = currentStock - item.kuantitas;
        prod.updatedAt = new Date().toISOString();

        const unitPrice = prod.hargaJual;
        const lineSubtotal = (unitPrice * item.kuantitas) - (item.diskon || 0);
        subtotalProduk += lineSubtotal;
        calculatedHpp += (prod.hargaModal * item.kuantitas);

        processedItems.push({
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          itemType: 'PRODUCT',
          referenceId: prod.id,
          snapshotKode: prod.kodeProduk,
          snapshotNama: prod.namaProduk,
          snapshotHargaSatuan: unitPrice,
          snapshotHargaModal: prod.hargaModal,
          kuantitas: item.kuantitas,
          diskon: item.diskon || 0,
          subtotal: lineSubtotal
        });
      } else {
        // SERVICE
        const srv = this.getServiceById(item.referenceId);
        if (!srv) throw new Error(`Jasa dengan ID ${item.referenceId} tidak ditemukan`);

        // Check if branch pricing exists, otherwise fallback to base
        const unitPrice = srv.hargaCabang?.[payload.branchId] || srv.hargaDasar;
        const lineSubtotal = (unitPrice * item.kuantitas) - (item.diskon || 0);
        subtotalJasa += lineSubtotal;

        processedItems.push({
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          itemType: 'SERVICE',
          referenceId: srv.id,
          snapshotKode: srv.kodeJasa,
          snapshotNama: srv.namaJasa,
          snapshotHargaSatuan: unitPrice,
          snapshotHargaModal: 0,
          kuantitas: item.kuantitas,
          diskon: item.diskon || 0,
          subtotal: lineSubtotal,
          petugasDokter: item.petugasDokter || 'Beautician On Duty'
        });
      }
    }

    // 3. Calculate Totals (Integer IDR)
    const totalTagihan = Math.max(0, subtotalProduk + subtotalJasa - (payload.totalDiskon || 0) + (payload.pajak || 0));
    const nominalBayar = payload.nominalBayar || totalTagihan;
    const kembalian = Math.max(0, nominalBayar - totalTagihan);
    const sisaTagihan = Math.max(0, totalTagihan - nominalBayar);

    // 4. Generate Unique Sequential Invoice Number
    const branchObj = BRANCHES.find(b => b.id === payload.branchId);
    const branchCode = branchObj ? branchObj.code : 'RCA';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dailyCount = this.data.transactions.filter(t => t.branchId === payload.branchId && t.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length + 1;
    const invoiceNumber = `INV/${branchCode}/${dateStr}/${String(dailyCount).padStart(4, '0')}`;

    const id = 'trx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id,
      invoiceNumber,
      branchId: payload.branchId,
      customerId: payload.customerId,
      isWalkIn: payload.isWalkIn,
      customerSnapshot: payload.customerSnapshot,
      items: processedItems,
      subtotalProduk,
      subtotalJasa,
      totalDiskon: payload.totalDiskon || 0,
      pajak: payload.pajak || 0,
      totalTagihan,
      totalHpp: calculatedHpp,
      nominalBayar,
      kembalian,
      sisaTagihan,
      metodePembayaran: payload.metodePembayaran || 'Cash',
      akunKas: payload.akunKas || (payload.metodePembayaran === 'Cash' ? 'Kas Tunai Kasir' : 'Bank BCA Operasional'),
      status: 'COMPLETED',
      kasirName: payload.kasirName || actor,
      shiftId: payload.shiftId,
      idempotencyKey: payload.idempotencyKey,
      notes: payload.notes,
      createdAt: now,
      updatedAt: now
    };

    this.data.transactions.unshift(transaction);

    // Update active shift totals if present
    if (payload.shiftId) {
      const shift = this.data.shifts.find(s => s.id === payload.shiftId);
      if (shift && shift.status === 'open') {
        if (payload.metodePembayaran === 'Cash') {
          shift.totalPenjualanCash += nominalBayar - kembalian;
        } else {
          shift.totalPenjualanNonCash += totalTagihan;
        }
      }
    }

    this.logAudit(actor, 'POS_CHECKOUT', {
      transactionId: id,
      invoiceNumber,
      branchId: payload.branchId,
      totalTagihan,
      itemCount: processedItems.length
    });
    this.scheduleSave();
    return transaction;
  }

  public voidTransaction(id: string, reason: string, actor: string) {
    const trx = this.getTransactionById(id);
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (trx.status === 'VOID') throw new Error('Transaksi ini sudah berstatus VOID');
    if (trx.status === 'REFUNDED') throw new Error('Transaksi yang sudah di-refund tidak dapat di-void');

    // Restore inventory for products
    for (const item of trx.items) {
      if (item.itemType === 'PRODUCT') {
        const prod = this.getProductById(item.referenceId);
        if (prod) {
          prod.stokPerCabang[trx.branchId] = (prod.stokPerCabang[trx.branchId] || 0) + item.kuantitas;
          prod.updatedAt = new Date().toISOString();
        }
      }
    }

    trx.status = 'VOID';
    trx.voidReason = reason;
    trx.voidAt = new Date().toISOString();
    trx.voidBy = actor;
    trx.updatedAt = new Date().toISOString();

    this.logAudit(actor, 'VOID_TRANSACTION', { id, invoiceNumber: trx.invoiceNumber, reason });
    this.scheduleSave();
    return trx;
  }

  public refundTransaction(id: string, payload: {
    amount: number;
    reason: string;
    refundItems: { itemId: string; qty: number; amount: number }[];
    restoreStock: boolean;
  }, actor: string) {
    const trx = this.getTransactionById(id);
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (trx.status === 'VOID') throw new Error('Transaksi berstatus VOID tidak dapat di-refund');
    if (trx.status === 'REFUNDED') throw new Error('Transaksi ini sudah pernah di-refund');

    // Restore stock if requested and item is product
    if (payload.restoreStock && payload.refundItems?.length) {
      for (const refIt of payload.refundItems) {
        const originalItem = trx.items.find(i => i.id === refIt.itemId);
        if (originalItem && originalItem.itemType === 'PRODUCT') {
          const prod = this.getProductById(originalItem.referenceId);
          if (prod) {
            prod.stokPerCabang[trx.branchId] = (prod.stokPerCabang[trx.branchId] || 0) + refIt.qty;
            prod.updatedAt = new Date().toISOString();
          }
        }
      }
    }

    const refundId = 'ref-' + Date.now();
    trx.status = 'REFUNDED';
    trx.refundRecord = {
      refundId,
      originalInvoiceNumber: trx.invoiceNumber,
      amount: payload.amount,
      reason: payload.reason,
      refundedAt: new Date().toISOString(),
      refundedBy: actor,
      refundItems: payload.refundItems.map(ri => {
        const orig = trx.items.find(i => i.id === ri.itemId);
        return {
          itemId: ri.itemId,
          nama: orig?.snapshotNama || 'Item',
          qty: ri.qty,
          amount: ri.amount
        };
      })
    };
    trx.updatedAt = new Date().toISOString();

    this.logAudit(actor, 'REFUND_TRANSACTION', { id, invoiceNumber: trx.invoiceNumber, refundAmount: payload.amount, reason: payload.reason });
    this.scheduleSave();
    return trx;
  }

  // --- Expenses & Other Incomes ---
  public getExpenses(filter?: { branchId?: string; type?: string; startDate?: string; endDate?: string }) {
    let list = this.data.expenses;
    if (filter?.branchId && filter.branchId !== 'all') {
      list = list.filter(e => e.branchId === filter.branchId);
    }
    if (filter?.type) {
      list = list.filter(e => e.type === filter.type);
    }
    if (filter?.startDate) {
      list = list.filter(e => e.tanggal >= filter.startDate!);
    }
    if (filter?.endDate) {
      list = list.filter(e => e.tanggal <= filter.endDate!);
    }
    return list;
  }

  public addExpense(payload: Omit<ExpenseIncomeEntry, 'id' | 'transactionNumber' | 'createdAt'>, actor: string) {
    const branchObj = BRANCHES.find(b => b.id === payload.branchId);
    const branchCode = branchObj ? branchObj.code : 'RCA';
    const prefix = payload.type === 'EXPENSE' ? 'EXP' : 'INC';
    const dateStr = payload.tanggal.replace(/-/g, '').slice(0, 6); // YYYYMM
    const count = this.data.expenses.filter(e => e.type === payload.type && e.branchId === payload.branchId).length + 1;
    const transactionNumber = `${prefix}/${branchCode}/${dateStr}/${String(count).padStart(3, '0')}`;

    const id = 'exp-' + Date.now();
    const entry: ExpenseIncomeEntry = {
      ...payload,
      id,
      transactionNumber,
      createdAt: new Date().toISOString()
    };
    this.data.expenses.unshift(entry);
    this.logAudit(actor, 'CREATE_EXPENSE_INCOME', { id, transactionNumber, nominal: payload.nominal, type: payload.type });
    this.scheduleSave();
    return entry;
  }

  public reverseExpense(id: string, reason: string, actor: string) {
    const entry = this.data.expenses.find(e => e.id === id);
    if (!entry) throw new Error('Catatan pengeluaran tidak ditemukan');
    if (entry.status === 'reversed') throw new Error('Catatan ini sudah pernah dibatalkan (reversed)');

    entry.status = 'reversed';
    entry.catatan = `[REVERSED oleh ${actor}]: ${reason}. ${entry.catatan || ''}`;
    entry.updatedAt = new Date().toISOString();

    this.logAudit(actor, 'REVERSE_EXPENSE', { id, transactionNumber: entry.transactionNumber, reason });
    this.scheduleSave();
    return entry;
  }

  public updateExpense(id: string, updates: Partial<ExpenseIncomeEntry>, actor: string) {
    const idx = this.data.expenses.findIndex(e => e.id === id);
    if (!this.data.expenses[idx]) throw new Error('Catatan pengeluaran tidak ditemukan');
    this.data.expenses[idx] = {
      ...this.data.expenses[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logAudit(actor, 'UPDATE_EXPENSE', { id, updates });
    this.scheduleSave();
    return this.data.expenses[idx];
  }

  public deleteExpense(id: string, actor: string) {
    const idx = this.data.expenses.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Catatan pengeluaran tidak ditemukan');
    const entry = this.data.expenses[idx];
    this.data.expenses.splice(idx, 1);
    this.logAudit(actor, 'DELETE_EXPENSE', { id, transactionNumber: entry.transactionNumber });
    this.scheduleSave();
    return { id, deleted: true };
  }

  // --- Shifts ---
  public getShifts(branchId?: string) {
    let list = this.data.shifts;
    if (branchId && branchId !== 'all') {
      list = list.filter(s => s.branchId === branchId);
    }
    return list;
  }

  public startShift(payload: { branchId: BranchId; kasirName: string; modalAwal: number }, actor: string) {
    // Check if open shift exists for this branch
    const openShift = this.data.shifts.find(s => s.branchId === payload.branchId && s.status === 'open');
    if (openShift) {
      return openShift;
    }

    const id = 'shift-' + Date.now();
    const shift: ShiftRecord = {
      id,
      branchId: payload.branchId,
      kasirName: payload.kasirName || actor,
      startTime: new Date().toISOString(),
      modalAwal: payload.modalAwal,
      totalPenjualanCash: 0,
      totalPenjualanNonCash: 0,
      totalPengeluaranKas: 0,
      status: 'open'
    };
    this.data.shifts.unshift(shift);
    this.logAudit(actor, 'START_SHIFT', { id, branchId: payload.branchId, modalAwal: payload.modalAwal });
    this.scheduleSave();
    return shift;
  }

  public closeShift(id: string, payload: { totalKasAktual: number; catatan?: string }, actor: string) {
    const shift = this.data.shifts.find(s => s.id === id);
    if (!shift) throw new Error('Shift tidak ditemukan');
    if (shift.status === 'closed') throw new Error('Shift ini sudah ditutup');

    const expectedCash = shift.modalAwal + shift.totalPenjualanCash - shift.totalPengeluaranKas;
    const selisih = payload.totalKasAktual - expectedCash;

    shift.endTime = new Date().toISOString();
    shift.totalKasAktual = payload.totalKasAktual;
    shift.selisih = selisih;
    shift.catatan = payload.catatan;
    shift.status = 'closed';

    this.logAudit(actor, 'CLOSE_SHIFT', { id, expectedCash, totalKasAktual: payload.totalKasAktual, selisih });
    this.scheduleSave();
    return shift;
  }

  // --- Comprehensive Financial Calculator ---
  public calculateFinancialReports(filter: FinancialFilter) {
    // 1. Filter Transactions
    let trxs = this.data.transactions;
    if (filter.branchId !== 'all') {
      trxs = trxs.filter(t => t.branchId === filter.branchId);
    }
    if (filter.startDate) {
      trxs = trxs.filter(t => t.createdAt.slice(0, 10) >= filter.startDate);
    }
    if (filter.endDate) {
      trxs = trxs.filter(t => t.createdAt.slice(0, 10) <= filter.endDate);
    }
    if (filter.metodePembayaran && filter.metodePembayaran !== 'all') {
      trxs = trxs.filter(t => t.metodePembayaran === filter.metodePembayaran);
    }
    if (filter.statusTransaksi && filter.statusTransaksi !== 'all') {
      trxs = trxs.filter(t => t.status === filter.statusTransaksi);
    }

    // 2. Filter Expenses & Incomes
    let expList = this.data.expenses.filter(e => e.status === 'approved');
    if (filter.branchId !== 'all') {
      expList = expList.filter(e => e.branchId === filter.branchId);
    }
    if (filter.startDate) {
      expList = expList.filter(e => e.tanggal >= filter.startDate);
    }
    if (filter.endDate) {
      expList = expList.filter(e => e.tanggal <= filter.endDate);
    }
    if (filter.kategori && filter.kategori !== 'all') {
      expList = expList.filter(e => e.kategori === filter.kategori);
    }

    // Calculations
    let totalOmzet = 0;
    let penjualanProduk = 0;
    let pendapatanJasa = 0;
    let hpp = 0;
    let totalDiskon = 0;
    let totalRefund = 0;
    let jumlahTransaksi = 0;
    let penerimaanKas = 0;

    const breakdownMetodePembayaran: Record<string, number> = {
      'Cash': 0,
      'Transfer BCA': 0,
      'QRIS': 0,
      'Mandiri EDC': 0
    };

    const branchPerformance: Record<BranchId, { omzet: number; profit: number; trxCount: number; productSales: number; serviceSales: number }> = {
      'spring-hill': { omzet: 0, profit: 0, trxCount: 0, productSales: 0, serviceSales: 0 },
      'sudirman': { omzet: 0, profit: 0, trxCount: 0, productSales: 0, serviceSales: 0 },
      'pangkalan-balai': { omzet: 0, profit: 0, trxCount: 0, productSales: 0, serviceSales: 0 }
    };

    trxs.forEach(t => {
      if (t.status === 'COMPLETED') {
        totalOmzet += t.totalTagihan;
        penjualanProduk += t.subtotalProduk;
        pendapatanJasa += t.subtotalJasa;
        hpp += t.totalHpp;
        totalDiskon += t.totalDiskon;
        jumlahTransaksi += 1;
        penerimaanKas += t.nominalBayar - t.kembalian;

        breakdownMetodePembayaran[t.metodePembayaran] = (breakdownMetodePembayaran[t.metodePembayaran] || 0) + t.totalTagihan;

        if (branchPerformance[t.branchId]) {
          branchPerformance[t.branchId].omzet += t.totalTagihan;
          branchPerformance[t.branchId].productSales += t.subtotalProduk;
          branchPerformance[t.branchId].serviceSales += t.subtotalJasa;
          branchPerformance[t.branchId].trxCount += 1;
        }
      } else if (t.status === 'REFUNDED') {
        if (t.refundRecord) {
          totalRefund += t.refundRecord.amount;
        }
      }
    });

    let totalPengeluaran = 0;
    let pemasukanLainnya = 0;
    const breakdownKategoriPengeluaran: Record<string, number> = {};

    expList.forEach(e => {
      if (e.type === 'EXPENSE') {
        totalPengeluaran += e.nominal;
        breakdownKategoriPengeluaran[e.kategori] = (breakdownKategoriPengeluaran[e.kategori] || 0) + e.nominal;
      } else {
        pemasukanLainnya += e.nominal;
      }
    });

    // Gross Profit & Net Profit
    // Laba Kotor = Penjualan Produk - HPP + Pendapatan Jasa
    const labaKotor = (penjualanProduk - hpp) + pendapatanJasa;
    // Laba Bersih = Laba Kotor + Pemasukan Lainnya - Total Pengeluaran Operasional - Refund
    const labaRugiBersih = labaKotor + pemasukanLainnya - totalPengeluaran - totalRefund;

    // Account Balances (Lifetime calculated based on all completed cash flow)
    let saldoKasTunai = 1500000; // Baseline petty cash reserve across branches
    let saldoBankBCA = 12500000; // Baseline initial balance
    let saldoBankMandiri = 4500000;

    this.data.transactions.forEach(t => {
      if (t.status === 'COMPLETED') {
        const netPaid = t.nominalBayar - t.kembalian;
        if (t.akunKas === 'Kas Tunai Kasir') saldoKasTunai += netPaid;
        else if (t.akunKas === 'Bank BCA Operasional') saldoBankBCA += netPaid;
        else if (t.akunKas === 'Bank Mandiri Klinik') saldoBankMandiri += netPaid;
      } else if (t.status === 'REFUNDED' && t.refundRecord) {
        if (t.akunKas === 'Kas Tunai Kasir') saldoKasTunai -= t.refundRecord.amount;
        else if (t.akunKas === 'Bank BCA Operasional') saldoBankBCA -= t.refundRecord.amount;
        else if (t.akunKas === 'Bank Mandiri Klinik') saldoBankMandiri -= t.refundRecord.amount;
      }
    });

    this.data.expenses.filter(e => e.status === 'approved').forEach(e => {
      if (e.type === 'EXPENSE') {
        if (e.akunKas === 'Kas Tunai Kasir') saldoKasTunai -= e.nominal;
        else if (e.akunKas === 'Bank BCA Operasional') saldoBankBCA -= e.nominal;
        else if (e.akunKas === 'Bank Mandiri Klinik') saldoBankMandiri -= e.nominal;
      } else {
        if (e.akunKas === 'Kas Tunai Kasir') saldoKasTunai += e.nominal;
        else if (e.akunKas === 'Bank BCA Operasional') saldoBankBCA += e.nominal;
        else if (e.akunKas === 'Bank Mandiri Klinik') saldoBankMandiri += e.nominal;
      }
    });

    // Daily Trends for Charts
    const trendMap: Record<string, { date: string; omzet: number; expense: number; hpp: number; profit: number }> = {};
    trxs.forEach(t => {
      if (t.status === 'COMPLETED') {
        const d = t.createdAt.slice(0, 10);
        if (!trendMap[d]) trendMap[d] = { date: d, omzet: 0, expense: 0, hpp: 0, profit: 0 };
        trendMap[d].omzet += t.totalTagihan;
        trendMap[d].hpp += t.totalHpp;
      }
    });
    expList.forEach(e => {
      if (e.type === 'EXPENSE') {
        const d = e.tanggal;
        if (!trendMap[d]) trendMap[d] = { date: d, omzet: 0, expense: 0, hpp: 0, profit: 0 };
        trendMap[d].expense += e.nominal;
      }
    });
    const dailyTrends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date)).map(item => ({
      ...item,
      profit: (item.omzet - item.hpp) - item.expense
    }));

    const kpi: FinancialSummaryKPI = {
      totalOmzet,
      penerimaanKas,
      totalPengeluaran,
      hpp,
      labaKotor,
      labaRugiBersih,
      totalRefund,
      jumlahTransaksi,
      pendapatanJasa,
      pendapatanProduk: penjualanProduk,
      pemasukanLainnya,
      totalDiskon,
      saldoKasTunai,
      saldoBankBCA,
      saldoBankMandiri
    };

    return {
      kpi,
      breakdownMetodePembayaran,
      breakdownKategoriPengeluaran,
      branchPerformance,
      dailyTrends,
      filteredTransactions: trxs,
      filteredExpenses: expList
    };
  }

  // --- Batch Import Methods ---
  public batchImportProducts(items: any[], actor: string) {
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        const kodeProduk = (row.kodeProduk || row['Kode Produk'] || row.kode || '').toString().trim();
        const namaProduk = (row.namaProduk || row['Nama Produk'] || row.nama || '').toString().trim();
        if (!namaProduk) {
          errors.push(`Baris ${i + 1}: Nama Produk wajib diisi`);
          continue;
        }

        const kategori = (row.kategori || row['Kategori'] || 'General').toString().trim();
        const merk = (row.merk || row['Merk / Brand'] || 'RCA Clinical Skin').toString().trim();
        const hargaModal = Math.max(0, parseInt(row.hargaModal || row['Harga Modal / HPP'] || row['Harga Modal'] || 0, 10));
        const hargaJual = Math.max(0, parseInt(row.hargaJual || row['Harga Jual'] || 0, 10));
        const minStok = Math.max(0, parseInt(row.minStok || row['Batas Min Stok'] || row.minimumStok || 5, 10));

        const shStok = Math.max(0, parseInt(row.stokSpringHill ?? row['Stok Spring Hill'] ?? 0, 10));
        const sdrStok = Math.max(0, parseInt(row.stokSudirman ?? row['Stok Sudirman'] ?? 0, 10));
        const pkbStok = Math.max(0, parseInt(row.stokPangkalanBalai ?? row['Stok Pangkalan Balai'] ?? 0, 10));

        const existing = kodeProduk ? this.data.products.find(p => p.kodeProduk.toLowerCase() === kodeProduk.toLowerCase()) : null;
        if (existing) {
          existing.namaProduk = namaProduk;
          existing.kategori = kategori;
          existing.merk = merk;
          existing.hargaModal = hargaModal;
          existing.hargaJual = hargaJual;
          existing.minStok = minStok;
          existing.stokPerCabang = {
            'spring-hill': shStok,
            'sudirman': sdrStok,
            'pangkalan-balai': pkbStok
          };
          existing.status = 'active';
          existing.updatedAt = now;
          updated++;
        } else {
          const autoCode = kodeProduk || `RCA-PRD-${String(this.data.products.length + 1).padStart(3, '0')}`;
          const newProduct: Product = {
            id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            kodeProduk: autoCode,
            namaProduk,
            kategori,
            merk,
            hargaModal,
            hargaJual,
            minStok,
            stokPerCabang: {
              'spring-hill': shStok,
              'sudirman': sdrStok,
              'pangkalan-balai': pkbStok
            },
            status: 'active',
            createdAt: now,
            updatedAt: now
          };
          this.data.products.push(newProduct);
          inserted++;
        }
      } catch (err: any) {
        errors.push(`Baris ${i + 1}: ${err.message || 'Gagal memproses data'}`);
      }
    }

    this.logAudit(actor, 'BATCH_IMPORT_PRODUCTS', { total: items.length, inserted, updated, errorsCount: errors.length });
    this.scheduleSave();
    return { inserted, updated, total: items.length, errors };
  }

  public batchImportCustomers(items: any[], actor: string) {
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        const namaLengkap = (row.namaLengkap || row['Nama Lengkap'] || row.nama || '').toString().trim();
        const rawPhone = (row.nomorTelepon || row['Nomor Telepon'] || row.telepon || row.noHp || '').toString();
        const nomorTelepon = rawPhone.replace(/[^0-9]/g, '');
        if (!namaLengkap || !nomorTelepon) {
          errors.push(`Baris ${i + 1}: Nama Lengkap dan Nomor Telepon wajib diisi`);
          continue;
        }

        const email = (row.email || row['Email'] || '').toString().trim();
        const tanggalLahir = (row.tanggalLahir || row['Tanggal Lahir'] || '').toString().trim();
        const alamat = (row.alamat || row['Alamat'] || '').toString().trim();
        let cabangPendaftaran: BranchId = (row.cabangPendaftaran || row['Cabang Pendaftaran'] || 'spring-hill').toString().trim().toLowerCase() as BranchId;
        if (cabangPendaftaran.includes('sudirman')) cabangPendaftaran = 'sudirman';
        else if (cabangPendaftaran.includes('pangkalan')) cabangPendaftaran = 'pangkalan-balai';
        else cabangPendaftaran = 'spring-hill';

        const catatanNonMedis = (row.catatanNonMedis || row['Catatan Non-Medis'] || row.catatan || '').toString().trim();

        // Check duplicate by phone number
        const existing = this.data.customers.find(c => c.nomorTelepon === nomorTelepon);
        if (existing) {
          existing.namaLengkap = namaLengkap;
          if (email) existing.email = email;
          if (tanggalLahir) existing.tanggalLahir = tanggalLahir;
          if (alamat) existing.alamat = alamat;
          if (catatanNonMedis) existing.catatanNonmedis = catatanNonMedis;
          existing.updatedAt = now;
          existing.version += 1;
          updated++;
        } else {
          const count = this.data.customers.length + 1;
          const customerCode = (row.customerCode || row['Kode Customer'] || `RCA-CUST-${String(count).padStart(3, '0')}`).toString().trim();
          const newCustomer: Customer = {
            id: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            customerCode,
            namaLengkap,
            nomorTelepon,
            email: email || undefined,
            tanggalLahir: tanggalLahir || undefined,
            alamat: alamat || undefined,
            cabangPendaftaran,
            persetujuanKomunikasi: true,
            tanggalRegistrasi: now.split('T')[0],
            catatanNonmedis: catatanNonMedis || undefined,
            status: 'active',
            createdAt: now,
            updatedAt: now,
            version: 1
          };
          this.data.customers.push(newCustomer);
          inserted++;
        }
      } catch (err: any) {
        errors.push(`Baris ${i + 1}: ${err.message || 'Gagal memproses data'}`);
      }
    }

    this.logAudit(actor, 'BATCH_IMPORT_CUSTOMERS', { total: items.length, inserted, updated, errorsCount: errors.length });
    this.scheduleSave();
    return { inserted, updated, total: items.length, errors };
  }

  public batchImportServices(items: any[], actor: string) {
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        const kodeJasa = (row.kodeJasa || row['Kode Jasa'] || row.kode || '').toString().trim();
        const namaJasa = (row.namaJasa || row['Nama Jasa'] || row.nama || '').toString().trim();
        if (!namaJasa) {
          errors.push(`Baris ${i + 1}: Nama Jasa wajib diisi`);
          continue;
        }

        const kategoriJasa = (row.kategoriJasa || row['Kategori Jasa'] || row.kategori || 'Facial').toString().trim();
        const deskripsi = (row.deskripsi || row['Deskripsi'] || '').toString().trim();
        const hargaDasar = Math.max(0, parseInt(row.hargaDasar || row['Harga Dasar'] || row.harga || 0, 10));
        const durasiMenit = Math.max(15, parseInt(row.durasiMenit || row['Durasi (Menit)'] || row.durasi || 60, 10));

        let cabangPenyedia: BranchId[] = ['spring-hill', 'sudirman', 'pangkalan-balai'];
        const rawCabang = (row.cabangPenyedia || row['Cabang Penyedia'] || '').toString();
        if (rawCabang && rawCabang !== 'Semua Cabang') {
          const parsedBranches: BranchId[] = [];
          if (rawCabang.toLowerCase().includes('spring')) parsedBranches.push('spring-hill');
          if (rawCabang.toLowerCase().includes('sudirman')) parsedBranches.push('sudirman');
          if (rawCabang.toLowerCase().includes('pangkalan')) parsedBranches.push('pangkalan-balai');
          if (parsedBranches.length > 0) cabangPenyedia = parsedBranches;
        }

        const existing = kodeJasa ? this.data.services.find(s => s.kodeJasa.toLowerCase() === kodeJasa.toLowerCase()) : null;
        if (existing) {
          if (existing.hargaDasar !== hargaDasar) {
            existing.riwayatHarga.unshift({
              date: now.split('T')[0],
              changedBy: actor,
              oldPrice: existing.hargaDasar,
              newPrice: hargaDasar,
              reason: 'Penyesuaian melalui Batch Import Excel'
            });
          }
          existing.namaJasa = namaJasa;
          existing.kategoriJasa = kategoriJasa;
          existing.deskripsi = deskripsi;
          existing.hargaDasar = hargaDasar;
          existing.durasiMenit = durasiMenit;
          existing.cabangPenyedia = cabangPenyedia;
          existing.updatedAt = now;
          existing.version += 1;
          updated++;
        } else {
          const autoCode = kodeJasa || `JS-CLN-${String(this.data.services.length + 1).padStart(3, '0')}`;
          const newService: ServiceItem = {
            id: 'srv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            kodeJasa: autoCode,
            namaJasa,
            kategoriJasa,
            deskripsi,
            hargaDasar,
            durasiMenit,
            petugasWewenang: ['Senior Beautician', 'Dokter Aesthetic'],
            cabangPenyedia,
            status: 'active',
            riwayatHarga: [],
            createdAt: now,
            updatedAt: now,
            version: 1
          };
          this.data.services.push(newService);
          inserted++;
        }
      } catch (err: any) {
        errors.push(`Baris ${i + 1}: ${err.message || 'Gagal memproses data'}`);
      }
    }

    this.logAudit(actor, 'BATCH_IMPORT_SERVICES', { total: items.length, inserted, updated, errorsCount: errors.length });
    this.scheduleSave();
    return { inserted, updated, total: items.length, errors };
  }

  public batchImportExpenses(items: any[], actor: string) {
    let inserted = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        const nominal = Math.max(0, parseInt(row.nominal || row['Nominal'] || row['Jumlah'] || 0, 10));
        if (nominal <= 0) {
          errors.push(`Baris ${i + 1}: Nominal harus lebih dari 0`);
          continue;
        }

        let branchId: BranchId = (row.branchId || row['Cabang'] || 'spring-hill').toString().toLowerCase() as BranchId;
        if (branchId.includes('sudirman')) branchId = 'sudirman';
        else if (branchId.includes('pangkalan')) branchId = 'pangkalan-balai';
        else branchId = 'spring-hill';

        const rawType = (row.type || row['Tipe'] || row['Jenis'] || 'EXPENSE').toString().toUpperCase();
        const type: 'EXPENSE' | 'OTHER_INCOME' = rawType.includes('INC') || rawType.includes('MASUK') ? 'OTHER_INCOME' : 'EXPENSE';
        const kategori = (row.kategori || row['Kategori'] || 'Lain-lain').toString().trim();
        const deskripsi = (row.deskripsi || row['Deskripsi'] || row['Keterangan'] || 'Import Pengeluaran').toString().trim();
        const tanggal = (row.tanggal || row['Tanggal'] || now.split('T')[0]).toString().trim();
        const metodePembayaran = (row.metodePembayaran || row['Metode Pembayaran'] || 'Cash').toString().trim();
        const akunKas = (row.akunKas || row['Akun Kas'] || (metodePembayaran === 'Cash' ? 'Kas Tunai Kasir' : 'Bank BCA Operasional')).toString().trim();

        const branchObj = BRANCHES.find(b => b.id === branchId);
        const branchCode = branchObj ? branchObj.code : 'RCA';
        const prefix = type === 'EXPENSE' ? 'EXP' : 'INC';
        const dateStr = tanggal.replace(/-/g, '').slice(0, 6);
        const count = this.data.expenses.filter(e => e.type === type && e.branchId === branchId).length + 1;
        const transactionNumber = `${prefix}/${branchCode}/${dateStr}/${String(count).padStart(3, '0')}`;

        const entry: ExpenseIncomeEntry = {
          id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          transactionNumber,
          branchId,
          type,
          kategori,
          nominal,
          deskripsi,
          tanggal,
          metodePembayaran: metodePembayaran as any,
          akunKas: akunKas as any,
          status: 'approved',
          petugasInput: actor,
          pemberiPersetujuan: 'Admin Pusat',
          createdAt: now
        };
        this.data.expenses.unshift(entry);
        inserted++;
      } catch (err: any) {
        errors.push(`Baris ${i + 1}: ${err.message || 'Gagal memproses data'}`);
      }
    }

    this.logAudit(actor, 'BATCH_IMPORT_EXPENSES', { total: items.length, inserted, errorsCount: errors.length });
    this.scheduleSave();
    return { inserted, total: items.length, errors };
  }
}

export const clinicDb = new ClinicDatabase();

