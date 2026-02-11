import { useState } from 'react';
import { ToastProvider } from './hooks/useToast';
import Sidebar from './components/Sidebar';
import ReferencesPage from './components/ReferencesPage';
import AvatarsPage from './components/AvatarsPage';
import MotionGenerationPage from './components/MotionGenerationPage';
import TracksPage from './components/TracksPage';
import MontagePage from './components/MontagePage';

export default function App() {
  const [activeSection, setActiveSection] = useState('avatars');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <Sidebar
        active={activeSection}
        onNavigate={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />
      <main className="content">
        {activeSection === 'avatars' && <AvatarsPage />}
        {activeSection === 'references' && <ReferencesPage />}
        {activeSection === 'motions' && <MotionGenerationPage />}
        {activeSection === 'tracks' && <TracksPage />}
        {activeSection === 'montage' && <MontagePage />}
      </main>
    </ToastProvider>
  );
}
