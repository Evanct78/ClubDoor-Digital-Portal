import { useState } from 'react';
import { Calendar, BarChart3, Tag, Link as LinkIcon, MessageCircle, Phone, Plus, Trash2, X, Save, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useClub } from '@/context/ClubContext';
import { useClubData } from '@/hooks/useClubData';

type Section = 'events' | 'polls' | 'announcements' | 'categories' | 'links' | 'whatsapp' | 'contacts';

export function AdminContent() {
  const [section, setSection] = useState<Section>('events');
  const { reload } = useClubData();

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="animate-fade-in-up">
        <h1 className="gradient-text text-2xl font-bold">Gestion du contenu</h1>
        <p className="mt-1 text-sm text-gray-500">Créez et organisez le contenu du club</p>
      </div>

      {/* Section selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <SectionPill active={section === 'events'} onClick={() => setSection('events')} icon={Calendar} label="Événements" />
        <SectionPill active={section === 'polls'} onClick={() => setSection('polls')} icon={BarChart3} label="Sondages" />
        <SectionPill active={section === 'announcements'} onClick={() => setSection('announcements')} icon={Megaphone} label="Infos" />
        <SectionPill active={section === 'categories'} onClick={() => setSection('categories')} icon={Tag} label="Catégories" />
        <SectionPill active={section === 'links'} onClick={() => setSection('links')} icon={LinkIcon} label="Liens" />
        <SectionPill active={section === 'whatsapp'} onClick={() => setSection('whatsapp')} icon={MessageCircle} label="WhatsApp" />
        <SectionPill active={section === 'contacts'} onClick={() => setSection('contacts')} icon={Phone} label="Contacts" />
      </div>

      <div className="animate-fade-in">
        {section === 'events' && <EventManager onReload={reload} />}
        {section === 'polls' && <PollManager onReload={reload} />}
        {section === 'announcements' && <AnnouncementManager onReload={reload} />}
        {section === 'categories' && <CategoryManager onReload={reload} />}
        {section === 'links' && <LinkManager onReload={reload} />}
        {section === 'whatsapp' && <WhatsAppManager onReload={reload} />}
        {section === 'contacts' && <ContactManager onReload={reload} />}
      </div>
    </div>
  );
}

function SectionPill({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Calendar; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`btn-ghost flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all ${
        active
          ? 'btn-primary text-white'
          : 'border border-slate-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function useClubId() {
  const { currentClub } = useClub();
  return currentClub!.id;
}

function useClubDataItems() {
  const { events, polls, announcements, categories, links, whatsappGroups, contacts, loading } = useClubData();
  return { events, polls, announcements, categories, links, whatsappGroups, contacts, loading };
}

// ============= EVENT MANAGER =============
function EventManager({ onReload }: { onReload: () => void }) {
  const clubId = useClubId();
  const { events, loading } = useClubDataItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', location: '' });

  async function createEvent() {
    if (!form.title || !form.event_date) return;
    await supabase.from('events').insert({
      club_id: clubId,
      title: form.title,
      description: form.description || null,
      event_date: new Date(form.event_date).toISOString(),
      location: form.location || null,
    });
    setForm({ title: '', description: '', event_date: '', location: '' });
    setShowForm(false);
    onReload();
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id);
    onReload();
  }

  return (
    <div className="space-y-3 stagger">
      {showForm ? (
        <CreateForm title="Nouvel événement" onClose={() => setShowForm(false)} onSave={createEvent}>
          <Input label="Titre" value={form.title} onChange={v => setForm({ ...form, title: v })} />
          <Input label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} />
          <Input label="Date et heure" type="datetime-local" value={form.event_date} onChange={v => setForm({ ...form, event_date: v })} />
          <Input label="Lieu" value={form.location} onChange={v => setForm({ ...form, location: v })} />
        </CreateForm>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm">
          <Plus className="h-4 w-4" /> Créer un événement
        </button>
      )}

      {loading ? <Loading /> : events.map(ev => (
        <div key={ev.id} className="card-hover flex items-start justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-900">{ev.title}</p>
            <p className="mt-1 text-xs text-gray-400">
              {new Date(ev.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
            {ev.location && <p className="text-xs text-gray-400">{ev.location}</p>}
          </div>
          <button onClick={() => deleteEvent(ev.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {!loading && events.length === 0 && <Empty text="Aucun événement" />}
    </div>
  );
}

// ============= POLL MANAGER =============
function PollManager({ onReload }: { onReload: () => void }) {
  const clubId = useClubId();
  const { polls, pollOptions, pollVotes, loading } = useClubData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: '', description: '', options: ['', ''] });

  async function createPoll() {
    if (!form.question || form.options.filter(o => o.trim()).length < 2) return;
    const { data: poll } = await supabase.from('polls').insert({
      club_id: clubId,
      question: form.question,
      description: form.description || null,
    }).select().single();

    const opts = form.options.filter(o => o.trim()).map((label, i) => ({ poll_id: poll.id, label, sort_order: i }));
    await supabase.from('poll_options').insert(opts);

    setForm({ question: '', description: '', options: ['', ''] });
    setShowForm(false);
    onReload();
  }

  async function deletePoll(id: string) {
    await supabase.from('polls').delete().eq('id', id);
    onReload();
  }

  return (
    <div className="space-y-3 stagger">
      {showForm ? (
        <CreateForm title="Nouveau sondage" onClose={() => setShowForm(false)} onSave={createPoll}>
          <Input label="Question" value={form.question} onChange={v => setForm({ ...form, question: v })} />
          <Input label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Options de réponse</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={e => setForm({ ...form, options: form.options.map((o, j) => j === i ? e.target.value : o) })}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder={`Option ${i + 1}`}
                  />
                  {form.options.length > 2 && (
                    <button onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, options: [...form.options, ''] })} className="flex items-center gap-1 text-sm font-medium text-blue-900 transition-colors hover:text-blue-700">
                <Plus className="h-4 w-4" /> Ajouter une option
              </button>
            </div>
          </div>
        </CreateForm>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm">
          <Plus className="h-4 w-4" /> Créer un sondage
        </button>
      )}

      {loading ? <Loading /> : polls.map(poll => {
        const opts = pollOptions.filter(o => o.poll_id === poll.id);
        const totalVotes = pollVotes.filter(v => opts.some(o => o.id === v.poll_option_id)).length;
        return (
          <div key={poll.id} className="card-hover rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="flex-1 text-sm font-medium text-gray-900">{poll.question}</p>
              <button onClick={() => deletePoll(poll.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {opts.map(opt => {
                const count = pollVotes.filter(v => v.poll_option_id === opt.id).length;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={opt.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{opt.label}</span>
                    <span className="text-gray-400">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
          </div>
        );
      })}
      {!loading && polls.length === 0 && <Empty text="Aucun sondage" />}
    </div>
  );
}

// ============= ANNOUNCEMENT MANAGER =============
function AnnouncementManager({ onReload }: { onReload: () => void }) {
  const clubId = useClubId();
  const { announcements, loading } = useClubDataItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  async function createAnnouncement() {
    if (!form.title) return;
    await supabase.from('announcements').insert({
      club_id: clubId,
      title: form.title,
      content: form.content || null,
    });
    setForm({ title: '', content: '' });
    setShowForm(false);
    onReload();
  }

  async function deleteAnnouncement(id: string) {
    await supabase.from('announcements').delete().eq('id', id);
    onReload();
  }

  return (
    <div className="space-y-3 stagger">
      {showForm ? (
        <CreateForm title="Nouvelle information" onClose={() => setShowForm(false)} onSave={createAnnouncement}>
          <Input label="Titre" value={form.title} onChange={v => setForm({ ...form, title: v })} />
          <Input label="Contenu" value={form.content} onChange={v => setForm({ ...form, content: v })} textarea />
        </CreateForm>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm">
          <Plus className="h-4 w-4" /> Publier une information
        </button>
      )}

      {loading ? <Loading /> : announcements.map(ann => (
        <div key={ann.id} className="card-hover flex items-start justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{ann.title}</p>
            {ann.content && <p className="mt-1 text-xs text-gray-500">{ann.content}</p>}
          </div>
          <button onClick={() => deleteAnnouncement(ann.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {!loading && announcements.length === 0 && <Empty text="Aucune information" />}
    </div>
  );
}

// ============= CATEGORY MANAGER =============
function CategoryManager({ onReload }: { onReload: () => void }) {
  const clubId = useClubId();
  const { categories, loading } = useClubDataItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6' });

  async function createCategory() {
    if (!form.name) return;
    await supabase.from('categories').insert({
      club_id: clubId,
      name: form.name,
      description: form.description || null,
      color: form.color,
    });
    setForm({ name: '', description: '', color: '#3b82f6' });
    setShowForm(false);
    onReload();
  }

  async function deleteCategory(id: string) {
    await supabase.from('categories').delete().eq('id', id);
    onReload();
  }

  return (
    <div className="space-y-3 stagger">
      {showForm ? (
        <CreateForm title="Nouvelle catégorie" onClose={() => setShowForm(false)} onSave={createCategory}>
          <Input label="Nom" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Input label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Couleur</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-10 w-full rounded-lg border border-gray-200" />
          </div>
        </CreateForm>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm">
          <Plus className="h-4 w-4" /> Créer une catégorie
        </button>
      )}

      {loading ? <Loading /> : categories.map(cat => (
        <div key={cat.id} className="card-hover flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg shadow-sm" style={{ backgroundColor: cat.color }} />
            <div>
              <p className="text-sm font-medium text-gray-900">{cat.name}</p>
              {cat.description && <p className="text-xs text-gray-400">{cat.description}</p>}
            </div>
          </div>
          <button onClick={() => deleteCategory(cat.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {!loading && categories.length === 0 && <Empty text="Aucune catégorie" />}
    </div>
  );
}

// ============= LINK MANAGER =============
function LinkManager({ onReload }: { onReload: () => void }) {
  const clubId = useClubId();
  const { links, loading } = useClubDataItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', icon: 'link' });

  async function createLink() {
    if (!form.title || !form.url) return;
    await supabase.from('links').insert({
      club_id: clubId,
      title: form.title,
      url: form.url,
      icon: form.icon,
    });
    setForm({ title: '', url: '', icon: 'link' });
    setShowForm(false);
    onReload();
  }

  async function deleteLink(id: string) {
    await supabase.from('links').delete().eq('id', id);
    onReload();
  }

  return (
    <div className="space-y-3 stagger">
      {showForm ? (
        <CreateForm title="Nouveau lien" onClose={() => setShowForm(false)} onSave={createLink}>
          <Input label="Titre" value={form.title} onChange={v => setForm({ ...form, title: v })} />
          <Input label="URL" value={form.url} onChange={v => setForm({ ...form, url: v })} />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Icône</label>
            <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
              <option value="link">Lien</option>
              <option value="globe">Globe</option>
              <option value="instagram">Instagram</option>
              <option value="trophy">Trophée</option>
              <option value="ticket">Billet</option>
            </select>
          </div>
        </CreateForm>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm">
          <Plus className="h-4 w-4" /> Ajouter un lien
        </button>
      )}

      {loading ? <Loading /> : links.map(link => (
        <div key={link.id} className="card-hover flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-900">{link.title}</p>
            <p className="max-w-xs truncate text-xs text-gray-400">{link.url}</p>
          </div>
          <button onClick={() => deleteLink(link.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {!loading && links.length === 0 && <Empty text="Aucun lien" />}
    </div>
  );
}

// ============= WHATSAPP MANAGER =============
function WhatsAppManager({ onReload }: { onReload: () => void }) {
  const clubId = useClubId();
  const { whatsappGroups, loading } = useClubDataItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '' });

  async function createGroup() {
    if (!form.name || !form.url) return;
    await supabase.from('whatsapp_groups').insert({
      club_id: clubId,
      name: form.name,
      url: form.url,
    });
    setForm({ name: '', url: '' });
    setShowForm(false);
    onReload();
  }

  async function deleteGroup(id: string) {
    await supabase.from('whatsapp_groups').delete().eq('id', id);
    onReload();
  }

  return (
    <div className="space-y-3 stagger">
      {showForm ? (
        <CreateForm title="Nouveau groupe WhatsApp" onClose={() => setShowForm(false)} onSave={createGroup}>
          <Input label="Nom du groupe" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Input label="Lien WhatsApp" value={form.url} onChange={v => setForm({ ...form, url: v })} />
        </CreateForm>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm">
          <Plus className="h-4 w-4" /> Ajouter un groupe
        </button>
      )}

      {loading ? <Loading /> : whatsappGroups.map(group => (
        <div key={group.id} className="card-hover flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-900">{group.name}</p>
          <button onClick={() => deleteGroup(group.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {!loading && whatsappGroups.length === 0 && <Empty text="Aucun groupe" />}
    </div>
  );
}

// ============= CONTACT MANAGER =============
function ContactManager({ onReload }: { onReload: () => void }) {
  const clubId = useClubId();
  const { contacts, loading } = useClubDataItems();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '' });

  async function createContact() {
    if (!form.name) return;
    await supabase.from('contacts').insert({
      club_id: clubId,
      name: form.name,
      role: form.role || null,
      phone: form.phone || null,
      email: form.email || null,
    });
    setForm({ name: '', role: '', phone: '', email: '' });
    setShowForm(false);
    onReload();
  }

  async function deleteContact(id: string) {
    await supabase.from('contacts').delete().eq('id', id);
    onReload();
  }

  return (
    <div className="space-y-3 stagger">
      {showForm ? (
        <CreateForm title="Nouveau contact" onClose={() => setShowForm(false)} onSave={createContact}>
          <Input label="Nom" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Input label="Rôle" value={form.role} onChange={v => setForm({ ...form, role: v })} />
          <Input label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
          <Input label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
        </CreateForm>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary flex w-full items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm">
          <Plus className="h-4 w-4" /> Ajouter un contact
        </button>
      )}

      {loading ? <Loading /> : contacts.map(contact => (
        <div key={contact.id} className="card-hover flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-900">{contact.name}</p>
            <p className="text-xs text-gray-400">{contact.role}</p>
          </div>
          <button onClick={() => deleteContact(contact.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {!loading && contacts.length === 0 && <Empty text="Aucun contact" />}
    </div>
  );
}

// ============= SHARED COMPONENTS =============
function CreateForm({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <div className="animate-scale-in space-y-3 rounded-2xl bg-white p-5 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
      <button onClick={onSave} className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium text-sm">
        <Save className="h-4 w-4" /> Enregistrer
      </button>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', textarea }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-900" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-gray-400">{text}</p>;
}
