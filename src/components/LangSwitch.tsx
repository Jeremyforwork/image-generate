import type { Lang } from '../lib/i18n';

export default function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <button
      onClick={() => onChange(lang === 'en' ? 'zh' : 'en')}
      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors border border-white/10"
    >
      {lang === 'en' ? '中文' : 'EN'}
    </button>
  );
}
