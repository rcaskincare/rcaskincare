import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Sparkles, 
  Package, 
  DollarSign, 
  BrainCircuit, 
  ShieldCheck,
  RefreshCw,
  Settings
} from 'lucide-react';
import { jsPDF } from 'jspdf';

import { Branch, BranchId, UserRole, Product, ServiceItem, Customer, ShiftRecord } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { PdfPreviewModal } from './components/PdfPreviewModal.tsx';
import { ShiftModal } from './components/ShiftModal.tsx';
import { TestRunnerModal } from './components/TestRunnerModal.tsx';

import { PosView } from './views/PosView.tsx';
import { CustomerCrmView } from './views/CustomerCrmView.tsx';
import { FinanceReportsView } from './views/FinanceReportsView.tsx';
import { ServicesMasterView } from './views/ServicesMasterView.tsx';
import { ProductsInventoryView } from './views/ProductsInventoryView.tsx';
import { ExpensesView } from './views/ExpensesView.tsx';
import { AiAdvisorView } from './views/AiAdvisorView.tsx';
import { AdminSettingsView } from './views/AdminSettingsView.tsx';

import { 
  getOfflineQueue, 
  removeQueuedTransaction, 
  saveCatalogCache, 
  getCatalogCache 
} from './lib/indexedDb.ts';

export default function App() {
  // Navigation State
  const [activeNav, setActiveNav] = useState<'pos' | 'crm' | 'reports' | 'services' | 'inventory' | 'expenses' | 'ai' | 'admin'>('pos');

  // Branch & Session State
  const [branches, setBranches] = useState<Branch[]>([
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
  ]);
  const [currentBranchId, setCurrentBranchId] = useState<BranchId>('spring-hill');
  // Default Role is Kasir (as requested)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('kasir');
  const [currentUserName, setCurrentUserName] = useState<string>('Siti Rahma (Kasir)');

  // Online / Offline & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Clinic Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Modals
  const [pdfModalDoc, setPdfModalDoc] = useState<jsPDF | null>(null);
  const [pdfModalFilename, setPdfModalFilename] = useState<string>('document.pdf');
  const [pdfModalTitle, setPdfModalTitle] = useState<string>('Pratinjau Dokumen');
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [showTestRunner, setShowTestRunner] = useState<boolean>(false);

  // Online / Offline Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll Offline Queue Count
  const refreshQueueCount = async () => {
    try {
      const q = await getOfflineQueue();
      setOfflineQueueCount(q.length);
    } catch {
      setOfflineQueueCount(0);
    }
  };

  useEffect(() => {
    refreshQueueCount();
    const interval = setInterval(refreshQueueCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync Offline Queue to Backend
  const syncOfflineQueue = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const queue = await getOfflineQueue();
      for (const item of queue) {
        try {
          const res = await fetch('/api/pos/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });
          if (res.ok) {
            await removeQueuedTransaction(item.id);
          }
        } catch (err) {
          console.error('Error syncing queued transaction:', err);
        }
      }
      await refreshQueueCount();
      loadClinicData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Load Clinic Data
  const loadClinicData = useCallback(async () => {
    try {
      const [bRes, pRes, sRes, cRes, shRes, eRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/products'),
        fetch('/api/services'),
        fetch('/api/customers'),
        fetch(`/api/finance/shifts?branchId=${currentBranchId}`),
        fetch('/api/finance/expenses')
      ]);

      if (bRes.ok) setBranches(await bRes.json());
      if (pRes.ok) {
        const prodData = await pRes.json();
        setProducts(prodData);
        saveCatalogCache('products', prodData);
      }
      if (sRes.ok) {
        const srvData = await sRes.json();
        setServices(srvData);
        saveCatalogCache('services', srvData);
      }
      if (cRes.ok) {
        const custData = await cRes.json();
        setCustomers(custData);
        saveCatalogCache('customers', custData);
      }
      if (shRes.ok) {
        const shiftsData: ShiftRecord[] = await shRes.json();
        const open = shiftsData.find(s => s.branchId === currentBranchId && s.status === 'open');
        setActiveShift(open || null);
      }
      if (eRes.ok) setExpenses(await eRes.json());
    } catch (err) {
      console.warn('Network offline or error loading fresh data, loading from local cache:', err);
      // Fallback cache from IndexedDB
      const cachedP = await getCatalogCache<Product[]>('products');
      if (cachedP) setProducts(cachedP);
      const cachedS = await getCatalogCache<ServiceItem[]>('services');
      if (cachedS) setServices(cachedS);
      const cachedC = await getCatalogCache<Customer[]>('customers');
      if (cachedC) setCustomers(cachedC);
    }
  }, [currentBranchId]);

  // Realtime Sync Engine via Server-Sent Events (SSE) & Heartbeat Polling
  useEffect(() => {
    loadClinicData();

    // SSE Realtime Listener: triggers instant refresh across all active browser tabs
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('[Realtime SSE] Data change detected, refreshing state:', payload);
          loadClinicData();
        } catch {
          loadClinicData();
        }
      };
      eventSource.onerror = () => {
        // Automatic reconnection handled by browser
      };
    } catch (err) {
      console.warn('Realtime SSE not available, relying on polling:', err);
    }

    // Polling fallback every 5s
    const pollInterval = setInterval(() => {
      loadClinicData();
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [loadClinicData]);

  // Handle Role Switch
  const handleSelectRole = async (role: UserRole) => {
    setCurrentUserRole(role);
    let name = currentUserName;
    if (role === 'owner') name = 'dr. Amanda SpKK (Owner & Kepala Medis)';
    else if (role === 'branch_manager') name = `Rian Pratama (Manager Cabang)`;
    else if (role === 'kasir') name = 'Siti Rahma (Kasir)';
    else if (role === 'dokter_beautician') name = 'dr. Fajar Aesthetic / Senior Beautician';
    setCurrentUserName(name);

    try {
      await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, name, branchId: currentBranchId })
      });
    } catch {}
  };

  // Handle Shift Management
  const handleStartShift = async (modalAwal: number) => {
    const res = await fetch('/api/finance/shifts/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branchId: currentBranchId,
        kasirName: currentUserName,
        modalAwal
      })
    });
    if (res.ok) {
      setActiveShift(await res.json());
      loadClinicData();
    }
  };

  const handleCloseShift = async (shiftId: string, totalKasAktual: number, catatan: string) => {
    const res = await fetch(`/api/finance/shifts/${shiftId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalKasAktual, catatan })
    });
    if (res.ok) {
      setActiveShift(null);
      loadClinicData();
    }
  };

  const handleShowPdfPreview = (doc: jsPDF, filename: string, title: string) => {
    setPdfModalDoc(doc);
    setPdfModalFilename(filename);
    setPdfModalTitle(title);
  };

  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800">
      
      {/* Top Application Header */}
      <Header
        branches={branches}
        currentBranchId={currentBranchId}
        onSelectBranch={(bId) => {
          setCurrentBranchId(bId);
          loadClinicData();
        }}
        currentUserRole={currentUserRole}
        onSelectRole={handleSelectRole}
        currentUserName={currentUserName}
        isOnline={isOnline}
        offlineQueueCount={offlineQueueCount}
        onSyncOfflineQueue={syncOfflineQueue}
        isSyncing={isSyncing}
        activeShift={activeShift}
        onOpenShiftModal={() => setShowShiftModal(true)}
        onOpenTestRunner={() => setShowTestRunner(true)}
      />

      {/* Module Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-[57px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto">
          <div className="flex space-x-1 py-1.5">
            <button
              onClick={() => setActiveNav('pos')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'pos'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>POS Kasir (Produk + Jasa)</span>
            </button>

            <button
              onClick={() => setActiveNav('crm')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'crm'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Database Customer / CRM</span>
            </button>

            <button
              onClick={() => setActiveNav('reports')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'reports'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Laporan Keuangan & Laba Rugi</span>
            </button>

            <button
              onClick={() => setActiveNav('services')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'services'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Master Jasa Klinik</span>
            </button>

            <button
              onClick={() => setActiveNav('inventory')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'inventory'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Produk & Stock Opname</span>
            </button>

            <button
              onClick={() => setActiveNav('expenses')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'expenses'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Buku Kas & Pengeluaran</span>
            </button>

            <button
              onClick={() => setActiveNav('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'ai'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BrainCircuit className="h-4 w-4 text-rose-600" />
              <span>AI Advisor (Thinking Mode)</span>
            </button>

            <button
              onClick={() => setActiveNav('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeNav === 'admin'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="h-4 w-4 text-slate-700" />
              <span>Pengaturan & Admin</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Module Content */}
      <main className="flex-1 overflow-x-hidden">
        {activeNav === 'pos' && (
          <PosView
            products={products}
            services={services}
            customers={customers}
            branches={branches}
            currentBranch={currentBranch}
            currentBranchId={currentBranchId}
            onSelectBranch={(bId) => {
              setCurrentBranchId(bId);
              loadClinicData();
            }}
            currentUserName={currentUserName}
            isOnline={isOnline}
            onRefreshData={loadClinicData}
            onShowPdfPreview={handleShowPdfPreview}
          />
        )}

        {activeNav === 'crm' && (
          <CustomerCrmView
            customers={customers}
            branches={branches}
            currentBranchId={currentBranchId}
            onRefreshData={loadClinicData}
          />
        )}

        {activeNav === 'reports' && (
          <FinanceReportsView
            branches={branches}
            currentBranchId={currentBranchId}
            currentUserName={currentUserName}
            onShowPdfPreview={handleShowPdfPreview}
          />
        )}

        {activeNav === 'services' && (
          <ServicesMasterView
            services={services}
            branches={branches}
            onRefreshData={loadClinicData}
          />
        )}

        {activeNav === 'inventory' && (
          <ProductsInventoryView
            products={products}
            branches={branches}
            currentBranchId={currentBranchId}
            onRefreshData={loadClinicData}
            onShowPdfPreview={handleShowPdfPreview}
          />
        )}

        {activeNav === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            branches={branches}
            currentBranchId={currentBranchId}
            currentUserName={currentUserName}
            onRefreshData={loadClinicData}
          />
        )}

        {activeNav === 'ai' && (
          <AiAdvisorView currentBranchId={currentBranchId} />
        )}

        {activeNav === 'admin' && (
          <AdminSettingsView
            branches={branches}
            currentBranchId={currentBranchId}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            onRefreshData={loadClinicData}
            onSwitchRole={handleSelectRole}
          />
        )}
      </main>

      {/* Global Modals */}
      <PdfPreviewModal
        isOpen={Boolean(pdfModalDoc)}
        onClose={() => setPdfModalDoc(null)}
        doc={pdfModalDoc}
        filename={pdfModalFilename}
        title={pdfModalTitle}
      />

      <ShiftModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        activeShift={activeShift}
        branchId={currentBranchId}
        kasirName={currentUserName}
        onStartShift={handleStartShift}
        onCloseShift={handleCloseShift}
      />

      <TestRunnerModal
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
      />

    </div>
  );
}
