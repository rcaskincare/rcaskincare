import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  Building2,
  RefreshCw
} from 'lucide-react';
import { BranchId } from '../types/index.ts';

interface AiAdvisorViewProps {
  currentBranchId: BranchId;
}

export const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({ currentBranchId }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [thinkingMode, setThinkingMode] = useState<string>('gemini-high-thinking');

  const presetQueries = [
    'Audit efisiensi omzet & perbandingan margin laba kotor 3 cabang (Spring Hill, Sudirman, Pangkalan Balai).',
    'Rekomendasi paket bundling treatment facial + skincare homecare untuk menaikkan average transaction value.',
    'Analisis HPP persediaan produk versus pendapatan jasa klinik dan mitigasi lonjakan beban operasional.',
    'Strategi pengelolaan stok produk di cabang satelit Pangkalan Balai agar tidak terjadi kekosongan persediaan.'
  ];

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          filter: {
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            periodMode: 'yearly',
            selectedMonth: 10,
            selectedYear: 2026,
            branchId: 'all'
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAnalysisResult(data.analysis);
        setThinkingMode(data.mode || 'gemini-high-thinking');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white shadow-md">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">AI Clinic Financial & Strategic Advisor</h1>
              <span className="text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                Gemini High Thinking
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Konsultan AI berbasis data akuntansi & rekam operasional nyata RCA Skincare 3 Cabang
            </p>
          </div>
        </div>
      </div>

      {/* Preset Topics */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span>Topik Analisis Cepat:</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {presetQueries.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(pq);
                handleAsk(pq);
              }}
              className="text-left text-xs bg-white border border-slate-200 hover:border-rose-400 p-3 rounded-xl shadow-2xs hover:shadow-xs transition text-slate-700 hover:text-slate-900 group"
            >
              <span className="font-semibold text-rose-600 group-hover:underline block mb-1">
                Analisis #{idx + 1}
              </span>
              <span className="line-clamp-2 leading-relaxed">{pq}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ketik pertanyaan strategi bisnis atau audit finansial (misal: 'Bagaimana tren margin laba di cabang Sudirman?')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs focus:border-rose-500 focus:outline-hidden"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-2xs"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menganalisis...' : 'Analisis AI'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Result Box */}
      {analysisResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Hasil Audit & Rekomendasi Finansial</h3>
            </div>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Mode: {thinkingMode}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-slate-800 text-xs leading-relaxed space-y-3 whitespace-pre-line">
            {analysisResult}
          </div>
        </div>
      )}

    </div>
  );
};
