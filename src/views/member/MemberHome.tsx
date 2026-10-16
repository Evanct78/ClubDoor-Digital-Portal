import { Globe, Instagram, Trophy, Ticket, Link as LinkIcon, MessageCircle, Phone, Mail, MapPin, FileText, Users, Info, ExternalLink } from 'lucide-react';
import { useClub } from '@/context/ClubContext';
import { useClubData } from '@/hooks/useClubData';
import { useAuth } from '@/context/AuthContext';

const iconMap: Record<string, typeof Globe> = {
  globe: Globe,
  instagram: Instagram,
  trophy: Trophy,
  ticket: Ticket,
  link: LinkIcon,
};

export function MemberHome() {
  const { currentClub } = useClub();
  const { profile } = useAuth();
  const { categories, links, whatsappGroups, contacts, loading } = useClubData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-900" />
      </div>
    );
  }

  const incompleteProfile = !profile?.first_name || !profile?.last_name || !profile?.phone;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 stagger">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-6 text-white shadow-xl shadow-blue-950/20">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-green-400/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 translate-y-6 -translate-x-6 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour {profile?.first_name ?? ''} !
          </h1>
          <p className="mt-1 text-sm text-blue-200">Voici tout ce qui vous concerne au {currentClub?.name}</p>
        </div>
      </div>

      {/* Profile completion warning */}
      {incompleteProfile && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 animate-fade-in-up">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Profil incomplet</p>
            <p className="mt-1 text-xs text-amber-700">
              Pensez à compléter vos informations personnelles dans « Mon compte » pour que le club puisse mieux vous accompagner.
            </p>
          </div>
        </div>
      )}

      <Section title="Inscription" icon={FileText}>
        <div className="card-hover rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Votre formulaire d'inscription au club. Pensez à compléter votre profil avec toutes les informations demandées.
          </p>
          <a
            href={links.find(l => l.title === 'Site du club')?.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-900 transition-colors hover:text-blue-700 hover:underline"
          >
            Compléter mon inscription <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </Section>

      <Section title="Mes catégories" icon={Users}>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <span
              key={cat.id}
              className="card-hover rounded-full px-4 py-2 text-sm font-medium shadow-sm"
              style={{
                backgroundColor: `${cat.color}15`,
                color: cat.color,
                border: `1px solid ${cat.color}30`,
              }}
            >
              {cat.name}
            </span>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-400">Aucune catégorie pour le moment.</p>
          )}
        </div>
      </Section>

      <Section title="Liens utiles" icon={LinkIcon}>
        <div className="space-y-2">
          {links.map(link => {
            const Icon = iconMap[link.icon] ?? LinkIcon;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-blue-200 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5 text-blue-900" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-900">{link.title}</span>
                <ExternalLink className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-900" />
              </a>
            );
          })}
          {links.length === 0 && <p className="text-sm text-gray-400">Aucun lien pour le moment.</p>}
        </div>
      </Section>

      <Section title="Groupes WhatsApp" icon={MessageCircle}>
        <div className="space-y-2">
          {whatsappGroups.map(group => (
            <a
              key={group.id}
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-green-200 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-green-100 transition-transform group-hover:scale-110">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-900">{group.name}</span>
              <ExternalLink className="h-4 w-4 text-gray-400 transition-colors group-hover:text-green-600" />
            </a>
          ))}
          {whatsappGroups.length === 0 && <p className="text-sm text-gray-400">Aucun groupe pour le moment.</p>}
        </div>
      </Section>

      <Section title="Contacts" icon={Phone}>
        <div className="space-y-2">
          {contacts.map(contact => (
            <div key={contact.id} className="card-hover rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{contact.role}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 transition-colors hover:text-blue-900">
                    <Phone className="h-3.5 w-3.5" /> {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 transition-colors hover:text-blue-900">
                    <Mail className="h-3.5 w-3.5" /> {contact.email}
                  </a>
                )}
              </div>
            </div>
          ))}
          {contacts.length === 0 && <p className="text-sm text-gray-400">Aucun contact pour le moment.</p>}
        </div>
      </Section>

      <Section title="Informations pratiques" icon={MapPin}>
        <div className="card-hover space-y-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{currentClub?.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Trophy className="h-4 w-4 text-gray-400" />
            <span>{currentClub?.sport}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Globe; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-900" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
