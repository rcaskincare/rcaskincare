import React from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { Branch, BranchId, UserRole, ShiftRecord } from '../types/index.ts';

interface HeaderProps {
  branches: Branch[];
  currentBranchId: BranchId;
  onSelectBranch: (branchId: BranchId) => void;
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentUserName: string;
  isOnline: boolean;
  offlineQueueCount: number;
  onSyncOfflineQueue: () => void;
  isSyncing: boolean;
  activeShift: ShiftRecord | null;
  onOpenShiftModal: () => void;
  onOpenTestRunner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  branches,
  currentBranchId,
  onSelectBranch,
  currentUserRole,
  onSelectRole,
  currentUserName,
  isOnline,
  offlineQueueCount,
  onSyncOfflineQueue,
  isSyncing,
  activeShift,
  onOpenShiftModal,
  onOpenTestRunner
}) => {
  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Brand & Clinic Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-sm font-bold text-lg">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">RCA SKINCARE</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Management System</span>
            </div>
            <p className="text-xs text-slate-500">
              Klinik Estetika & Skincare Center Palembang
            </p>
          </div>
        </div>

        {/* Center: Multi-Branch Network Status Badge (No global dropdown) */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600">
          <Building2 className="h-3.5 w-3.5 text-rose-600" />
          <span className="font-semibold text-slate-700">3 Cabang Aktif:</span>
          <span className="text-slate-500">Spring Hill &bull; Sudirman &bull; Pangkalan Balai</span>
        </div>

        {/* Right Action Island */}
        <div className="flex items-center gap-3">
          
          {/* Shift Status Indicator */}
          <button
            onClick={onOpenShiftModal}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition ${
              activeShift
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Kelola Shift Kasir"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Shift:</span>
            <span className="font-semibold">{activeShift ? 'Aktif' : 'Tutup'}</span>
          </button>

          {/* Online / Offline & Sync Badge */}
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg" title="Terhubung secara Realtime ke Server Pusat">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">Realtime</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg animate-pulse">
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline</span>
              </span>
            )}

            {offlineQueueCount > 0 && (
              <button
                onClick={onSyncOfflineQueue}
                disabled={isSyncing || !isOnline}
                className="inline-flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-2.5 py-1 rounded-lg shadow-2xs transition disabled:opacity-50"
                title="Sinkronisasi transaksi offline ke server"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{offlineQueueCount} Antrean</span>
              </button>
            )}
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="text-right hidden lg:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUserName}</p>
              <p className="text-[10px] text-slate-500 capitalize">{currentUserRole.replace('_', ' ')}</p>
            </div>

            <select
              value={currentUserRole}
              onChange={(e) => onSelectRole(e.target.value as UserRole)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus:outline-rose-500"
              title="Ganti Hak Akses Akun"
            >
              <option value="kasir">Role: Kasir (Default)</option>
              <option value="owner">Role: Owner</option>
              <option value="branch_manager">Role: Branch Manager</option>
              <option value="dokter_beautician">Role: Dokter / Beautician</option>
            </select>
          </div>

          {/* QA Test Runner Quick Button */}
          <button
            onClick={onOpenTestRunner}
            className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1.5 text-xs font-medium shadow-2xs transition"
            title="Jalankan Pengujian Otomatis Sistem"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Uji QA</span>
          </button>

        </div>
      </div>
    </header>
  );
};
