import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import Sidebar from './components/Sidebar';
import ReferencesPage from './components/ReferencesPage';
import AvatarsPage from './components/AvatarsPage';
import MotionGenerationPage from './components/MotionGenerationPage';
import TracksPage from './components/TracksPage';
import MontagePage from './components/MontagePage';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/avatars" replace />} />
          <Route path="/avatars" element={<AvatarsPage />} />
          <Route path="/references" element={<ReferencesPage />} />
          <Route path="/motions" element={<MotionGenerationPage />} />
          <Route path="/tracks" element={<TracksPage />} />
          <Route path="/montage" element={<MontagePage />} />
        </Routes>
      </main>
    </ToastProvider>
  );
}
