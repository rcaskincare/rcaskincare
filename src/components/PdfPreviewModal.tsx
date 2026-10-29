import React from 'react';
import { jsPDF } from 'jspdf';
import { X, Download, Printer } from 'lucide-react';
import { getPdfBlobUrl, triggerPdfDownload } from '../lib/pdfGenerator.ts';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: jsPDF | null;
  filename: string;
  title: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  doc,
  filename,
  title
}) => {
  if (!isOpen || !doc) return null;

  const blobUrl = getPdfBlobUrl(doc);

  const handlePrint = () => {
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleDownload = () => {
    triggerPdfDownload(doc, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{filename}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-rose-700 transition"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Embedded Frame */}
        <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
          <iframe
            src={blobUrl}
            className="h-full w-full rounded-md border border-slate-300 bg-white shadow-inner"
            title={title}
          />
        </div>
      </div>
    </div>
  );
};
