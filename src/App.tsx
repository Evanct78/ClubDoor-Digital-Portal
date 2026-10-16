import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ClubProvider } from '@/context/ClubContext';
import { QRLanding } from '@/components/QRLanding';
import { AuthPage } from '@/components/AuthPage';
import { AppShell } from '@/components/AppShell';

type Stage = 'qr' | 'auth' | 'app';

function Root() {
  const { user, loading } = useAuth();
  const [stage, setStage] = useState<Stage>('qr');

  // If user becomes authenticated, go to app stage
  useEffect(() => {
    if (user && stage !== 'app') {
      setStage('app');
    }
    if (!user && stage === 'app') {
      setStage('qr');
    }
  }, [user, stage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (stage === 'qr') {
    return <QRLanding onEnter={() => setStage('auth')} />;
  }

  if (stage === 'auth') {
    return <AuthPage onBack={() => setStage('qr')} />;
  }

  return (
    <ClubProvider>
      <AppShell />
    </ClubProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
