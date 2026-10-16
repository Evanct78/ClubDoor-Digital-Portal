import { useState } from 'react';
import { HelpCircle, LogOut, ChevronRight, DoorOpen, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import { useClub } from '@/context/ClubContext';

export function AdminMore() {
  const { signOut } = useAuth();
  const { currentClub } = useClub();
  const [showQR, setShowQR] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const qrValue = `${window.location.origin}/?club=${currentClub?.qr_token ?? 'demo-tennis-club'}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 stagger">
      <div>
        <h1 className="gradient-text text-2xl font-bold">Plus</h1>
        <p className="mt-1 text-sm text-gray-500">Aide et informations du club</p>
      </div>

      <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <QrCode className="h-4 w-4 text-blue-900" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">QR Code du club</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Affichez ce QR code à l'entrée du club pour que les nouveaux membres puissent s'inscrire.
        </p>
        <button
          onClick={() => setShowQR(true)}
          className="btn-ghost flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 py-3 text-sm font-medium text-blue-900 transition-all hover:from-blue-100 hover:to-blue-200"
        >
          <QrCode className="h-5 w-5" /> Afficher le QR Code
        </button>
      </div>

      <div className="card-hover rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-blue-900" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Informations du club</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Nom</span><span className="font-medium text-gray-900">{currentClub?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Sport</span><span className="font-medium text-gray-900">{currentClub?.sport}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Adresse</span><span className="font-medium text-gray-900">{currentClub?.address}</span></div>
        </div>
      </div>

      <div className="card-hover rounded-2xl bg-white shadow-sm">
        <button
          onClick={() => setShowHelp(true)}
          className="btn-ghost flex w-full items-center gap-3 p-4 transition-all hover:bg-slate-50"
        >
          <HelpCircle className="h-5 w-5 text-gray-400" />
          <span className="flex-1 text-left text-sm font-medium text-gray-900">Centre d'aide</span>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </button>
      </div>

      <div className="card-hover rounded-2xl bg-white shadow-sm">
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-2xl p-4 text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Se déconnecter</span>
        </button>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowQR(false)}>
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 text-center text-lg font-bold text-gray-900">{currentClub?.name}</h3>
            <p className="mb-4 text-center text-xs text-gray-400">Scannez pour rejoindre le club</p>
            <div className="flex justify-center">
              <div className="rounded-2xl border-2 border-blue-100 bg-slate-50 p-4">
                <QRCodeSVG value={qrValue} size={200} level="M" fgColor="#1e3a8a" />
              </div>
            </div>
            <button onClick={() => setShowQR(false)} className="btn-primary mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-white">
              Fermer
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowHelp(false)}>
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold text-gray-900">Centre d'aide</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Comment ajouter un événement ?</p>
                <p className="mt-1">Allez dans « Contenu » puis « Événements » et touchez « Créer un événement ».</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Comment voir les participations ?</p>
                <p className="mt-1">Allez dans « Membres » — les participations aux événements s'affichent en haut de la page.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Comment envoyer une notification ?</p>
                <p className="mt-1">Dans « Membres », touchez « Envoyer une notification » ou sélectionnez un membre pour lui envoyer un message individuel.</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="btn-primary mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-white">
              Fermer
            </button>
          </div>
        </div>
      )}

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setShowSignOutConfirm(false)}>
          <div className="animate-scale-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Se déconnecter ?</h3>
                <p className="text-sm text-gray-500">Vous devrez vous reconnecter pour accéder au club.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSignOutConfirm(false)} className="btn-ghost flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={() => { signOut(); setShowSignOutConfirm(false); }} className="btn-danger flex-1 rounded-xl py-2.5 text-sm font-medium text-white">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
