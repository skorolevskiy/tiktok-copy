import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useToast } from '../hooks/useToast';
import { truncateUrl, shortId, formatDuration } from '../utils';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import VideoPlayerModal from './VideoPlayerModal';

export default function MontagePage() {
  const [montages, setMontages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [videos, setVideos] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [creating, setCreating] = useState(false);
  const [player, setPlayer] = useState({ open: false, url: '', title: '' });
  const [step, setStep] = useState(1);
  const showToast = useToast();

  const loadMontages = useCallback(async () => {
    try {
      const data = await api.fetchMontages();
      setMontages(data);
    } catch {
      showToast('Ошибка загрузки монтажей', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMontages();
  }, [loadMontages]);

  useEffect(() => {
    const hasPending = montages.some((m) =>
      ['pending', 'processing'].includes(m.status)
    );
    if (!hasPending) return;
    const interval = setInterval(loadMontages, 5000);
    return () => clearInterval(interval);
  }, [montages, loadMontages]);

  const openCreateModal = async () => {
    try {
      const [vData, tData] = await Promise.all([
        api.fetchVideos(),
        api.fetchTracks(),
      ]);
      setVideos(
        vData.filter((v) => ['downloaded', 'completed'].includes(v.status))
      );
      setTracks(tData);
      setSelectedVideo('');
      setSelectedTrack('');
      setStep(1);
      setCreateModal(true);
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    }
  };

  const handleCreate = async () => {
    if (!selectedVideo || !selectedTrack) return;
    setCreating(true);
    try {
      await api.createMontage(selectedVideo, selectedTrack);
      showToast('Монтаж создан! Обработка началась.', 'success');
      setCreateModal(false);
      loadMontages();
    } catch (err) {
      showToast(`Ошибка: ${err.message}`, 'error');
    } finally {
      setCreating(false);
    }
  };

  const stepTitle =
    step === 1
      ? 'Шаг 1 — Выберите видео'
      : step === 2
        ? 'Шаг 2 — Выберите трек'
        : 'Подтверждение';

  const selectedVideoObj = videos.find((v) => v.id === selectedVideo);
  const selectedTrackObj = tracks.find((t) => t.id === selectedTrack);

  return (
    <section className="section">
      <div className="section-header">
        <h1>Монтаж</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="fas fa-wand-magic-sparkles"></i> Создать монтаж
        </button>
      </div>

      <div className="card-grid">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Загрузка...
          </div>
        ) : montages.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-wand-magic-sparkles"></i>
            <p>Нет монтажей. Создайте первый монтаж!</p>
          </div>
        ) : (
          montages.map((m) => (
            <div className="card montage-card" key={m.id}>
              {m.file_url ? (
                <div
                  className="card-preview"
                  onClick={() =>
                    setPlayer({
                      open: true,
                      url: m.file_url,
                      title: `Монтаж ${shortId(m.id)}`,
                    })
                  }
                >
                  <video src={m.file_url} preload="metadata" muted />
                  <div className="play-overlay">
                    <i className="fas fa-play-circle"></i>
                  </div>
                </div>
              ) : (
                <div className="card-preview">
                  <div className="card-preview-placeholder">
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>
                      {['pending', 'processing'].includes(m.status)
                        ? 'Обработка...'
                        : 'Нет файла'}
                    </span>
                  </div>
                </div>
              )}
              <div className="card-body">
                <div className="card-title">Монтаж {shortId(m.id)}</div>
                <div className="card-meta">
                  <StatusBadge status={m.status} />
                </div>
                <div className="card-actions">
                  {m.file_url && (
                    <a
                      href={m.file_url}
                      download
                      className="btn-icon"
                      title="Скачать"
                    >
                      <i className="fas fa-download"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Montage Modal — Wizard */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title={stepTitle}
        large
        footer={
          <div className="picker-footer">
            <div className="picker-steps">
              <span className={`step-dot ${step >= 1 ? 'active' : ''}`} />
              <span className={`step-dot ${step >= 2 ? 'active' : ''}`} />
              <span className={`step-dot ${step >= 3 ? 'active' : ''}`} />
            </div>
            <div className="picker-footer-actions">
              {step > 1 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setStep(step - 1)}
                >
                  <i className="fas fa-arrow-left"></i> Назад
                </button>
              )}
              {step === 1 && (
                <button
                  className="btn btn-primary"
                  disabled={!selectedVideo}
                  onClick={() => setStep(2)}
                >
                  Далее <i className="fas fa-arrow-right"></i>
                </button>
              )}
              {step === 2 && (
                <button
                  className="btn btn-primary"
                  disabled={!selectedTrack}
                  onClick={() => setStep(3)}
                >
                  Далее <i className="fas fa-arrow-right"></i>
                </button>
              )}
              {step === 3 && (
                <button
                  className="btn btn-primary"
                  disabled={creating}
                  onClick={handleCreate}
                >
                  {creating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Создание...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-wand-magic-sparkles"></i> Создать монтаж
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Step 1: Pick Video */}
        {step === 1 && (
          <div className="picker-list">
            {videos.length === 0 ? (
              <div className="picker-empty">
                <i className="fas fa-video-slash"></i>
                <p>Нет доступных видео для монтажа</p>
              </div>
            ) : (
              videos.map((v) => (
                <div
                  key={v.id}
                  className={`picker-item ${selectedVideo === v.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVideo(v.id)}
                >
                  <div className="picker-item-preview">
                    {v.file_url ? (
                      <video src={v.file_url} preload="metadata" muted />
                    ) : (
                      <i className="fas fa-video"></i>
                    )}
                  </div>
                  <div className="picker-item-info">
                    <div className="picker-item-title">
                      {truncateUrl(v.original_url, 55)}
                    </div>
                    <div className="picker-item-meta">
                      <StatusBadge status={v.status} />
                      <span className="picker-item-id">
                        <i className="fas fa-fingerprint"></i> {shortId(v.id)}
                      </span>
                    </div>
                  </div>
                  <div className="picker-item-check">
                    {selectedVideo === v.id && (
                      <i className="fas fa-check-circle"></i>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Step 2: Pick Track */}
        {step === 2 && (
          <div className="picker-list">
            {tracks.length === 0 ? (
              <div className="picker-empty">
                <i className="fas fa-music"></i>
                <p>Нет доступных треков</p>
              </div>
            ) : (
              tracks.map((t) => (
                <div
                  key={t.id}
                  className={`picker-item ${selectedTrack === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTrack(t.id)}
                >
                  <div className="picker-item-icon">
                    <i className="fas fa-music"></i>
                  </div>
                  <div className="picker-item-info">
                    <div className="picker-item-title">{t.name}</div>
                    <div className="picker-item-subtitle">
                      {t.artist || 'Неизвестный артист'}
                    </div>
                    <div className="picker-item-meta">
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
                    </div>
                  </div>
                  <div className="picker-item-check">
                    {selectedTrack === t.id && (
                      <i className="fas fa-check-circle"></i>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="picker-confirm">
            <div className="picker-confirm-row">
              <div className="picker-confirm-label">
                <i className="fas fa-video"></i> Видео
              </div>
              <div className="picker-confirm-card">
                {selectedVideoObj?.file_url ? (
                  <div className="picker-confirm-thumb">
                    <video
                      src={selectedVideoObj.file_url}
                      preload="metadata"
                      muted
                    />
                  </div>
                ) : (
                  <div className="picker-confirm-thumb placeholder">
                    <i className="fas fa-video"></i>
                  </div>
                )}
                <div className="picker-confirm-info">
                  <div className="picker-item-title">
                    {truncateUrl(selectedVideoObj?.original_url || '', 50)}
                  </div>
                  <span className="picker-item-id">
                    <i className="fas fa-fingerprint"></i>{' '}
                    {shortId(selectedVideoObj?.id)}
                  </span>
                </div>
              </div>
            </div>

            <div className="picker-confirm-divider">
              <i className="fas fa-plus"></i>
            </div>

            <div className="picker-confirm-row">
              <div className="picker-confirm-label">
                <i className="fas fa-music"></i> Трек
              </div>
              <div className="picker-confirm-card">
                <div className="picker-confirm-thumb placeholder music">
                  <i className="fas fa-music"></i>
                </div>
                <div className="picker-confirm-info">
                  <div className="picker-item-title">
                    {selectedTrackObj?.name}
                  </div>
                  <div className="picker-item-subtitle">
                    {selectedTrackObj?.artist || 'Неизвестный артист'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <VideoPlayerModal
        isOpen={player.open}
        onClose={() => setPlayer({ open: false, url: '', title: '' })}
        url={player.url}
        title={player.title}
      />
    </section>
  );
}
