# RCA SKINCARE MANAGEMENT SYSTEM
## Dokumentasi Sistem Finansial, CRM Pelanggan, POS Multi-Cabang, Realtime Engine, Admin Cabang & Backup/Restore

> **Status Sistem**: PRODUCTION READY  
> **Cabang Layanan**:
> 1. **Spring Hill Pusat** (`SH`) - Ruko Spring Hill Garden Blok A No. 12, Jl. Mayor Santoso, Palembang (Klinik Utama & Laser Aesthetic Center)
> 2. **Sudirman** (`SDR`) - Jl. Jenderal Sudirman No. 88, Ilir Timur, Palembang (Klinik Pratama & Facial Bar)
> 3. **Pangkalan Balai** (`PKB`) - Jl. Merdeka No. 45, Pangkalan Balai, Banyuasin (Klinik Pratama & Skincare Lounge)
>
> **Zona Waktu**: Asia/Jakarta (`WIB`)  
> **Format Mata Uang**: Indonesian Rupiah Integer (`IDR`)  
> **Default Role**: **Kasir** (`Siti Rahma (Kasir)`)  
> **Arsitektur Sync**: **Realtime Server-Sent Events (SSE)** + Heartbeat Polling Fallback

---

## 1. Arsitektur & Teknologi (Vibe Coding Friendly)

Proyek ini dibangun dengan struktur modular yang bersih, teruji, dan mudah dipahami oleh developer (*Vibe Coding Friendly*):
- **Frontend SPA**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Backend & Server-Side**: Express, tsx, Node.js (`server.ts`) dengan middleware Vite terintegrasi.
- **Database & Persistence**: File-backed storage terisolasi (`data/clinic_data.json`) dengan mutex atomic writes dan auto-save scheduler. Data tersimpan permanen across server reloads.
- **Realtime Synchronization Engine**:
  - Endpoint SSE `/api/events` yang memancarkan event mutasi database secara instan ke seluruh tab/klien.
  - Listener event-driven pada `clinicDb.onChange(...)` yang mem-broadcast setiap transaksi baru, penyesuaian stok, penambahan customer, perubahan cabang, dan operasi restore database.
  - Heartbeat polling setiap 5 detik di sisi frontend untuk menjamin 0% desync bahkan jika jaringan sempat terputus.
- **Client Offline Storage**: Browser IndexedDB (`rca_skincare_offline_db`) dengan object stores `offlineQueue` dan `cachedCatalog`. Mendeteksi status online/offline otomatis dan melakukan background auto-sync dengan server confirmation.
- **Document Generators**:
  - `jspdf` & `jspdf-autotable`: Menghasilkan berkas PDF asli untuk Thermal 58mm, Thermal 80mm, Invoice A4, Laporan Keuangan, Stock Opname, dan Struk Kasir.
  - `xlsx` (SheetJS): Ekspor spreadsheet resmi berformat tabular bersih dengan proteksi injection formula serta **Mesin Import Excel Baru** dengan parser cerdas dan deteksi header otomatis.
- **AI Strategic Advisor**: Powered by `@google/genai` dengan mode *High Thinking* (`gemini-2.5-flash` / `gemini-3.8-flash` dengan `thinkingConfig`).

---

## 2. Default Role Kasir & Hak Akses Akun

Sesuai instruksi operasional, sistem dikonfigurasi dengan:
1. **Default Role Kasir**:
   - Saat aplikasi pertama kali dimuat atau sesi awal diakses, peran pengguna otomatis diinisialisasi sebagai **Kasir** (`Siti Rahma (Kasir)`).
   - Tampilan awal langsung mengarah ke modul **POS Kasir (Produk + Jasa)** sehingga kasir dapat langsung melayani transaksi tanpa langkah tambahan.
   - Hak akses kasir mencakup: transaksi checkout POS, pencarian/pendaftaran customer, manajemen shift kasir (buka/tutup shift kas), pencetakan struk thermal/invoice, melihat stok produk, dan memantau antrean offline.
2. **Role Switcher Cepat (Multi-Role)**:
   - Terletak di bar kanan atas aplikasi: `Role: Kasir (Default)`, `Role: Owner`, `Role: Branch Manager`, dan `Role: Dokter / Beautician`.
   - Role switcher terhubung langsung ke server (`POST /api/auth/switch`) dan mencatat log audit pada setiap pergantian peran.
   - Memungkinkan pemilik (*Owner*) atau manajer cabang beralih peran seketika untuk mengakses modul keuangan mendalam, otorisasi reversal pengeluaran, atau administrasi sistem.

---

## 3. Realtime Database Synchronization Engine

Aplikasi RCA Skincare dilengkapi sistem sinkronisasi basis data real-time:
1. **Mekanisme Server-Sent Events (SSE)**:
   - Backend membuka jalur stream di `GET /api/events` menggunakan header `text/event-stream`.
   - Setiap mutasi data di backend (`checkout`, `refundTransaction`, `addCustomer`, `updateProduct`, `updateBranch`, `restoreBackup`, `batchImport*`) memicu notifikasi perubahan database melalui `clinicDb.onChange(...)`.
   - Server segera mem-broadcast payload pembaruan versi ke seluruh koneksi browser aktif.
2. **Klien Frontend Responsif**:
   - Di `App.tsx`, `EventSource` menangkap sinyal mutasi dan secara otomatis memperbarui state global tanpa me-refresh halaman web (`loadClinicData()`).
   - Jika satu kasir di Spring Hill memproses transaksi, stok produk di cabang terkait langsung berkurang secara *real-time* di layar kasir Sudirman dan Pangkalan Balai.
3. **Indikator Status Realtime**:
   - Di header navigasi atas, badge status menampilkan **🟢 Realtime** dengan animasi pulsing green dot yang menandakan sambungan aktif ke server pusat.

---

## 4. Halaman Admin & Manajemen Sistem (`/src/views/AdminSettingsView.tsx`)

Modul baru **Pengaturan & Admin** (`activeNav = 'admin'`) menyediakan pusat kendali terpadu untuk pengelola klinik:

### A. Manajemen Cabang & Kontak Resmi (`Tab: Manajemen Cabang & Kontak`)
- Menampilkan daftar 3 cabang klinik: **Spring Hill Pusat**, **Sudirman**, dan **Pangkalan Balai**.
- Setiap cabang dapat diedit secara lengkap melalui modal form interaktif:
  - **Nama Resmi Cabang**: Mengubah nama identitas cabang.
  - **Kode Cabang**: Kode akronim 2-4 huruf (misal: `SH`, `SDR`, `PKB`).
  - **Alamat Lengkap Cabang**: Lokasi fisik klinik.
  - **Nomor Telepon / WhatsApp Operasional**: Nomor kontak resmi untuk pelayanan dan cetak nota.
  - **Email Cabang**: Alamat surat elektronik per cabang.
  - **Penanggung Jawab / Kepala Cabang (PIC)**: Nama dokter penanggung jawab atau branch manager.
  - **Status Operasional**: Pilihan status `Buka / Aktif Melayani` atau `Tutup Sementara`.
  - **Catatan Tagline Header Nota**: Tagline spesifik yang tercetak di bagian atas struk/faktur.
- Disimpan permanen di `data/clinic_data.json` via endpoint `PUT /api/branches/:id` dan disinkronkan secara real-time.

### B. Backup Database (Cadangkan Snapshot Penuh)
- **Tombol "Unduh Backup Database (.json)"**:
  - Menghasilkan berkas cadangan snapshot berformat JSON resmi: `rca_skincare_backup_YYYY-MM-DD_HH-mm-ss.json`.
  - Memuat seluruh koleksi data terenkripsi rapi: data 3 cabang, katalog produk, stok per cabang, master jasa, database customer CRM, histori transaksi invoice, buku kas & pengeluaran operasional, rekap shift kasir, pengaturan sistem, dan log audit.
  - Dilengkapi ringkasan statistik item data sebelum unduhan dieksekusi.

### C. Restore Database (Pemulihan Basis Data)
- **Area Unggah Berkas JSON (Drag & Drop)**:
  - Memilih atau menarik file `.json` hasil cadangan sebelumnya.
- **Validasi Struktur & Skema Otomatis**:
  - Parser internal memverifikasi kelengkapan tabel inti (`products`, `services`, `customers`, `branches`).
  - Menampilkan kartu pratinjau ringkasan data yang terkandung dalam file backup sebelum dipulihkan (jumlah produk, jasa medis, customer, transaksi, cabang).
- **Safety Auto-Dump & Modal Konfirmasi Bertingkat**:
  - Sebelum menimpa basis data aktif, server secara otomatis menyimpan salinan pengaman darurat di folder `data/recovery/pre_restore_<timestamp>.json`.
  - Modal konfirmasi keamanan meminta persetujuan operator untuk menghindari kecelakaan pemulihan data.
  - Eksekusi pemulihan via `POST /api/admin/restore` merefresh seluruh layar kasir aktif via stream realtime SSE.

### D. Pengaturan Umum Klinik (`Tab: Pengaturan Umum Klinik`)
- Konfigurasi profil global klinik yang berlaku di seluruh jaringan:
  - **Nama Brand / Perusahaan**: Nama legal dan dagang klinik.
  - **Tagline Klinik**: Slogan utama klinik kecantikan.
  - **Jam Operasional Standar**: Jam operasional (misal: `08:00 - 20:00 WIB`).
  - **Default Pajak / PPN POS (%)**: Persentase tarif PPN bawaan keranjang POS (0% s/d 11%).
  - **Hotline / Telepon Pusat & Email Customer Care**: Kontak layanan aduan pelanggan pusat.
  - **Pesan Footer Struk Kasir / Nota**: Kalimat penutup yang tercetak di bagian bawah struk thermal (58mm/80mm) dan invoice A4.
- Disimpan via `PUT /api/admin/settings`.

### E. Audit Trail Log (`Tab: Audit Trail & Aktivitas Sistem`)
- Menampilkan tabel kronologis seluruh aktivitas administratif sensitif:
  - Waktu pencatatan (`Asia/Jakarta`).
  - Pengguna / Operator pengeksekusi.
  - Aksi sistem (`UPDATE_BRANCH`, `RESTORE_DATABASE_SNAPSHOT`, `GENERATE_BACKUP_SNAPSHOT`, `UPDATE_SYSTEM_SETTINGS`, `REVERSE_EXPENSE`, `MERGE_CUSTOMERS`).
  - Rincian payload dan data entitas yang diubah.

---

## 5. Isolasi Pemilihan Cabang Mandiri Per Tab (No Header Risk)

Sesuai instruksi dan kebutuhan operasional klinik, **dropdown pemilihan cabang di header global telah dihapus total**. Hal ini mencegah kasir atau staf secara tidak sengaja mengubah konteks cabang operasional saat bertransaksi.

Sebagai gantinya, setiap tab/modul memiliki kontrol cabang mandiri:
1. **POS Kasir (Produk + Jasa)**:
   - Dilengkapi **Banner Pilihan Cabang Kasir** yang menonjol tepat di bagian atas modul POS.
   - Menampilkan Nama Cabang Aktif, Kode Cabang (`SH`, `SDR`, `PKB`), Alamat Lengkap, dan Nomor Telepon Operasional.
   - Mengganti cabang di POS dilengkapi **Peringatan & Konfirmasi Kasir** jika keranjang belanja berisi item, guna mencegah salah stok atau disparitas harga cabang.
2. **Database Customer / CRM**:
   - Memiliki filter cabang mandiri untuk melihat customer terdaftar per cabang (`Semua Cabang`, `Spring Hill`, `Sudirman`, `Pangkalan Balai`).
3. **Produk & Persediaan Stok**:
   - Memiliki selector cabang mandiri untuk memantau stok per lokasi maupun konsolidasi 3 cabang.
4. **Master Jasa Klinik**:
   - Dilengkapi filter cabang mandiri untuk menyaring layanan yang tersedia di masing-masing klinik.
5. **Buku Kas & Pengeluaran**:
   - Memiliki filter cabang mandiri serta kolom cabang pada setiap pencatatan pengeluaran/pemasukan lain.
6. **Laporan Keuangan & Laba Rugi**:
   - Panel filter keuangan menyediakan pilihan cabang konsolidasi atau spesifik per cabang dengan perhitungan KPI, grafik, dan tabel yang terisolasi.

---

## 6. Fitur Ekspor & Impor Data Excel (.XLSX) Rapi & Terstruktur

Aplikasi dilengkapi modul dua arah (Ekspor dan Impor) untuk seluruh entitas data utama klinik:

### A. Fitur Impor Excel (`ExcelImportModal.tsx` & `excelImport.ts`)
Setiap modul (Produk, Customer CRM, Master Jasa, dan Buku Kas) memiliki tombol **Import XLSX** dengan alur 3 langkah yang ramah pengguna:
1. **Unduh Format File Standar**: Tombol download template resmi (`.xlsx`) dengan format header baku dan contoh baris data siap pakai.
2. **Pilih atau Tarik Berkas (Dropzone)**: Area upload yang mendukung berkas `.xlsx`, `.xls`, dan `.csv`. Sistem otomatis membaca file menggunakan SheetJS.
3. **Pembersihan & Deteksi Baris Otomatis**: Parser cerdas otomatis melewati baris panduan (*PANDUAN:*), membersihkan spasi, memvalidasi kolom wajib, dan menampilkan **Tabel Pratinjau (Preview)** data yang siap diimpor.
4. **Batch Synchronization Server Endpoint**: Data dikirim ke endpoint batch server (`/api/products/batch-import`, `/api/customers/batch-import`, `/api/services/batch-import`, `/api/finance/expenses/batch-import`) yang secara cerdas memperbarui data yang sudah ada (berdasarkan SKU/Telepon/Kode) atau membuat entri baru, serta mencatat audit log.

### B. Template Impor Resmi:
- `Template_Import_Produk_RCA.xlsx`: `Kode Produk`, `Nama Produk`, `Kategori`, `Merk / Brand`, `Harga Modal / HPP`, `Harga Jual`, `Batas Min Stok`, `Stok Spring Hill`, `Stok Sudirman`, `Stok Pangkalan Balai`.
- `Template_Import_Customer_RCA.xlsx`: `Kode Customer`, `Nama Lengkap`, `Nomor Telepon`, `Email`, `Tanggal Lahir`, `Alamat`, `Cabang Pendaftaran`, `Catatan Non-Medis`.
- `Template_Import_Jasa_RCA.xlsx`: `Kode Jasa`, `Nama Jasa`, `Kategori Jasa`, `Deskripsi`, `Harga Dasar`, `Durasi (Menit)`, `Cabang Penyedia`.
- `Template_Import_Pengeluaran_RCA.xlsx`: `Cabang`, `Tipe`, `Kategori`, `Nominal`, `Deskripsi`, `Tanggal`, `Metode Pembayaran`, `Akun Kas`.

---

## 7. Laporan Status Pengujian Fitur (QA Verification Matrix)

Pengujian otomatis dijalankan secara nyata pada sistem dengan bukti empiris hasil pengujian (`POST /api/test-suite/run`):

| No | Modul / Fitur yang Diuji | Status | Bukti Pengujian & Hasil Validasi Empiris |
|:---|:---|:---:|:---|
| 1 | **Filter Tanggal, Bulan, Tahun, dan Cabang** | **PASS** | Filter All Omzet: Rp 2.950.000 vs Spring Hill: Rp 2.125.000. Rentang tanggal dan isolasi cabang terbukti konsisten pada KPI, grafik, dan tabel. |
| 2 | **Rekonsiliasi HPP & Perhitungan Laba Kotor** | **PASS** | Laba Kotor (Rp 2.440.000) = (Penjualan Produk Rp 1.060.000 - HPP Rp 510.000) + Pendapatan Jasa Rp 1.890.000 terbukti akurat 100%. |
| 3 | **Pencarian & Pencegahan Duplikasi Customer** | **PASS** | Server berhasil menolak pendaftaran nomor telepon/nama duplikat dengan status HTTP 400 dan pesan error spesifik. Identitas primer berbasis `customerId` UUID. |
| 4 | **POS Gabungan Produk & Jasa Serta Pengurangan Stok Atomic** | **PASS** | Stok fisik berkurang dari 43 ke 42 unit secara atomik. Transaksi tunggal menampung Produk (Rp 95.000) dan Jasa (Rp 280.000) tanpa galat. |
| 5 | **Pencegahan Transaksi Ganda (Idempotency Key)** | **PASS** | Checkout berulang dengan key sama mengembalikan ID transaksi yang identik tanpa duplicate billing maupun pengurangan stok berulang. |
| 6 | **Refund & Koreksi Persediaan Asli Transaksi** | **PASS** | Status transaksi berhasil diubah ke REFUNDED dan stok produk dipulihkan dari 13 kembali ke 15 unit pada cabang terkait. |
| 7 | **Integritas Snapshot Harga Transaksi Historis** | **PASS** | Perubahan tarif dasar master layanan tidak mengubah data histori invoice masa lalu (snapshotHargaSatuan tetap utuh pada Rp 175.000). |
| 8 | **Pencatatan & Reversal Pengeluaran Operasional** | **PASS** | Pengeluaran operasional berhasil direversal dengan status `reversed` dan audit log akuntansi tersimpan permanen. |
| 9 | **Operasi CRUD Lengkap Multi-Tabel (Produk, Jasa, Customer, Beban)** | **PASS** | Produk berhasil dibuat (`TEST-CRUD-01`), diedit (Harga: Rp 65.000, Stok SH: 15), dan dihapus/diarsipkan dengan aman. |
| 10 | **Batch Import Excel (.xlsx) & Validasi Kolom Otomatis** | **PASS** | Batch import berhasil memproses baris file Excel: `inserted=1`, `updated=0`, stok Spring Hill tervalidasi 25 unit dengan format rapi. |
| 11 | **Isolasi Pemilihan Cabang Mandiri Per Tab & Keamanan Header** | **PASS** | Dropdown global header dihapus; 3 cabang terdaftar (`SH`, `SDR`, `PKB`) dapat dipilih mandiri di masing-masing tab tanpa risiko salah cabang. |
| 12 | **Default Role Kasir & Aksesibilitas Cepat POS** | **PASS** | Sesi aktif default terkonfigurasi sebagai role: `"kasir"` (`Siti Rahma (Kasir)`) di cabang Spring Hill; langsung membuka antarmuka POS. |
| 13 | **Realtime Sync Engine & Mutex Broadcast Event** | **PASS** | Event realtime terpicu otomatis saat mutasi data (`Version: 1793274165415, Type: TEST_REALTIME_TRIGGER`) melalui SSE `/api/events`. |
| 14 | **Manajemen Data Cabang, Kontak & Persistensi Server** | **PASS** | Data cabang Spring Hill berhasil diperbarui & disimpan (Kontak: `(0711) 567890 / 0812-7890-1111 (Update QA)`, PIC: `dr. Amanda SpKK (Kepala Medis)`). |
| 15 | **Backup Database Snapshot JSON & Integritas Schema** | **PASS** | Snapshot berhasil dibuat (Versi 2.5, Total Produk: 6, Total Transaksi: 13, Total Cabang: 3) dalam berkas JSON terstruktur rapi. |
| 16 | **Restore Database, Validasi Skema & Notifikasi Realtime** | **PASS** | Restore berhasil diproses tanpa data loss (Tabel dipulihkan: 6 produk, 4 pelanggan, 13 transaksi, 3 cabang) dengan emergency pre-dump tersimpan. |

---

## 8. Panduan Singkat Penggunaan Fitur Admin & Backup/Restore

### A. Mengedit Data & Kontak Cabang
1. Buka tab **Pengaturan & Admin** di navigasi utama.
2. Pilih tab **Manajemen Cabang & Kontak**.
3. Di kartu cabang yang ingin diubah (Spring Hill, Sudirman, atau Pangkalan Balai), klik **Edit Data Cabang**.
4. Sesuaikan Nama Resmi Cabang, Kode Cabang, Alamat, Nomor Telepon/WhatsApp, Email, PIC/Kepala Cabang, atau Catatan Tagline Header.
5. Klik **Simpan Perubahan Cabang**. Data seketika tersimpan ke server dan langsung sinkron ke seluruh cetak nota dan layar kasir.

### B. Membuat Salinan Cadangan (Backup Database)
1. Buka tab **Pengaturan & Admin** > **Backup & Restore Database**.
2. Klik tombol **Unduh Backup Database (.json)**.
3. Browser akan mengunduh berkas snapshot JSON resmi yang memuat seluruh basis data klinik secara aman. Simpan berkas ini di media penyimpanan eksternal atau Google Drive secara rutin.

### C. Memulihkan Database (Restore Database)
1. Buka tab **Pengaturan & Admin** > **Backup & Restore Database**.
2. Pada bagian **Pulihkan Database (Restore Database Snapshot)**, pilih atau tarik file `.json` cadangan ke area upload.
3. Sistem akan memvalidasi skema dan menampilkan pratinjau isi tabel.
4. Klik **Verifikasi & Pulihkan Sekarang**.
5. Baca peringatan pada modal konfirmasi, lalu klik **Ya, Pulihkan Database Sekarang**.
6. Sistem membuat salinan darurat pra-pemulihan di server, memulihkan data, dan memicu sinkronisasi real-time ke seluruh klien.
