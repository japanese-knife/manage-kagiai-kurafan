import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, LogIn, UserPlus, FolderKanban } from 'lucide-react';
import Footer from './Footer';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 rounded-2xl mb-3 sm:mb-4">
            <FolderKanban className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-2">
            プロジェクト管理
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            {isLogin ? 'アカウントにログイン' : '新しいアカウントを作成'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/50 shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-neutral-500 mt-2">
                  6文字以上で入力してください
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 hover:shadow-soft-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>処理中...</span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  ログイン
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  新規登録
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {isLogin
                ? 'アカウントをお持ちでない方はこちら'
                : 'すでにアカウントをお持ちの方はこちら'}
            </button>
          </div>
        </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
