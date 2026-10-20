import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
// import { SupportWidget } from './components/layout/SupportWidget';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { SingleVerifyPage } from './pages/SingleVerifyPage';
import { BulkVerifyPage } from './pages/BulkVerifyPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ApiPage } from './pages/ApiPage';
import { BuyCreditsPage } from './pages/BuyCreditsPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SupportPage } from './pages/SupportPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { screen } = useApp();

  React.useEffect(() => {
    const titles: Record<string, string> = {
      single: 'Single Verify · MailVerify',
      bulk: 'Bulk Verify · MailVerify',
      integrations: 'Integrations · MailVerify',
      api: 'API · MailVerify',
      'buy-credits': 'Buy Credits · MailVerify',
      roadmap: 'Roadmap · MailVerify',
      support: 'Support · MailVerify',
      settings: 'Settings · MailVerify',
    };
    document.title = titles[screen] || 'MailVerify';
  }, [screen]);

  return (
    <div className="app-layout">
      {/* Persistent Enterprise Sidebar */}
      <Sidebar />

      {/* Main Canvas Area */}
      <main className="app-main">
        {/* Dynamic Contextual Header */}
        <Header />

        {/* View Switcher */}
        {screen === 'single' && <SingleVerifyPage />}
        {screen === 'bulk' && <BulkVerifyPage />}
        {screen === 'integrations' && <IntegrationsPage />}
        {screen === 'api' && <ApiPage />}
        {screen === 'buy-credits' && <BuyCreditsPage />}
        {screen === 'roadmap' && <RoadmapPage />}
        {screen === 'support' && <SupportPage />}
        {screen === 'settings' && <SettingsPage />}
      </main>

      {/* Global Accessible Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
