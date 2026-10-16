import { useState } from 'react';
import { DoorOpen, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError('Session expirée. Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('club_members')
      .insert({
        club_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        user_id: user.id,
        role: 'member',
        status: 'active',
      });

    if (memberError) {
      if (memberError.code === '23505') {
        // Already a member — that's fine
      } else {
        setError(memberError.message);
        setLoading(false);
        return;
      }
    }

    await refreshProfile();
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DoorOpen className="w-7 h-7 text-green-400" />
              <span className="text-2xl font-bold text-white tracking-tight">ClubDoor</span>
            </div>
            <p className="text-blue-200 text-sm">Bienvenue ! Complétez votre inscription</p>
          </div>

          <div className="px-8 py-6">
            <div className="flex items-center gap-2 mb-6 bg-green-50 p-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">Compte créé avec succès !</span>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Rejoignez le <strong>Tennis Club Olympique</strong> en complétant vos informations.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Prénom</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nom</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  placeholder="06 12 34 56 78"
                />
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
                {loading ? 'Inscription...' : (
                  <>Rejoindre le club <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Vous pourrez compléter votre profil plus tard dans votre espace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
