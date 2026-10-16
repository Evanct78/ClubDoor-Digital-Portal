import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DoorOpen, Smartphone, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Club } from '@/types';

type Props = {
  onEnter: () => void;
};

export function QRLanding({ onEnter }: Props) {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('clubs')
        .select('*')
        .eq('qr_token', 'demo-tennis-club')
        .maybeSingle();
      setClub(data as Club | null);
      setLoading(false);
    })();
  }, []);

  const qrValue = `${window.location.origin}/?club=demo-tennis-club`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Poster-style card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DoorOpen className="w-7 h-7 text-green-400" />
              <span className="text-2xl font-bold text-white tracking-tight">ClubDoor</span>
            </div>
            <p className="text-blue-200 text-sm">La porte d'entrée de votre club</p>
          </div>

          {/* Club info */}
          <div className="px-8 pt-8 pb-2 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {loading ? 'Chargement...' : club?.name ?? 'Tennis Club Olympique'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{club?.address ?? '12 Avenue du Sport, 75016 Paris'}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center px-8 py-6">
            <div className="p-4 bg-gray-50 rounded-2xl border-2 border-blue-100">
              <QRCodeSVG
                value={qrValue}
                size={220}
                level="M"
                fgColor="#1e3a8a"
                bgColor="#ffffff"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-blue-900">
              <Smartphone className="w-5 h-5" />
              <span className="font-semibold text-sm">Scannez le QR Code</span>
            </div>
            <p className="text-gray-400 text-xs text-center mt-2 max-w-xs">
              Scannez avec l'appareil photo de votre téléphone pour accéder à ClubDoor
            </p>
          </div>

          {/* CTA */}
          <div className="px-8 pb-8">
            <button
              onClick={onEnter}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 group"
            >
              Accéder au club
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          ClubDoor — {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
