import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useClub } from '@/context/ClubContext';
import { MemberApp } from '@/views/member/MemberApp';
import { AdminApp } from '@/views/admin/AdminApp';
import { SuperAdmin } from '@/views/admin/SuperAdmin';
import { Onboarding } from '@/components/Onboarding';

export function AppShell() {
  const { user, memberships, isSuperAdmin, signOut } = useAuth();
  const { currentClub, isAdmin } = useClub();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  if (!user) return null;

  // No memberships yet → onboarding (unless super-admin)
  if (memberships.length === 0 && !isSuperAdmin) {
    return <Onboarding />;
  }

  if (memberships.length === 0 && isSuperAdmin) {
    return <SuperAdmin />;
  }

  if (!currentClub) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center">
        <p className="text-blue-200">Chargement du club...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isSuperAdmin ? <SuperAdmin /> : isAdmin ? <AdminApp /> : <MemberApp />}

      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSignOutConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Se déconnecter ?</h3>
                <p className="text-sm text-gray-500">Vous devrez vous reconnecter pour accéder au club.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => { signOut(); setShowSignOutConfirm(false); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
