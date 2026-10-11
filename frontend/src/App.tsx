import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CatalogPage } from './pages/CatalogPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TwoFactorChallenge } from './pages/TwoFactorChallenge';
import { DashboardPage } from './pages/DashboardPage';
import { SecuritySettingsPage } from './pages/SecuritySettingsPage';
import { AdminPage } from './pages/AdminPage';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, requires2FA } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center space-x-3 text-emerald-400">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold">Verifying secure portal session...</span>
        </div>
      </div>
    );
  }

  // Active 2FA challenge takes precedence
  if (requires2FA || currentPage === 'verify-2fa') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <Navbar currentPage="verify-2fa" onNavigate={handleNavigate} />
        <main className="flex-1">
          <TwoFactorChallenge onNavigate={handleNavigate} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />
        )}

        {currentPage === 'catalog' && (
          <CatalogPage onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />
        )}

        {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}

        {currentPage === 'register' && <RegisterPage onNavigate={handleNavigate} />}

        {currentPage === 'dashboard' &&
          (isAuthenticated ? (
            <DashboardPage onNavigate={handleNavigate} />
          ) : (
            <LoginPage onNavigate={handleNavigate} />
          ))}

        {currentPage === 'security' &&
          (isAuthenticated ? (
            <SecuritySettingsPage />
          ) : (
            <LoginPage onNavigate={handleNavigate} />
          ))}

        {currentPage === 'admin' &&
          (isAuthenticated && user?.role === 'ADMIN' ? (
            <AdminPage />
          ) : (
            <DashboardPage onNavigate={handleNavigate} />
          ))}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Apex University &bull; School Management System &bull; Information Security Academic Project &bull;{' '}
        {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
