import React, { useState, useMemo } from 'react';
import { 
  Package, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Building2, 
  RefreshCw, 
  Trash2, 
  Search, 
  X, 
  SlidersHorizontal,
  Archive,
  UploadCloud
} from 'lucide-react';
import { Product, Branch, BranchId } from '../types/index.ts';
import { formatRupiah, formatNumber } from '../lib/formatters.ts';
import { exportStockOpnameExcel, downloadProductTemplate } from '../lib/excelExport.ts';
import { generateStockOpnamePdf } from '../lib/pdfGenerator.ts';
import { ExcelImportModal } from '../components/ExcelImportModal.tsx';

interface ProductsInventoryViewProps {
  products: Product[];
  branches: Branch[];
  currentBranchId: BranchId;
  onRefreshData: () => void;
  onShowPdfPreview: (doc: any, filename: string, title: string) => void;
}

export const ProductsInventoryView: React.FC<ProductsInventoryViewProps> = ({
  products,
  branches,
  currentBranchId,
  onRefreshData,
  onShowPdfPreview
}) => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<'all' | BranchId>(currentBranchId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Stock Opname Modal State
  const [opnameProduct, setOpnameProduct] = useState<Product | null>(null);
  const [opnameBranch, setOpnameBranch] = useState<BranchId>(currentBranchId);
  const [opnameNewStock, setOpnameNewStock] = useState<number>(0);
  const [opnameKeterangan, setOpnameKeterangan] = useState('');

  // Add / Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [kodeProduk, setKodeProduk] = useState('');
  const [namaProduk, setNamaProduk] = useState('');
  const [kategori, setKategori] = useState('Cleanser');
  const [merk, setMerk] = useState('RCA Clinical Skin');
  const [hargaModal, setHargaModal] = useState<number>(50000);
  const [hargaJual, setHargaJual] = useState<number>(100000);
  const [minStok, setMinStok] = useState<number>(10);
  const [stokSpringHill, setStokSpringHill] = useState<number>(20);
  const [stokSudirman, setStokSudirman] = useState<number>(15);
  const [stokPangkalanBalai, setStokPangkalanBalai] = useState<number>(10);
  const [productStatus, setProductStatus] = useState<'active' | 'archived'>('active');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeBranchObj = branches.find(b => b.id === selectedBranchFilter) || { name: 'Semua Cabang (Konsolidasi)' };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.kategori));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        p.namaProduk.toLowerCase().includes(q) || 
        p.kodeProduk.toLowerCase().includes(q) ||
        p.merk.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'all' || p.kategori === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setKodeProduk(`RCA-SK-${Date.now().toString().slice(-4)}`);
    setNamaProduk('');
    setKategori('Serum');
    setMerk('RCA Clinical Skin');
    setHargaModal(50000);
    setHargaJual(120000);
    setMinStok(10);
    setStokSpringHill(20);
    setStokSudirman(15);
    setStokPangkalanBalai(10);
    setProductStatus('active');
    setFormError(null);
    setShowProductModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setKodeProduk(p.kodeProduk);
    setNamaProduk(p.namaProduk);
    setKategori(p.kategori);
    setMerk(p.merk);
    setHargaModal(p.hargaModal);
    setHargaJual(p.hargaJual);
    setMinStok(p.minStok);
    setStokSpringHill(p.stokPerCabang['spring-hill'] ?? 0);
    setStokSudirman(p.stokPerCabang['sudirman'] ?? 0);
    setStokPangkalanBalai(p.stokPerCabang['pangkalan-balai'] ?? 0);
    setProductStatus(p.status);
    setFormError(null);
    setShowProductModal(true);
  };

  // Submit Add or Edit Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!namaProduk.trim()) {
      setFormError('Nama produk wajib diisi');
      return;
    }
    if (hargaModal < 0 || hargaJual < 0) {
      setFormError('Harga modal dan harga jual tidak boleh negatif');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        kodeProduk: kodeProduk.trim(),
        namaProduk: namaProduk.trim(),
        kategori: kategori.trim(),
        merk: merk.trim(),
        hargaModal: Number(hargaModal),
        hargaJual: Number(hargaJual),
        minStok: Number(minStok),
        stokPerCabang: {
          'spring-hill': Number(stokSpringHill),
          'sudirman': Number(stokSudirman),
          'pangkalan-balai': Number(stokPangkalanBalai)
        },
        status: productStatus
      };

      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan data produk');
      }

      setShowProductModal(false);
      onRefreshData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete / Archive Product
  const handleDeleteProduct = async (p: Product) => {
    if (confirm(`Hapus atau arsipkan produk "${p.namaProduk}" (${p.kodeProduk})? Jika produk memiliki riwayat transaksi, sistem akan otomatis mengarsipkannya agar data transaksi lama tetap utuh.`)) {
      try {
        const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          if (data.archived) {
            alert(`Produk berhasil diarsipkan: ${data.message || 'Status produk diubah menjadi Nonaktif/Archived.'}`);
          } else {
            alert('Produk berhasil dihapus permanen.');
          }
          onRefreshData();
        } else {
          alert(data.error || 'Gagal menghapus produk');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Stock Opname Handler
  const handleOpenOpname = (p: Product) => {
    setOpnameProduct(p);
    const bId = selectedBranchFilter === 'all' ? 'spring-hill' : selectedBranchFilter;
    setOpnameBranch(bId);
    setOpnameNewStock(p.stokPerCabang[bId] || 0);
    setOpnameKeterangan('Penghitungan fisik stock opname periodik');
  };

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameProduct) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${opnameProduct.id}/opname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: opnameBranch,
          newStock: Number(opnameNewStock),
          keterangan: opnameKeterangan.trim()
        })
      });
      if (res.ok) {
        setOpnameProduct(null);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const doc = generateStockOpnamePdf(filteredProducts, selectedBranchFilter, activeBranchObj.name);
    onShowPdfPreview(doc, `RCA_Stock_Opname_${selectedBranchFilter}_${new Date().toISOString().slice(0, 10)}.pdf`, 'Berita Acara & Nilai Stock Opname');
  };

  const handleExportExcel = () => {
    exportStockOpnameExcel(filteredProducts, selectedBranchFilter, activeBranchObj.name);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Manajemen Produk & Persediaan Stok</h1>
            <span className="bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-rose-200">
              {filteredProducts.length} Produk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tambah produk baru, edit harga modal/jual, update stok per cabang, stock opname fisik, dan ekspor dokumen
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <FileText className="h-4 w-4 text-rose-600" />
            <span>Cetak PDF Opname</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Ekspor XLSX Opname</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-2xs transition"
          >
            <UploadCloud className="h-4 w-4 text-rose-600" />
            <span>Import XLSX Produk</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk, kode SKU, atau merk skincare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-rose-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Cabang:</span>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-rose-500"
            >
              <option value="all">Semua Cabang (Konsolidasi)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name.replace('RCA Skincare - ', '')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products & Valuation Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-semibold">No</th>
                <th className="px-4 py-3.5 font-semibold">Nama Produk Skincare</th>
                <th className="px-4 py-3.5 font-semibold">Jenis / Merk</th>
                <th className="px-4 py-3.5 font-semibold text-center">Stok Spring Hill</th>
                <th className="px-4 py-3.5 font-semibold text-center">Stok Sudirman</th>
                <th className="px-4 py-3.5 font-semibold text-center">Stok Pkl. Balai</th>
                <th className="px-4 py-3.5 font-semibold text-center">Total Unit</th>
                <th className="px-4 py-3.5 font-semibold text-right">Harga Modal (HPP)</th>
                <th className="px-4 py-3.5 font-semibold text-right">Harga Jual</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada produk ditemukan. Klik tombol <strong>Tambah Produk Baru</strong> untuk mendaftarkan SKU baru.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const totalUnit = Object.values(p.stokPerCabang).reduce((a, b) => a + b, 0);
                  const isLowStock = totalUnit <= (p.minStok * 3);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 font-mono text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div>{p.namaProduk}</div>
                        <div className="font-mono text-[10px] text-slate-400 font-normal">{p.kodeProduk}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>{p.kategori}</div>
                        <div className="text-[10px] text-slate-400">{p.merk}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {p.stokPerCabang['spring-hill'] ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {p.stokPerCabang['sudirman'] ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {p.stokPerCabang['pangkalan-balai'] ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {totalUnit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                        {formatRupiah(p.hargaModal)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatRupiah(p.hargaJual)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status === 'active' ? 'Aktif' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenOpname(p)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                            title="Opname Fisik Stok"
                          >
                            <RefreshCw className="h-3 w-3 text-rose-600" />
                            <span>Opname</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit Data Produk & Stok"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Hapus / Arsipkan Produk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingProduct ? 'Edit Data Produk Skincare' : 'Tambah Produk Skincare Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingProduct ? `Perbarui SKU: ${editingProduct.kodeProduk}` : 'Daftarkan SKU baru ke katalog dan alokasikan stok per cabang'}
                </p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kode SKU Produk *</label>
                  <input
                    type="text"
                    required
                    value={kodeProduk}
                    onChange={(e) => setKodeProduk(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kategori Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Cleanser, Serum, Toner, Sunscreen..."
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Nama Lengkap Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Glowing Serum Niacinamide 10% 30ml"
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Merk / Brand</label>
                  <input
                    type="text"
                    required
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status Produk</label>
                  <select
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="active">Aktif (Dijual di POS)</option>
                    <option value="archived">Nonaktif (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Harga Modal (HPP) *</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={hargaModal}
                    onChange={(e) => setHargaModal(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Harga Jual *</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={hargaJual}
                    onChange={(e) => setHargaJual(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Batas Min. Stok</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={minStok}
                    onChange={(e) => setMinStok(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Direct Stock Distribution per Branch */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Alokasi Jumlah Stok Per Cabang</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-800">
                    Total: {Number(stokSpringHill) + Number(stokSudirman) + Number(stokPangkalanBalai)} Unit
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600">Spring Hill Pusat</label>
                    <input
                      type="number"
                      min={0}
                      value={stokSpringHill}
                      onChange={(e) => setStokSpringHill(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600">Sudirman</label>
                    <input
                      type="number"
                      min={0}
                      value={stokSudirman}
                      onChange={(e) => setStokSudirman(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600">Pangkalan Balai</label>
                    <input
                      type="number"
                      min={0}
                      value={stokPangkalanBalai}
                      onChange={(e) => setStokPangkalanBalai(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan Produk' : 'Tambah Produk ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Opname Adjustment Modal */}
      {opnameProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Formulir Stock Opname</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{opnameProduct.namaProduk}</p>
              </div>
              <button onClick={() => setOpnameProduct(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpname} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Cabang Penyesuaian Fisik</label>
                <select
                  value={opnameBranch}
                  onChange={(e) => {
                    const bId = e.target.value as BranchId;
                    setOpnameBranch(bId);
                    setOpnameNewStock(opnameProduct.stokPerCabang[bId] || 0);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg text-xs">
                <span className="text-slate-500">Stok Sistem Tercatat:</span>
                <span className="font-bold text-slate-800">{opnameProduct.stokPerCabang[opnameBranch] || 0} Unit</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Jumlah Stok Fisik Riil Aktual *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={opnameNewStock}
                  onChange={(e) => setOpnameNewStock(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Keterangan / Alasan Selisih *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Selisih 1 botol pecah saat perakitan display rak etalase"
                  value={opnameKeterangan}
                  onChange={(e) => setOpnameKeterangan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpnameProduct(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Penyesuaian'}
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
        type="products"
        onDownloadTemplate={downloadProductTemplate}
        onSuccess={onRefreshData}
      />

    </div>
  );
};
