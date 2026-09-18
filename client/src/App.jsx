import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineSyncProvider } from './context/OfflineSyncContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { TelemetryHUD } from './components/TelemetryHUD';
import { MobileShellSimulator } from './components/MobileShellSimulator';
import { SpeedDialFAB } from './components/SpeedDialFAB';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { MobileInstallModal } from './components/MobileInstallModal';

// Views
import { ProjectsView } from './views/ProjectsView';
import { AttendanceView } from './views/AttendanceView';
import { DPRView } from './views/DPRView';
import { VendorLedgerView } from './views/VendorLedgerView';
import { CostSummaryView } from './views/CostSummaryView';
import { MaterialStockView } from './views/MaterialStockView';
import { PettyCashView } from './views/PettyCashView';
import { RABillingView } from './views/RABillingView';
import { PublicClientPortal } from './views/PublicClientPortal';
import { LoginView } from './views/LoginView';

import { 
  Package, 
  DollarSign, 
  FileSpreadsheet, 
  Share2, 
  ExternalLink,
  Layers,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { playSound } from './utils/soundEffects';
import { triggerHaptic } from './utils/haptics';

function MainApp() {
  const { user, token, setActiveProjectId } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppType, setWhatsAppType] = useState('vendor_payment_reminder');
  const [whatsAppVendorId, setWhatsAppVendorId] = useState(null);
  const [showCreateProjModal, setShowCreateProjModal] = useState(false);
  const [publicPortalToken, setPublicPortalToken] = useState(null);
  const [isMobileSimulator, setIsMobileSimulator] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // If user is not authenticated, show the Login & OTP portal
  if (!user || !token) {
    return <LoginView />;
  }

  // Helper to open WhatsApp modal with context
  const handleOpenWhatsApp = (type = 'vendor_payment_reminder', vendorId = null) => {
    playSound('tap');
    triggerHaptic('tap');
    setWhatsAppType(type);
    setWhatsAppVendorId(vendorId);
    setShowWhatsAppModal(true);
  };

  // If user clicked to view public client portal
  if (publicPortalToken) {
    return (
      <PublicClientPortal
        token={publicPortalToken}
        onClose={() => setPublicPortalToken(null)}
      />
    );
  }

  const appContent = (
    <div className="min-h-screen bg-cyber-950 text-slate-100 flex flex-col font-sans relative selection:bg-amber-500 selection:text-slate-950">
      {/* PWA Mobile Install Banner */}
      <PWAInstallBanner />

      {/* Top Header */}
      <Header
        onOpenRoleSwitcher={() => {
          playSound('tap');
          triggerHaptic('medium');
          setShowRoleModal(true);
        }}
        onOpenWhatsApp={() => handleOpenWhatsApp('daily_attendance_summary')}
        onOpenPublicPortal={() => setPublicPortalToken('gv-villa-pub-4829')}
      />

      {/* Live Site Telemetry HUD */}
      <TelemetryHUD
        isMobileSimulator={isMobileSimulator}
        onToggleSimulator={() => setIsMobileSimulator(!isMobileSimulator)}
        onOpenMobileInstall={() => setShowInstallModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24">
        {activeTab === 'projects' && (
          <ProjectsView
            onSelectProject={(projId) => {
              playSound('tap');
              triggerHaptic('tap');
              setActiveProjectId(projId);
              setActiveTab('attendance');
            }}
            onOpenCreateProject={() => {
              playSound('tap');
              triggerHaptic('tap');
              setShowCreateProjModal(true);
            }}
            onOpenClientPortal={(token) => setPublicPortalToken(token)}
          />
        )}

        {activeTab === 'attendance' && <AttendanceView />}

        {activeTab === 'dpr' && <DPRView />}

        {activeTab === 'ledger' && (
          <VendorLedgerView
            onOpenWhatsApp={(type, vId) => handleOpenWhatsApp(type, vId)}
          />
        )}

        {activeTab === 'cost' && <CostSummaryView />}

        {activeTab === 'materials' && <MaterialStockView />}

        {activeTab === 'petty-cash' && <PettyCashView />}

        {activeTab === 'ra-billing' && <RABillingView />}

        {/* More Menu View */}
        {activeTab === 'more' && (
          <div className="space-y-4 pb-20">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-heading">
              <Layers className="w-6 h-6 text-amber-400" />
              <span>More Modules & Tools</span>
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Materials & Stock */}
              <button
                onClick={() => {
                  playSound('tap');
                  triggerHaptic('tap');
                  setActiveTab('materials');
                }}
                className="p-4 rounded-2xl bg-cyber-900 border border-cyber-800 hover:border-cyber-cyan text-left transition-all flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-amber-300 font-heading">
                      Materials & Stock Register
                    </h3>
                    <p className="text-xs text-slate-400">
                      Live stock inventory, inward entries & low-stock alerts
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>

              {/* Petty Cash */}
              <button
                onClick={() => {
                  playSound('tap');
                  triggerHaptic('tap');
                  setActiveTab('petty-cash');
                }}
                className="p-4 rounded-2xl bg-cyber-900 border border-cyber-800 hover:border-emerald-500 text-left transition-all flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 font-heading">
                      Site Petty Cash Register
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cash In / Out vouchers, running balance & site tea/diesel
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>

              {/* GST RA Billing */}
              <button
                onClick={() => {
                  playSound('tap');
                  triggerHaptic('tap');
                  setActiveTab('ra-billing');
                }}
                className="p-4 rounded-2xl bg-cyber-900 border border-cyber-800 hover:border-cyan-400 text-left transition-all flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 font-heading">
                      GST Running Account (RA) Billing
                    </h3>
                    <p className="text-xs text-slate-400">
                      Client progressive billing, stage %, retention, TDS & invoice
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>

              {/* WhatsApp Hub */}
              <button
                onClick={() => handleOpenWhatsApp('daily_attendance_summary')}
                className="p-4 rounded-2xl bg-cyber-900 border border-cyber-800 hover:border-emerald-400 text-left transition-all flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 font-heading">
                      WhatsApp Notifications Hub
                    </h3>
                    <p className="text-xs text-slate-400">
                      Vendor reminders, labour summary to owner & client updates
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>

              {/* Public Client Portal Preview */}
              <button
                onClick={() => {
                  playSound('tap');
                  setPublicPortalToken('gv-villa-pub-4829');
                }}
                className="p-4 rounded-2xl bg-cyber-900 border border-cyber-800 hover:border-purple-400 text-left transition-all flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-purple-300 font-heading">
                      Client-Facing Progress Portal
                    </h3>
                    <p className="text-xs text-slate-400">
                      Shareable mini-dashboard with % progress & photo feed (no login)
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Speed-Dial Floating Action Button (FAB) */}
      <SpeedDialFAB
        onSelectAction={(actionId) => {
          setActiveTab(actionId);
        }}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <RoleSwitcherModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />

      <WhatsAppShareModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        defaultType={whatsAppType}
        defaultVendorId={whatsAppVendorId}
      />

      <CreateProjectModal
        isOpen={showCreateProjModal}
        onClose={() => setShowCreateProjModal(false)}
        onProjectCreated={() => {
          setActiveTab('projects');
        }}
      />

      <MobileInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );

  return (
    <MobileShellSimulator
      active={isMobileSimulator}
      onToggle={() => setIsMobileSimulator(!isMobileSimulator)}
    >
      {appContent}
    </MobileShellSimulator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineSyncProvider>
        <MainApp />
      </OfflineSyncProvider>
    </AuthProvider>
  );
}
