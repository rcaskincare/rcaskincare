import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Database, 
  Settings, 
  ShieldCheck, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Edit3, 
  Phone, 
  MapPin, 
  Mail, 
  UserCheck, 
  Clock, 
  FileJson, 
  Check, 
  X,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Branch, BranchId, UserRole, SystemSettings, BackupSnapshot } from '../types/index.ts';

interface AdminSettingsViewProps {
  branches: Branch[];
  currentBranchId: BranchId;
  currentUserRole: UserRole;
  currentUserName: string;
  onRefreshData: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  branches,
  currentBranchId,
  currentUserRole,
  currentUserName,
  onRefreshData,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<'branches' | 'backup-restore' | 'general' | 'audit'>('branches');
  
  // Branch Management State
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchFormData, setBranchFormData] = useState<Partial<Branch>>({});
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  const [branchSaveMessage, setBranchSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    clinicName: 'RCA Skincare Clinic & Aesthetic Center',
    tagline: 'Klinik Estetika & Skincare Center Terpadu Palembang',
    defaultTaxPercentage: 0,
    operatingHours: 'Senin - Minggu: 08:00 - 20:00 WIB',
    currencySymbol: 'Rp',
    receiptFooter: 'Terima kasih atas kepercayaan Anda merawat kulit di RCA Skincare. Produk yang sudah dibeli tidak dapat ditukar kecuali cacat segel saat diterima.',
    phonePusat: '(0711) 567890 / 0812-7890-1111',
    emailPusat: 'care@rcaskincare.co.id',
    website: 'https://rcaskincare.co.id',
    updatedAt: '',
    updatedBy: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMessage, setSettingsSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup & Restore State
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreParsedData, setRestoreParsedData] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<{ success: boolean; stats: any } | null>(null);
  const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Load Settings & Audit on mount / tab change
  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadSettings();
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  // Branch Editor Handlers
  const handleStartEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      headerNote: branch.headerNote,
      managerName: branch.managerName || '',
      email: branch.email || '',
      isActive: branch.isActive !== false
    });
    setBranchSaveMessage(null);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    setIsSavingBranch(true);
    setBranchSaveMessage(null);

    try {
      const res = await fetch(`/api/branches/${editingBranch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchFormData)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data cabang');

      setBranchSaveMessage({ type: 'success', text: `Data cabang "${editingBranch.name}" berhasil diperbarui & disimpan!` });
      setEditingBranch(null);
      onRefreshData();
    } catch (err: any) {
      setBranchSaveMessage({ type: 'error', text: err.message || 'Terjadi kesalahan saat menyimpan cabang' });
    } finally {
      setIsSavingBranch(false);
    }
  };

  // System Settings Handlers
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pengaturan');

      setSettingsSaveMessage({ type: 'success', text: 'Pengaturan sistem dan profil klinik berhasil diperbarui!' });
      onRefreshData();
    } catch (err: any) {
      setSettingsSaveMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan sistem' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Backup Handler
  const handleDownloadBackup = async () => {
    setIsGeneratingBackup(true);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) throw new Error('Gagal mengunduh file cadangan database');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `rca_skincare_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Gagal mengunduh backup: ${err.message}`);
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  // Restore Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);
    setRestoreParsedData(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const dataObj = parsed.data || parsed;
        if (!dataObj.products || !dataObj.services || !dataObj.customers) {
          throw new Error('File tidak memiliki tabel inti yang valid (products, services, customers).');
        }

        setRestoreParsedData(parsed);
      } catch (err: any) {
        setRestoreError(`File JSON tidak valid: ${err.message}`);
        setRestoreParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreParsedData) return;

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreParsedData)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memulihkan database');

      setRestoreSuccess(json);
      setShowConfirmRestoreModal(false);
      setRestoreFile(null);
      setRestoreParsedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh global app data instantly
      onRefreshData();
    } catch (err: any) {
      setRestoreError(err.message || 'Terjadi kesalahan saat memulihkan database');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-rose-500/20 text-rose-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-rose-500/30">
              Admin & System Control
            </span>
            <span className="text-slate-400 text-xs">&bull; Multi-Cabang Palembang</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Pengaturan Sistem & Administrasi Klinik
          </h1>
          <p className="text-slate-300 text-xs mt-1">
            Kelola identitas cabang, kontak operasional, parameter klinik, backup terenkripsi, dan pemulihan database real-time.
          </p>
        </div>

        {/* Current Active User Role Badge */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
          <div className="text-right">
            <p className="text-xs font-bold text-white leading-tight">{currentUserName}</p>
            <p className="text-[10px] text-rose-300 uppercase tracking-wider font-semibold">
              Role Aktif: {currentUserRole.replace('_', ' ')}
            </p>
          </div>
          {currentUserRole !== 'owner' && (
            <button
              onClick={() => onSwitchRole('owner')}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium px-2.5 py-1.5 rounded-lg shadow-xs transition whitespace-nowrap"
              title="Alihkan role ke Owner untuk hak akses admin tertinggi"
            >
              Mode Owner
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'branches'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-rose-600 text-rose-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Manajemen Cabang & Kontak ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup-restore')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'backup-restore'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-rose-600 text-rose-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Backup & Restore Database</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-rose-600 text-rose-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Pengaturan Umum Klinik</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-white border-t-2 border-x border-slate-200 border-t-rose-600 text-rose-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Audit Trail & Aktivitas Sistem</span>
        </button>
      </div>

      {/* Global Success / Error Messages */}
      {branchSaveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
          branchSaveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {branchSaveMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
          <span>{branchSaveMessage.text}</span>
        </div>
      )}

      {/* TAB 1: MANAJEMEN CABANG */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-rose-600" />
                  Daftar Cabang & Kontak Resmi RCA Skincare
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap perubahan nama, alamat, nomor telepon/WhatsApp, dan penanggung jawab cabang akan tersimpan permanen dan otomatis sinkron ke cetak struk kasir dan faktur.
                </p>
              </div>
              <button
                onClick={onRefreshData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branches.map((branch) => {
                const isSelected = branch.id === currentBranchId;
                return (
                  <div
                    key={branch.id}
                    className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                      isSelected ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-xs">
                            {branch.code}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                              ID: {branch.id}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{branch.name}</h3>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          branch.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {branch.isActive !== false ? 'Buka' : 'Tutup'}
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-600 my-4 border-t border-slate-100 pt-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{branch.address}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">{branch.phone}</span>
                        </div>

                        {branch.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-600">{branch.email}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700">PIC / Kepala: <strong className="font-semibold text-slate-900">{branch.managerName || 'dr. Nadira (Owner)'}</strong></span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-500 italic">
                          "{branch.headerNote}"
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {isSelected ? '★ Cabang Terpilih Saat Ini' : ''}
                      </span>
                      <button
                        onClick={() => handleStartEditBranch(branch)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit Data Cabang</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal / Inline Editor for Branch */}
          {editingBranch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                      <Edit3 className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Edit Data Cabang: {editingBranch.name}
                      </h3>
                      <p className="text-xs text-slate-500">ID Cabang: {editingBranch.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingBranch(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Cabang *</label>
                    <input
                      type="text"
                      required
                      value={branchFormData.name || ''}
                      onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kode Cabang (2-4 Huruf) *</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={branchFormData.code || ''}
                        onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Status Operasional</label>
                      <select
                        value={branchFormData.isActive !== false ? 'active' : 'inactive'}
                        onChange={(e) => setBranchFormData({ ...branchFormData, isActive: e.target.value === 'active' })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden bg-white"
                      >
                        <option value="active">Buka / Aktif Melayani</option>
                        <option value="inactive">Tutup Sementara</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Cabang *</label>
                    <textarea
                      required
                      rows={2}
                      value={branchFormData.address || ''}
                      onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={branchFormData.phone || ''}
                        onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email Cabang (Opsional)</label>
                      <input
                        type="email"
                        value={branchFormData.email || ''}
                        onChange={(e) => setBranchFormData({ ...branchFormData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab / Kepala Cabang</label>
                    <input
                      type="text"
                      value={branchFormData.managerName || ''}
                      onChange={(e) => setBranchFormData({ ...branchFormData, managerName: e.target.value })}
                      placeholder="Contoh: dr. Nadira SpKK atau Rian Pratama, S.Farm"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Catatan Tagline Header Nota</label>
                    <input
                      type="text"
                      value={branchFormData.headerNote || ''}
                      onChange={(e) => setBranchFormData({ ...branchFormData, headerNote: e.target.value })}
                      placeholder="Contoh: Klinik Utama & Laser Aesthetic Center"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingBranch(null)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingBranch}
                      className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      {isSavingBranch ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Simpan Perubahan Cabang</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BACKUP & RESTORE DATABASE */}
      {activeTab === 'backup-restore' && (
        <div className="space-y-6">
          
          {/* Backup Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="h-5 w-5 text-rose-600" />
                  Cadangkan Database (Backup Full Snapshot)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unduh seluruh snapshot basis data RCA Skincare (3 cabang, produk, transaksi, CRM customer, jurnal pengeluaran, akun kas, dan audit log) dalam satu file JSON terenkripsi terstruktur.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                disabled={isGeneratingBackup}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {isGeneratingBackup ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>Unduh Backup Database (.json)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Jaringan Cabang</span>
                <span className="text-base font-black text-slate-900">{branches.length} Cabang</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Pusat, SDR, PKB</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Keamanan Data</span>
                <span className="text-base font-black text-slate-900">100% Persisten</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">JSON Disk Storage</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Format Berkas</span>
                <span className="text-base font-black text-slate-900">Snapshot JSON</span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Skema Versi 2.5</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Frekuensi Disarankan</span>
                <span className="text-base font-black text-slate-900">Setiap Tutup Shift</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Atau Mingguan</span>
              </div>
            </div>
          </div>

          {/* Restore Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-amber-600" />
                Pulihkan Database (Restore Database Snapshot)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah file cadangan JSON yang sebelumnya diunduh untuk memulihkan seluruh data klinik. Sistem secara otomatis membuat salinan darurat sebelum proses pemulihan dieksekusi.
              </p>
            </div>

            {/* Restore Notification Feedback */}
            {restoreSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 text-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950">Database Berhasil Dipulihkan!</h4>
                  <p className="mt-0.5 text-emerald-800">
                    Seluruh tabel telah diperbarui secara instan. Hasil: {restoreSuccess.stats.products} produk, {restoreSuccess.stats.customers} customer, {restoreSuccess.stats.transactions} transaksi, {restoreSuccess.stats.branches} cabang.
                  </p>
                </div>
              </div>
            )}

            {restoreError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-950">Gagal Memulihkan File:</h4>
                  <p className="mt-0.5 text-red-800">{restoreError}</p>
                </div>
              </div>
            )}

            {/* File Picker Zone */}
            <div className="mt-4 border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50/50 rounded-2xl p-6 text-center transition">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="restore-file-input"
              />
              <label htmlFor="restore-file-input" className="cursor-pointer flex flex-col items-center">
                <FileJson className="h-10 w-10 text-rose-500 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  {restoreFile ? restoreFile.name : 'Pilih atau Tarik File Cadangan (.json) ke Sini'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Ukuran berkas standar &lt; 50 MB &bull; Memuat skema cabang, produk, transaksi, dan customer
                </span>
              </label>
            </div>

            {/* Parsed Snapshot Preview */}
            {restoreParsedData && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-200/60 text-amber-800 rounded-lg">
                      <FileJson className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {restoreParsedData.appName || 'Snapshot RCA Skincare'} (Versi {restoreParsedData.backupVersion || '2.0'})
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Dibuat pada: {restoreParsedData.timestamp || 'Tidak tercatat'} &bull; Oleh: {restoreParsedData.exportedBy || 'Admin'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfirmRestoreModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <span>Verifikasi & Pulihkan Sekarang</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-slate-700 border-t border-amber-200/60 pt-3">
                  <div>Produk: <strong>{restoreParsedData.data?.products?.length || restoreParsedData.products?.length || 0} item</strong></div>
                  <div>Jasa Medis: <strong>{restoreParsedData.data?.services?.length || restoreParsedData.services?.length || 0} jasa</strong></div>
                  <div>Customer: <strong>{restoreParsedData.data?.customers?.length || restoreParsedData.customers?.length || 0} orang</strong></div>
                  <div>Transaksi: <strong>{restoreParsedData.data?.transactions?.length || restoreParsedData.transactions?.length || 0} nota</strong></div>
                  <div>Cabang: <strong>{restoreParsedData.data?.branches?.length || restoreParsedData.branches?.length || 3} cabang</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Konfirmasi Keamanan Restore */}
          {showConfirmRestoreModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
                <div className="flex items-center gap-3 text-red-600 mb-3">
                  <div className="p-2.5 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Konfirmasi Pemulihan Database</h3>
                    <p className="text-xs text-slate-500">Tindakan ini memerlukan kehati-hatian</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Apakah Anda yakin ingin menimpa database dengan file cadangan ini? Seluruh transaksi, stok, dan data pelanggan akan dipulihkan sesuai tanggal snapshot cadangan.
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 mb-5">
                  <div>&bull; Salinan keamanan otomatis dibuat di direktori pemulihan server.</div>
                  <div>&bull; Seluruh browser kasir yang aktif akan tersinkronisasi otomatis dalam hitungan detik.</div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmRestoreModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={handleExecuteRestore}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {isRestoring ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Ya, Pulihkan Database Sekarang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: PENGATURAN UMUM KLINIK */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-rose-600" />
              Profil & Kebijakan Operasional Klinik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan nama brand, tagline, jam operasional, tarif pajak standar kasir, dan teks penutup struk pembayaran.
            </p>
          </div>

          {settingsSaveMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
              settingsSaveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{settingsSaveMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Klinik / Brand *</label>
                <input
                  type="text"
                  required
                  value={systemSettings.clinicName}
                  onChange={(e) => setSystemSettings({ ...systemSettings, clinicName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline Klinik *</label>
                <input
                  type="text"
                  required
                  value={systemSettings.tagline}
                  onChange={(e) => setSystemSettings({ ...systemSettings, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jam Operasional Standar</label>
                <input
                  type="text"
                  value={systemSettings.operatingHours}
                  onChange={(e) => setSystemSettings({ ...systemSettings, operatingHours: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Pajak / PPN POS (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={systemSettings.defaultTaxPercentage}
                  onChange={(e) => setSystemSettings({ ...systemSettings, defaultTaxPercentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Simbol Mata Uang</label>
                <input
                  type="text"
                  value={systemSettings.currencySymbol}
                  onChange={(e) => setSystemSettings({ ...systemSettings, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hotline / Telepon Pusat</label>
                <input
                  type="text"
                  value={systemSettings.phonePusat}
                  onChange={(e) => setSystemSettings({ ...systemSettings, phonePusat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Layanan Pelanggan</label>
                <input
                  type="email"
                  value={systemSettings.emailPusat}
                  onChange={(e) => setSystemSettings({ ...systemSettings, emailPusat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website Resmi</label>
                <input
                  type="text"
                  value={systemSettings.website}
                  onChange={(e) => setSystemSettings({ ...systemSettings, website: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pesan Footer Struk Kasir / Nota *</label>
              <textarea
                rows={3}
                required
                value={systemSettings.receiptFooter}
                onChange={(e) => setSystemSettings({ ...systemSettings, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Teks ini akan dicetak otomatis di bagian bawah struk thermal (58mm, 80mm) dan invoice A4.
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Terakhir diubah: {systemSettings.updatedAt ? new Date(systemSettings.updatedAt).toLocaleString('id-ID') : 'Default'} oleh {systemSettings.updatedBy || 'System'}
              </span>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {isSavingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Simpan Pengaturan Klinik</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-rose-600" />
                Catatan Log Audit & Integritas Operasional
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat kronologis seluruh tindakan sensitif: perubahan nama/kontak cabang, backup, pemulihan database, reversal biaya, dan merge customer.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              disabled={isLoadingAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Waktu (WIB)</th>
                  <th className="py-2.5 px-3 font-bold">Pengguna / Kasir / Admin</th>
                  <th className="py-2.5 px-3 font-bold">Aksi Sistem</th>
                  <th className="py-2.5 px-3 font-bold">Detail Entitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada catatan log audit yang terekam.
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 50).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {log.user}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px] font-medium border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-md truncate">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
