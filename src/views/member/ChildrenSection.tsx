import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Baby, Calendar, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useClub } from '@/context/ClubContext';
import { useClubData } from '@/hooks/useClubData';
import type { Child } from '@/types';

export function ChildrenSection() {
  const { user } = useAuth();
  const { currentClub } = useClub();
  const { categories } = useClubData();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', birth_date: '', category_id: '' });

  useEffect(() => {
    if (!user || !currentClub) return;
    (async () => {
      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .eq('club_id', currentClub.id)
        .order('created_at', { ascending: false });
      setChildren((data as Child[]) ?? []);
      setLoading(false);
    })();
  }, [user, currentClub]);

  async function addChild() {
    if (!user || !currentClub || !form.first_name || !form.last_name) return;
    const { data } = await supabase
      .from('children')
      .insert({
        parent_id: user.id,
        club_id: currentClub.id,
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date || null,
        category_id: form.category_id || null,
      })
      .select()
      .single();
    if (data) setChildren([data as Child, ...children]);
    setForm({ first_name: '', last_name: '', birth_date: '', category_id: '' });
    setShowForm(false);
  }

  async function deleteChild(id: string) {
    await supabase.from('children').delete().eq('id', id);
    setChildren(children.filter(c => c.id !== id));
  }

  const ageLabel = (birthDate: string | null) => {
    if (!birthDate) return 'Âge non renseigné';
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  const categoryName = (catId: string | null) => categories.find(c => c.id === catId)?.name ?? null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Baby className="h-4 w-4 text-blue-900" />
          <h3 className="font-semibold text-gray-900">Mes enfants</h3>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-900 transition-colors hover:bg-blue-100"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 animate-scale-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Prénom</label>
              <input
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Nom</label>
              <input
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nom"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Date de naissance</label>
              <input
                type="date"
                value={form.birth_date}
                onChange={e => setForm({ ...form, birth_date: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Catégorie</label>
              <select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Aucune</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={addChild}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-900 py-2 text-xs font-medium text-white hover:bg-blue-800"
            >
              <Save className="h-3.5 w-3.5" /> Enregistrer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-900" />
        </div>
      ) : children.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Aucun enfant enregistré. Ajoutez votre enfant pour l'inscrire aux activités du club.</p>
      ) : (
        <div className="space-y-2">
          {children.map(child => {
            const initials = [child.first_name[0], child.last_name[0]].filter(Boolean).join('').toUpperCase();
            return (
              <div key={child.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-900 to-blue-700 text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{child.first_name} {child.last_name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {ageLabel(child.birth_date)}
                    </span>
                    {categoryName(child.category_id) && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {categoryName(child.category_id)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteChild(child.id)}
                  className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
