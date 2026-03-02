import { useState, useEffect } from 'react';
import { X, Trash2, Loader2, Clock, Image as ImageIcon } from 'lucide-react';
import { fetchHistory, deleteHistory } from '../lib/api';
import { t, type Lang } from '../lib/i18n';

interface HistoryRecord {
  id: string;
  image_urls: string[];
  prompt: string;
  options: Record<string, any>;
  created_at: string;
}

interface HistoryPanelProps {
  lang: Lang;
  onClose: () => void;
  onSelect: (images: string[]) => void;
}

export default function HistoryPanel({ lang, onClose, onSelect }: HistoryPanelProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchHistory();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('history.deleteConfirm', lang))) return;
    try {
      setDeletingId(id);
      await deleteHistory(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col relative">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" /> {t('history.title', lang)}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t('history.empty', lang)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {records.map((record) => (
                <div key={record.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                  <div className="flex gap-4">
                    <div className="flex gap-2 flex-shrink-0">
                      {record.image_urls.slice(0, 3).map((url, i) => (
                        <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-white/5 cursor-pointer hover:border-[#84cc16]/50 transition-colors" onClick={() => onSelect(record.image_urls)} />
                      ))}
                      {record.image_urls.length > 3 && (
                        <div className="w-20 h-20 rounded-lg border border-white/5 flex items-center justify-center text-gray-500 text-sm">+{record.image_urls.length - 3}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">{record.prompt}</p>
                      <p className="text-xs text-gray-600">{new Date(record.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDelete(record.id)} disabled={deletingId === record.id} className="self-start p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors flex-shrink-0">
                      {deletingId === record.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
