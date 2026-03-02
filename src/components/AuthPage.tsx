import React, { useState } from 'react';
import { Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { t, type Lang } from '../lib/i18n';
import LangSwitch from './LangSwitch';

interface AuthPageProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

export default function AuthPage({ lang, onLangChange }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(t('auth.signUpSuccess', lang));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col text-gray-200 font-sans">
      {/* Top bar with lang switch */}
      <div className="flex justify-end p-4">
        <LangSwitch lang={lang} onChange={onLangChange} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#84cc16]/10 mb-5">
              <ImageIcon className="w-8 h-8 text-[#84cc16]" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">{t('auth.title', lang)}</h1>
            <p className="text-gray-500 text-sm">{t('auth.subtitle', lang)}</p>
          </div>

          {/* Form card */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8">
            <h2 className="text-lg font-medium text-white mb-6">
              {isLogin ? t('auth.signIn', lang) : t('auth.signUp', lang)}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">{t('auth.email', lang)}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#84cc16]/50 transition-colors"
                  placeholder={t('auth.emailPlaceholder', lang)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">{t('auth.password', lang)}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#84cc16]/50 transition-colors"
                  placeholder={t('auth.passwordPlaceholder', lang)}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {message && <p className="text-green-400 text-sm">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#84cc16] hover:bg-[#65a30d] disabled:opacity-50 text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? t('auth.signIn', lang) : t('auth.signUp', lang)}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {isLogin ? t('auth.noAccount', lang) : t('auth.hasAccount', lang)}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
                className="text-[#84cc16] hover:underline"
              >
                {isLogin ? t('auth.signUp', lang) : t('auth.signIn', lang)}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
