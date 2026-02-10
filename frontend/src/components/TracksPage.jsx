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
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="section">
      <div className="section-header">
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

      <div className="card-grid">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Загрузка...
          </div>
        ) : tracks.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-music"></i>
            <p>Нет треков. Загрузите первый аудио файл!</p>
          </div>
        ) : (
          tracks.map((t) => (
            <div className="card track-card" key={t.id}>
              <div className="card-body">
                <div className="track-info">
                  <div className="track-icon">
                    <i className="fas fa-music"></i>
                  </div>
                  <div className="track-details">
                    <div className="card-title">{t.name}</div>
                    <div className="track-artist">
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
                {t.file_url && (
                  <audio controls preload="none" src={t.file_url} />
                )}
                <div className="card-actions">
                  {t.file_url && (
                    <a
                      href={t.file_url}
                      download
                      className="btn-icon"
                      title="Скачать"
                    >
                      <i className="fas fa-download"></i>
                    </a>
                  )}
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(t.id)}
                    title="Удалить"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Track Modal */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Загрузить аудио трек"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setUploadModal(false)}
            >
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Загрузка...
                </>
              ) : (
                <>
                  <i className="fas fa-upload"></i> Загрузить
                </>
              )}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Название трека *</label>
          <input
            type="text"
            placeholder="Введите название"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Артист</label>
          <input
            type="text"
            placeholder="Введите имя артиста"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Аудио файл (MP3/WAV, до 10МБ) *</label>
          <div
            className="file-upload"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('dragover');
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
            onDrop={handleDrop}
          >
            <i className="fas fa-cloud-arrow-up"></i>
            <p>
              Перетащите файл сюда или <span className="link">выберите</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav"
              hidden
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            {file && <p className="file-name">{file.name}</p>}
          </div>
        </div>
      </Modal>
    </section>
  );
}
