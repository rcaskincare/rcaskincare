import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Search, 
  User, 
  UserPlus, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Percent, 
  Check, 
  AlertCircle,
  Clock,
  Printer,
  Building2
} from 'lucide-react';
import { Product, ServiceItem, Customer, Branch, BranchId, PaymentMethod, CashAccount, Transaction } from '../types/index.ts';
import { formatRupiah } from '../lib/formatters.ts';
import { QuickAddCustomerModal } from '../components/QuickAddCustomerModal.tsx';
import { PaymentModal } from '../components/PaymentModal.tsx';
import { queueOfflineTransaction } from '../lib/indexedDb.ts';

interface CartItem {
  id: string;
  itemType: 'PRODUCT' | 'SERVICE';
  referenceId: string;
  kode: string;
  nama: string;
  hargaSatuan: number;
  hargaModal: number;
  kuantitas: number;
  diskon: number;
  petugasDokter?: string;
  maxStock?: number;
}

interface PosViewProps {
  products: Product[];
  services: ServiceItem[];
  customers: Customer[];
  branches: Branch[];
  currentBranch: Branch;
  currentBranchId: BranchId;
  onSelectBranch: (branchId: BranchId) => void;
  currentUserName: string;
  isOnline: boolean;
  onRefreshData: () => void;
  onShowPdfPreview: (doc: any, filename: string, title: string) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  services,
  customers,
  branches,
  currentBranch,
  currentBranchId,
  onSelectBranch,
  currentUserName,
  isOnline,
  onRefreshData,
  onShowPdfPreview
}) => {
  const [activeCatalogTab, setActiveCatalogTab] = useState<'all' | 'products' | 'services'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Customer State in POS
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Filtered Customers for Search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 5);
    const q = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.status === 'active' &&
      (c.namaLengkap.toLowerCase().includes(q) || c.nomorTelepon.includes(q) || c.customerCode.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [customers, customerSearch]);

  // Filtered Catalog
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.status !== 'active') return false;
      const matchSearch = p.namaProduk.toLowerCase().includes(searchQuery.toLowerCase()) || p.kodeProduk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.kategori === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (s.status !== 'active') return false;
      if (!s.cabangPenyedia.includes(currentBranch.id)) return false;
      const matchSearch = s.namaJasa.toLowerCase().includes(searchQuery.toLowerCase()) || s.kodeJasa.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || s.kategoriJasa === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [services, searchQuery, selectedCategory, currentBranch.id]);

  // Cart Management
  const addToCart = (type: 'PRODUCT' | 'SERVICE', item: Product | ServiceItem) => {
    if (type === 'PRODUCT') {
      const prod = item as Product;
      const stock = prod.stokPerCabang[currentBranch.id] || 0;
      if (stock <= 0) {
        alert(`Stok produk "${prod.namaProduk}" habis di ${currentBranch.name}`);
        return;
      }

      setCart(prev => {
        const existing = prev.find(i => i.itemType === 'PRODUCT' && i.referenceId === prod.id);
        if (existing) {
          if (existing.kuantitas >= stock) {
            alert(`Tidak dapat menambah melebihi stok yang tersedia (${stock} unit)`);
            return prev;
          }
          return prev.map(i => i === existing ? { ...i, kuantitas: i.kuantitas + 1 } : i);
        }
        return [...prev, {
          id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          itemType: 'PRODUCT',
          referenceId: prod.id,
          kode: prod.kodeProduk,
          nama: prod.namaProduk,
          hargaSatuan: prod.hargaJual,
          hargaModal: prod.hargaModal,
          kuantitas: 1,
          diskon: 0,
          maxStock: stock
        }];
      });
    } else {
      const srv = item as ServiceItem;
      const unitPrice = srv.hargaCabang?.[currentBranch.id] || srv.hargaDasar;
      setCart(prev => {
        const existing = prev.find(i => i.itemType === 'SERVICE' && i.referenceId === srv.id);
        if (existing) {
          return prev.map(i => i === existing ? { ...i, kuantitas: i.kuantitas + 1 } : i);
        }
        return [...prev, {
          id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          itemType: 'SERVICE',
          referenceId: srv.id,
          kode: srv.kodeJasa,
          nama: srv.namaJasa,
          hargaSatuan: unitPrice,
          hargaModal: 0,
          kuantitas: 1,
          diskon: 0,
          petugasDokter: srv.petugasWewenang[0] || 'Senior Beautician'
        }];
      });
    }
  };

  const updateItemQty = (cartId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === cartId) {
        const newQty = i.kuantitas + delta;
        if (newQty <= 0) return null as any;
        if (i.maxStock && newQty > i.maxStock) {
          alert(`Maksimal stok tercapai (${i.maxStock})`);
          return i;
        }
        return { ...i, kuantitas: newQty };
      }
      return i;
    }).filter(Boolean));
  };

  const updateItemDiscount = (cartId: string, diskon: number) => {
    setCart(prev => prev.map(i => i.id === cartId ? { ...i, diskon: Math.max(0, diskon) } : i));
  };

  const updateItemStaff = (cartId: string, staff: string) => {
    setCart(prev => prev.map(i => i.id === cartId ? { ...i, petugasDokter: staff } : i));
  };

  const removeItem = (cartId: string) => {
    setCart(prev => prev.filter(i => i.id !== cartId));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan keranjang belanja kasir?')) {
      setCart([]);
      setGlobalDiscount(0);
    }
  };

  // Totals Calculation
  const subtotalProduk = cart.filter(i => i.itemType === 'PRODUCT').reduce((acc, i) => acc + (i.hargaSatuan * i.kuantitas) - i.diskon, 0);
  const subtotalJasa = cart.filter(i => i.itemType === 'SERVICE').reduce((acc, i) => acc + (i.hargaSatuan * i.kuantitas) - i.diskon, 0);
  const totalItemDiscounts = cart.reduce((acc, i) => acc + i.diskon, 0);
  const totalDiskon = totalItemDiscounts + globalDiscount;
  const totalTagihan = Math.max(0, subtotalProduk + subtotalJasa - globalDiscount);

  // Customer Select handlers
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsWalkIn(false);
    setCustomerSearch(cust.namaLengkap);
    setShowCustomerDropdown(false);
  };

  const handleToggleWalkIn = (walkIn: boolean) => {
    setIsWalkIn(walkIn);
    if (walkIn) {
      setSelectedCustomer(null);
      setCustomerSearch('');
    }
  };

  // Checkout Execution
  const handleConfirmCheckout = async (paymentDetails: {
    nominalBayar: number;
    metodePembayaran: PaymentMethod;
    akunKas: CashAccount;
    notes?: string;
  }): Promise<Transaction | null> => {
    const idempotencyKey = `idemp-${currentBranch.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const payload = {
      branchId: currentBranch.id,
      customerId: isWalkIn ? 'WALK-IN' : (selectedCustomer?.id || 'WALK-IN'),
      isWalkIn,
      customerSnapshot: isWalkIn ? {
        nama: customerSearch.trim() || 'Walk-In Guest',
        telepon: 'Walk-In'
      } : {
        nama: selectedCustomer?.namaLengkap || 'Customer',
        telepon: selectedCustomer?.nomorTelepon || '',
        code: selectedCustomer?.customerCode
      },
      items: cart.map(i => ({
        itemType: i.itemType,
        referenceId: i.referenceId,
        kuantitas: i.kuantitas,
        diskon: i.diskon,
        petugasDokter: i.petugasDokter
      })),
      totalDiskon,
      pajak: 0,
      nominalBayar: paymentDetails.nominalBayar,
      metodePembayaran: paymentDetails.metodePembayaran,
      akunKas: paymentDetails.akunKas,
      kasirName: currentUserName,
      idempotencyKey,
      notes: paymentDetails.notes
    };

    if (!isOnline) {
      // Offline mode: queue in IndexedDB
      await queueOfflineTransaction(payload);
      alert('Koneksi sedang offline. Transaksi berhasil disimpan ke antrean offline lokal dan akan disinkronkan otomatis saat online.');
      // Create local temporary representation for print
      const tempTrx: Transaction = {
        id: 'offline-' + Date.now(),
        invoiceNumber: `INV/${currentBranch.code}/OFFLINE/${Date.now().toString().slice(-4)}`,
        branchId: currentBranch.id,
        customerId: payload.customerId,
        isWalkIn: payload.isWalkIn,
        customerSnapshot: payload.customerSnapshot,
        items: cart.map(i => ({
          id: i.id,
          itemType: i.itemType,
          referenceId: i.referenceId,
          snapshotKode: i.kode,
          snapshotNama: i.nama,
          snapshotHargaSatuan: i.hargaSatuan,
          snapshotHargaModal: i.hargaModal,
          kuantitas: i.kuantitas,
          diskon: i.diskon,
          subtotal: (i.hargaSatuan * i.kuantitas) - i.diskon,
          petugasDokter: i.petugasDokter
        })),
        subtotalProduk,
        subtotalJasa,
        totalDiskon,
        pajak: 0,
        totalTagihan,
        totalHpp: cart.filter(i => i.itemType === 'PRODUCT').reduce((acc, i) => acc + (i.hargaModal * i.kuantitas), 0),
        nominalBayar: paymentDetails.nominalBayar,
        kembalian: Math.max(0, paymentDetails.nominalBayar - totalTagihan),
        sisaTagihan: 0,
        metodePembayaran: paymentDetails.metodePembayaran,
        akunKas: paymentDetails.akunKas,
        status: 'COMPLETED',
        kasirName: currentUserName,
        idempotencyKey,
        isOfflineQueue: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCart([]);
      return tempTrx;
    }

    // Online mode
    const res = await fetch('/api/pos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout gagal');

    setCart([]);
    onRefreshData();
    return data;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] overflow-hidden">
      
      {/* EXPLICIT POS BRANCH SELECTION BAR */}
      <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Cabang Kasir POS:</span>
              <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded">
                {currentBranch.code}
              </span>
              <span className="text-xs font-bold text-white">{currentBranch.name}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {currentBranch.address} &bull; Telp: {currentBranch.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <span className="text-[11px] text-slate-300 px-2 font-medium">Pilih Cabang Kasir:</span>
          {branches.map(b => {
            const isSelected = b.id === currentBranchId;
            return (
              <button
                key={b.id}
                onClick={() => {
                  if (b.id === currentBranchId) return;
                  if (cart.length > 0) {
                    if (window.confirm(`Perhatian: Keranjang kasir berisi ${cart.length} item. Mengganti cabang ke "${b.name}" akan menyesuaikan ketersediaan stok & harga cabang. Lanjutkan?`)) {
                      onSelectBranch(b.id);
                    }
                  } else {
                    onSelectBranch(b.id);
                  }
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs ring-1 ring-white/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {b.code} - {b.name.replace('RCA Skincare - ', '')}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: CATALOG BROWSER */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50 overflow-hidden">
        
        {/* Catalog Search & Category Tabs */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk skincare atau jasa treatment klinik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Catalog Type Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveCatalogTab('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeCatalogTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveCatalogTab('products')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeCatalogTab === 'products' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Produk ({products.length})</span>
              </button>
              <button
                onClick={() => setActiveCatalogTab('services')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeCatalogTab === 'services' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Jasa & Treatment ({filteredServices.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Grid Area */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Services Section */}
          {(activeCatalogTab === 'all' || activeCatalogTab === 'services') && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-rose-600" />
                  <span>Jasa Facial & Treatment Medis</span>
                </h4>
                <span className="text-[11px] text-slate-400">{filteredServices.length} layanan tersedia</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredServices.map(srv => {
                  const price = srv.hargaCabang?.[currentBranch.id] || srv.hargaDasar;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => addToCart('SERVICE', srv)}
                      className="flex flex-col justify-between text-left rounded-xl border border-rose-100 bg-white p-3.5 shadow-2xs hover:border-rose-400 hover:shadow-xs transition group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                            {srv.kodeJasa}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{srv.durasiMenit}m</span>
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-800 mt-1.5 group-hover:text-rose-600 line-clamp-2">
                          {srv.namaJasa}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {srv.deskripsi}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{formatRupiah(price)}</span>
                        <span className="text-[11px] font-semibold text-rose-600 group-hover:underline">+ Tambah</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products Section */}
          {(activeCatalogTab === 'all' || activeCatalogTab === 'products') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-slate-700" />
                  <span>Produk Skincare & Homecare</span>
                </h4>
                <span className="text-[11px] text-slate-400">{filteredProducts.length} produk katalog</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.map(prod => {
                  const stock = prod.stokPerCabang[currentBranch.id] || 0;
                  const isOutOfStock = stock <= 0;

                  return (
                    <button
                      key={prod.id}
                      disabled={isOutOfStock}
                      onClick={() => addToCart('PRODUCT', prod)}
                      className={`flex flex-col justify-between text-left rounded-xl border p-3.5 transition group ${
                        isOutOfStock 
                          ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed' 
                          : 'border-slate-200 bg-white shadow-2xs hover:border-slate-400 hover:shadow-xs cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {prod.kodeProduk}
                          </span>
                          <span className={`text-[11px] font-semibold ${
                            stock <= prod.minStok ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            Stok: {stock}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-800 mt-1.5 line-clamp-2">
                          {prod.namaProduk}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {prod.kategori} · {prod.merk}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{formatRupiah(prod.hargaJual)}</span>
                        <span className={`text-[11px] font-semibold ${isOutOfStock ? 'text-red-500' : 'text-slate-700 group-hover:underline'}`}>
                          {isOutOfStock ? 'Habis' : '+ Tambah'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT: POS CART & CUSTOMER PANEL */}
      <div className="w-96 md:w-[420px] bg-white flex flex-col justify-between shadow-lg z-10 border-l border-slate-200">
        
        {/* Customer Header Island */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-rose-600" />
              <span>Pelanggan / Pasien</span>
            </span>

            {/* Walk-in vs Member Switcher */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => handleToggleWalkIn(true)}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  isWalkIn ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Walk-In
              </button>
              <button
                type="button"
                onClick={() => handleToggleWalkIn(false)}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  !isWalkIn ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Member CRM
              </button>
            </div>
          </div>

          {/* Customer Input & Search Field */}
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={isWalkIn ? "Nama Guest Walk-In (opsional)..." : "Ketik nama / no. WhatsApp..."}
                value={customerSearch}
                onFocus={() => setShowCustomerDropdown(!isWalkIn)}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (!isWalkIn) setShowCustomerDropdown(true);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-rose-500 focus:outline-hidden"
              />
              
              {!isWalkIn && (
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white p-1.5 transition shrink-0"
                  title="Tambah Customer Baru di POS"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown Search Results */}
            {showCustomerDropdown && !isWalkIn && (
              <div className="absolute top-9 left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Tidak ditemukan. Klik tombol (+) untuk registrasi instan.
                  </div>
                ) : (
                  filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-2.5 hover:bg-rose-50/60 cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{c.namaLengkap}</span>
                        <span className="font-mono text-[10px] text-slate-500">{c.customerCode}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                        <span>{c.nomorTelepon}</span>
                        <span className="uppercase text-[10px]">{c.cabangPendaftaran}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Member Active Badge */}
            {!isWalkIn && selectedCustomer && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-900">
                <div>
                  <span className="font-bold">{selectedCustomer.namaLengkap}</span> ({selectedCustomer.customerCode})
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 p-6">
              <ShoppingBag className="h-12 w-12 text-slate-300 stroke-1" />
              <p className="mt-2 text-xs font-semibold text-slate-600">Keranjang Kasir Masih Kosong</p>
              <p className="text-[11px] text-slate-400 mt-1">Pilih produk skincare atau layanan treatment dari katalog di sebelah kiri.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.itemType === 'SERVICE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.itemType === 'SERVICE' ? 'Jasa' : 'Produk'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{item.kode}</span>
                    </div>
                    <h6 className="text-xs font-bold text-slate-800 mt-0.5">{item.nama}</h6>
                    <p className="text-[11px] text-slate-500">{formatRupiah(item.hargaSatuan)}</p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Service Staff Assigner */}
                {item.itemType === 'SERVICE' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-rose-50/50 p-1.5 rounded-md">
                    <span className="shrink-0 font-medium">Petugas:</span>
                    <input
                      type="text"
                      value={item.petugasDokter || ''}
                      onChange={(e) => updateItemStaff(item.id, e.target.value)}
                      placeholder="Nama Dokter/Beautician"
                      className="w-full bg-white border border-rose-200 rounded px-2 py-0.5 text-[11px] text-slate-800 focus:outline-rose-500"
                    />
                  </div>
                )}

                {/* Qty & Line Discount */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => updateItemQty(item.id, -1)}
                      className="px-2 py-1 hover:bg-slate-200 text-slate-600"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-800">{item.kuantitas}</span>
                    <button
                      onClick={() => updateItemQty(item.id, 1)}
                      className="px-2 py-1 hover:bg-slate-200 text-slate-600"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-[11px] text-slate-500">
                      <span>Disc:</span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={item.diskon || ''}
                        placeholder="0"
                        onChange={(e) => updateItemDiscount(item.id, Number(e.target.value))}
                        className="w-16 ml-1 text-right border border-slate-200 rounded px-1 py-0.5 text-[11px]"
                      />
                    </div>
                    <span className="font-bold text-xs text-slate-900 min-w-16 text-right">
                      {formatRupiah((item.hargaSatuan * item.kuantitas) - item.diskon)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Pay Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="space-y-1.5 text-xs">
            {subtotalProduk > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk Skincare:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(subtotalProduk)}</span>
              </div>
            )}
            {subtotalJasa > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Jasa / Treatment:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(subtotalJasa)}</span>
              </div>
            )}
            {totalDiskon > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Potongan Diskon:</span>
                <span>-{formatRupiah(totalDiskon)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Total Tagihan:</span>
              <span className="text-rose-600 text-lg">{formatRupiah(totalTagihan)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="rounded-xl border border-slate-300 p-2.5 text-slate-500 hover:bg-slate-200 disabled:opacity-40"
              title="Reset Keranjang"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 rounded-xl bg-rose-600 py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Checkout & Bayar ({formatRupiah(totalTagihan)})</span>
            </button>
          </div>
        </div>

      </div>
      </div>

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        branchId={currentBranch.id}
        onCustomerAdded={(newCust) => {
          handleSelectCustomer(newCust);
          onRefreshData();
        }}
      />

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        subtotalProduk={subtotalProduk}
        subtotalJasa={subtotalJasa}
        totalDiskon={totalDiskon}
        totalTagihan={totalTagihan}
        branch={currentBranch}
        onConfirmCheckout={handleConfirmCheckout}
        onShowPdfPreview={onShowPdfPreview}
      />

    </div>
  );
};
