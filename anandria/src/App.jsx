import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext.jsx';
import IntakeWizard from './components/IntakeWizard.jsx';
import Dashboard from './components/Dashboard.jsx';
import DiagnosticsModal from './components/DiagnosticsModal.jsx';
import { Toaster } from 'react-hot-toast';

function AppInner() {
  const { state } = useAppContext();
  const { showWizard, plan, showDiagnostics } = state;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
          },
        }}
      />

      {/* Main content */}
      {showWizard || !plan ? (
        <IntakeWizard />
      ) : (
        <Dashboard />
      )}

      {/* Diagnostics modal */}
      {showDiagnostics && <DiagnosticsModal />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
