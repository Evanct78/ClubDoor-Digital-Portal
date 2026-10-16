import { useState } from 'react';
import { DoorOpen, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Props = {
  onBack: () => void;
};

export function AuthPage({ onBack }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DoorOpen className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-white tracking-tight">ClubDoor</span>
            </div>
            <p className="text-blue-200 text-sm">
              {mode === 'signup' ? 'Créez votre compte' : 'Connectez-vous'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Créer un compte
            </button>
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mode === 'signin' ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Se connecter
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Adresse e-mail</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  placeholder="vous@exemple.fr"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mot de passe</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Chargement...' : (
                <>
                  {mode === 'signup' ? (
                    <><User className="w-5 h-5" /> Créer mon compte</>
                  ) : (
                    <>Se connecter <ArrowRight className="w-5 h-5" /></>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Back */}
          <div className="px-8 pb-6">
            <button
              onClick={onBack}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Retour au QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
