import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api';
import { useToast } from '../hooks/useToast';
import { shortId, formatDuration } from '../utils';
import Modal from './Modal';

export default function TracksPage() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const showToast = useToast();

  const loadTracks = useCallback(
    async (searchQuery) => {
      try {
        const data = await api.fetchTracks(searchQuery ?? search);
        setTracks(data);
      } catch {
        showToast('Ошибка загрузки треков', 'error');
      } finally {
        setLoading(false);
      }
    },
    [search, showToast]
  );

  // Load once on mount
  useEffect(() => {
    loadTracks('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => loadTracks(value), 400);
  };

  const handleUpload = async () => {
    if (!name.trim()) {
      showToast('Введите название трека', 'error');
      return;
    }
    if (!file) {
      showToast('Выберите аудио файл', 'error');
      return;
    }
    setUploading(true);
    try {
      await api.uploadTrack(name, artist, file);
      showToast('Трек загружен!', 'success');
      setUploadModal(false);
      setName('');
      setArtist('');
      setFile(null);
      loadTracks(search);
    } catch (err) {
      showToast(`Ошибка: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот трек?')) return;
    try {
      await api.deleteTrack(id);
      showToast('Трек удалён', 'success');
      loadTracks(search);
    } catch (err) {
      showToast(`Ошибка удаления: ${err.message}`, 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary'); 
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Аудио треки</h1>
        <button
          className="btn btn-primary"
          onClick={() => setUploadModal(true)}
        >
          <i className="fas fa-upload"></i> Загрузить трек
        </button>
      </div>

      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Поиск по названию или артисту..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full loading">
            <i className="fas fa-spinner fa-spin text-4xl mb-2"></i> Загрузка...
          </div>
        ) : tracks.length === 0 ? (
          <div className="col-span-full empty-state">
            <i className="fas fa-music"></i>
            <p>Нет треков. Загрузите первый аудио файл!</p>
          </div>
        ) : (
          tracks.map((t) => (
            <div className="card track-card group" key={t.id}>
              <div className="card-body">
                <div className="track-info">
                  <div className="track-icon">
                    <i className="fas fa-music"></i>
                  </div>
                  <div className="track-details">
                    <div className="card-title" title={t.name}>{t.name}</div>
                    <div className="track-artist" title={t.artist}>
                      {t.artist || 'Неизвестный артист'}
                    </div>
                  </div>
                </div>
                
                <div className="track-stats">
                  {t.duration_seconds > 0 && (
                    <span>
                      <i className="fas fa-clock"></i>{' '}
                      {formatDuration(t.duration_seconds)}
                    </span>
                  )}
                  <span>
                    <i className="fas fa-weight-hanging"></i>{' '}
                    {t.size_mb.toFixed(2)} МБ
                  </span>
                  <span>
                    <i className="fas fa-fingerprint"></i> {shortId(t.id)}
                  </span>
                </div>

                <div className="flex justify-end mt-auto pt-4 border-t border-border/50">
                    <button
                      className="btn-icon hover:border-danger hover:text-danger"
                      onClick={() => handleDelete(t.id)}
                      title="Удалить"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <a 
                        href={`/api/files/${t.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-icon ml-2 hover:text-white"
                        download
                    >
                        <i className="fas fa-download"></i>
                    </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {uploadModal && (
        <Modal title="Загрузить трек" onClose={() => setUploadModal(false)}>
          <div className="space-y-4">
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название трека"
              />
            </div>
            <div className="form-group">
              <label>Исполнитель</label>
              <input
                type="text"
                className="input-field"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Имя исполнителя (необязательно)"
              />
            </div>
            
            <div 
                className={`border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); }}
                onDrop={handleDrop}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="audio/*"
                    onChange={(e) => setFile(e.target.files[0])}
                />
                
                {file ? (
                    <div className="text-primary font-medium">
                        <i className="fas fa-file-audio text-2xl mb-2 block"></i>
                        {file.name}
                    </div>
                ) : (
                    <div className="text-text-muted">
                        <i className="fas fa-cloud-upload-alt text-3xl mb-2 block"></i>
                        <p>Нажмите или перетащите файл</p>
                        <p className="text-xs mt-1 opacity-70">MP3, WAV, AAC до 50MB</p>
                    </div>
                )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary w-full justify-center"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Загрузка...</>
                ) : (
                    <><i className="fas fa-check"></i> Загрузить</>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
