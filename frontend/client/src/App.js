import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import './App.css';

// Lazy load pages
const Dashboard              = lazy(() => import('./pages/Dashboard'));
const Cases                  = lazy(() => import('./pages/Cases'));
const NarrationInput         = lazy(() => import('./pages/NarrationInput'));
const SketchViewer           = lazy(() => import('./pages/SketchViewer'));
const Model3D                = lazy(() => import('./pages/Model3D'));
const AuditLog               = lazy(() => import('./pages/AuditLog'));
const InvestigationDashboard = lazy(() => import('./pages/InvestigationDashboard'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '300px',
      color: 'var(--cyan)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      letterSpacing: '0.15em',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⬡</div>
      LOADING...
    </div>
  );
}

function Layout() {
  const { sidebarOpen } = useApp();
  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`app-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <TopBar />
        <main className="app-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/cases"       element={<Cases />} />
              <Route path="/narration"   element={<NarrationInput />} />
              <Route path="/sketch"      element={<SketchViewer />} />
              <Route path="/model3d"     element={<Model3D />} />
              <Route path="/history"     element={<AuditLog />} />
              <Route path="/investigate" element={<InvestigationDashboard />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-raised)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-void)' } },
          error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--bg-void)' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  );
}