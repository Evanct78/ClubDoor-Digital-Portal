import { useState } from 'react';
import { Home, Bell, User, DoorOpen, LogOut } from 'lucide-react';
import { useClub } from '@/context/ClubContext';
import { useAuth } from '@/context/AuthContext';
import { MemberHome } from './MemberHome';
import { MemberNews } from './MemberNews';
import { MemberAccount } from './MemberAccount';

type Tab = 'home' | 'news' | 'account';

export function MemberApp() {
  const { currentClub } = useClub();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('home');

  const navItems: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: 'home', icon: Home, label: 'Mon club' },
    { key: 'news', icon: Bell, label: 'Actualités' },
    { key: 'account', icon: User, label: 'Mon compte' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-slate-200 bg-gradient-to-b from-blue-950 to-slate-900 text-white md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-500 text-blue-950 shadow-lg shadow-green-400/20">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">{currentClub?.name}</p>
            <span className="text-[11px] font-medium text-blue-300">Espace adhérent</span>
          </div>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3" aria-label="Navigation principale">
          {navItems.map(item => (
            <SideNavItem
              key={item.key}
              active={tab === item.key}
              onClick={() => setTab(item.key)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={signOut}
            className="btn-ghost flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white shadow-lg shadow-blue-950/20 md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-500 text-blue-950">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">{currentClub?.name}</p>
            <span className="text-[11px] font-medium text-blue-300">Espace adhérent</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="animate-fade-in pb-28 md:pb-0">
          {tab === 'home' && <MemberHome />}
          {tab === 'news' && <MemberNews />}
          {tab === 'account' && <MemberAccount />}
        </main>
      </div>

      {/* Mobile floating bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 md:hidden">
        <nav className="flex items-center justify-around rounded-2xl border border-slate-200/60 bg-white/90 p-1.5 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          {navItems.map(item => (
            <FloatingNavItem
              key={item.key}
              active={tab === item.key}
              onClick={() => setTab(item.key)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

function SideNavItem({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Home; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`btn-ghost flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
        active
          ? 'bg-gradient-to-r from-white/15 to-white/5 font-semibold text-white shadow-sm shadow-black/10'
          : 'text-blue-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`} />
      <span>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />}
    </button>
  );
}

function FloatingNavItem({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Home; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition-all duration-300 ${
        active
          ? 'bg-gradient-to-br from-blue-900 to-blue-800 shadow-lg shadow-blue-900/25'
          : 'hover:bg-slate-100'
      }`}
    >
      <Icon
        className={`h-5 w-5 transition-all duration-300 ${
          active ? 'scale-110 text-white' : 'text-gray-400'
        }`}
      />
      <span
        className={`text-[10px] font-semibold tracking-tight transition-colors duration-300 ${
          active ? 'text-white' : 'text-gray-400'
        }`}
      >
        {label}
      </span>
      {active && (
        <span className="absolute -top-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm shadow-green-400/50" />
      )}
    </button>
  );
}
