import { useState } from 'react';
import { ToastProvider } from './hooks/useToast';
import Sidebar from './components/Sidebar';
import VideosPage from './components/VideosPage';
import TracksPage from './components/TracksPage';
import MontagePage from './components/MontagePage';

export default function App() {
  const [activeSection, setActiveSection] = useState('videos');
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
        {activeSection === 'videos' && <VideosPage />}
        {activeSection === 'tracks' && <TracksPage />}
        {activeSection === 'montage' && <MontagePage />}
      </main>
    </ToastProvider>
  );
}
