import { useState } from 'react';
import { User, Phone, MapPin, Calendar, Heart, HelpCircle, LogOut, Edit2, Save, X, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useClub } from '@/context/ClubContext';
import { ChildrenSection } from './ChildrenSection';

export function MemberAccount() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { currentClub } = useClub();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [form, setForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    phone: profile?.phone ?? '',
    birth_date: profile?.birth_date ?? '',
    address: profile?.address ?? '',
    city: profile?.city ?? '',
    bio: profile?.bio ?? '',
    emergency_contact_name: profile?.emergency_contact_name ?? '',
    emergency_contact_phone: profile?.emergency_contact_phone ?? '',
  });

  async function handleSave() {
    setSaving(true);
    await supabase.from('profiles').update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      birth_date: form.birth_date || null,
      address: form.address,
      city: form.city,
      bio: form.bio,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      updated_at: new Date().toISOString(),
    }).eq('id', user!.id);
    await refreshProfile();
    setSaving(false);
    setEditing(false);
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Mon profil';
  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-900 text-white flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg">{fullName}</h2>
            <p className="text-sm text-gray-500">{profile?.email ?? user?.email}</p>
            <span className="inline-block mt-1 text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full">
              Membre — {currentClub?.name}
            </span>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        /* Edit form */
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Modifier mes informations</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom" value={form.first_name} onChange={v => setForm({ ...form, first_name: v })} />
            <Field label="Nom" value={form.last_name} onChange={v => setForm({ ...form, last_name: v })} />
          </div>
          <Field label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
          <Field label="Date de naissance" type="date" value={form.birth_date} onChange={v => setForm({ ...form, birth_date: v })} />
          <Field label="Adresse" value={form.address} onChange={v => setForm({ ...form, address: v })} />
          <Field label="Ville" value={form.city} onChange={v => setForm({ ...form, city: v })} />
          <Field label="À propos de moi" value={form.bio} onChange={v => setForm({ ...form, bio: v })} textarea />
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact d'urgence</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom" value={form.emergency_contact_name} onChange={v => setForm({ ...form, emergency_contact_name: v })} />
              <Field label="Téléphone" value={form.emergency_contact_phone} onChange={v => setForm({ ...form, emergency_contact_phone: v })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Profile info display */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Informations personnelles</h3>
            <div className="space-y-3">
              <InfoRow icon={Phone} label="Téléphone" value={profile?.phone ?? undefined} />
              <InfoRow icon={Calendar} label="Date de naissance" value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('fr-FR') : undefined} />
              <InfoRow icon={MapPin} label="Adresse" value={[profile?.address, profile?.city].filter(Boolean).join(', ') || undefined} />
              <InfoRow icon={Heart} label="Contact d'urgence" value={profile?.emergency_contact_name ? `${profile.emergency_contact_name} (${profile.emergency_contact_phone})` : undefined} />
              <InfoRow icon={User} label="Bio" value={profile?.bio ?? undefined} />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            <SettingsRow icon={HelpCircle} label="Centre d'aide" onClick={() => setShowHelp(true)} />
          </div>

          {/* Children */}
          {!editing && <ChildrenSection />}

          {/* Sign out */}
          <div className="bg-white rounded-2xl shadow-sm">
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center gap-3 p-4 text-red-600 hover:bg-red-50 transition-colors rounded-2xl"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Se déconnecter</span>
            </button>
          </div>
        </>
      )}

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Centre d'aide</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Comment rejoindre un groupe WhatsApp ?</p>
                <p className="mt-1">Allez dans « Mon club » puis touchez un groupe WhatsApp pour le rejoindre.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Comment modifier mon profil ?</p>
                <p className="mt-1">Touchez l'icône crayon en haut de cette page pour modifier vos informations.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Comment répondre à un événement ?</p>
                <p className="mt-1">Allez dans « Actualités » et choisissez votre participation pour chaque événement.</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-4 py-2.5 rounded-xl bg-blue-900 text-white font-medium text-sm">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Sign out confirm */}
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
              <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => { signOut(); setShowSignOutConfirm(false); }} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', textarea }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900"
        />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">{value || 'Non renseigné'}</p>
      </div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, onClick }: { icon: typeof User; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
      <Icon className="w-5 h-5 text-gray-400" />
      <span className="flex-1 text-left text-sm font-medium text-gray-900">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </button>
  );
}
