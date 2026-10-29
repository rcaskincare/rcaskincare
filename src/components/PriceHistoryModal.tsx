import React from 'react';
import { X, History, TrendingUp, TrendingDown } from 'lucide-react';
import { ServiceItem } from '../types/index.ts';
import { formatRupiah, formatDateId } from '../lib/formatters.ts';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem | null;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  service
}) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-rose-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Riwayat Penyesuaian Tarif Layanan</h3>
              <p className="text-xs text-slate-500">{service.kodeJasa} · {service.namaJasa}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 p-4">
            <div>
              <p className="text-xs font-semibold text-rose-800">Harga Dasar Berlaku Saat Ini</p>
              <p className="text-lg font-bold text-rose-950 mt-0.5">{formatRupiah(service.hargaDasar)}</p>
            </div>
            <span className="text-xs bg-rose-200/80 text-rose-900 font-semibold px-2.5 py-1 rounded-lg">
              Versi Data: v{service.version}
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Histori Perubahan Audit</h4>
            
            {service.riwayatHarga.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">
                Belum ada catatan perubahan harga sejak pendaftaran awal.
              </p>
            ) : (
              service.riwayatHarga.map((item, idx) => {
                const isIncrease = item.newPrice > item.oldPrice;
                return (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isIncrease ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-600" />
                        )}
                        <span className="font-semibold text-slate-800">
                          {formatRupiah(item.oldPrice)} → {formatRupiah(item.newPrice)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{formatDateId(item.date)}</span>
                    </div>
                    <p className="text-slate-600">
                      <strong className="text-slate-700">Alasan:</strong> {item.reason}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Diubah oleh: <span className="font-medium text-slate-600">{item.changedBy}</span>
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
