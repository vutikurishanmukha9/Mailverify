import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FloatingSupportChat } from './components/layout/FloatingSupportChat';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { SingleVerifyPage } from './pages/SingleVerifyPage';
import { BulkVerifyPage } from './pages/BulkVerifyPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ApiPage } from './pages/ApiPage';
import { BuyCreditsPage } from './pages/BuyCreditsPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';

const AppContent: React.FC = () => {
  const { screen, isSidebarCollapsed } = useApp();

  React.useEffect(() => {
    const titles: Record<string, string> = {
      single: 'Single Verify · MailVerify',
      bulk: 'Bulk Verify · MailVerify',
      integrations: 'Integrations · MailVerify',
      api: 'API · MailVerify',
      'buy-credits': 'Buy Credits · MailVerify',
      roadmap: 'Roadmap · MailVerify',
      settings: 'Settings · MailVerify',
      support: 'Help & Support · MailVerify',
    };
    document.title = titles[screen] || 'MailVerify';
  }, [screen]);

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
        {screen === 'settings' && <SettingsPage />}
        {screen === 'support' && <SupportPage />}
      </main>

      {/* Global Floating AI Support Chat Assistant */}
      <FloatingSupportChat />

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
