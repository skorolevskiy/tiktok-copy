import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useToast } from '../hooks/useToast';
import { truncateUrl, shortId } from '../utils';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import VideoPlayerModal from './VideoPlayerModal';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadModal, setDownloadModal] = useState(false);
  const [urls, setUrls] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [player, setPlayer] = useState({ open: false, url: '', title: '' });
  const showToast = useToast();

  const loadVideos = useCallback(async () => {
    try {
      const data = await api.fetchVideos();
      setVideos(data);
    } catch {
      showToast('Ошибка загрузки видео', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Auto-refresh for pending/downloading videos
  useEffect(() => {
    const hasPending = videos.some((v) =>
      ['pending', 'downloading'].includes(v.status)
    );
    if (!hasPending) return;
    const interval = setInterval(loadVideos, 5000);
    return () => clearInterval(interval);
  }, [videos, loadVideos]);

  const handleDownload = async () => {
    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);
    if (urlList.length === 0) {
      showToast('Введите хотя бы одну ссылку', 'error');
      return;
    }
    setDownloading(true);
    try {
      const data = await api.downloadVideos(urlList);
      showToast(`Добавлено ${data.length} видео на скачивание`, 'success');
      setDownloadModal(false);
      setUrls('');
      loadVideos();
    } catch (err) {
      showToast(`Ошибка: ${err.message}`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить это видео?')) return;
    try {
      await api.deleteVideo(id);
      showToast('Видео удалено', 'success');
      loadVideos();
    } catch (err) {
      showToast(`Ошибка удаления: ${err.message}`, 'error');
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h1>Видео</h1>
        <button
          className="btn btn-primary"
          onClick={() => setDownloadModal(true)}
        >
          <i className="fas fa-download"></i> Скачать видео
        </button>
      </div>

      <div className="card-grid">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Загрузка...
          </div>
        ) : videos.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-video"></i>
            <p>Нет видео. Скачайте первое видео из TikTok!</p>
          </div>
        ) : (
          videos.map((v) => (
            <div
              className="card video-card"
              key={v.id}
              onClick={() => {
                if (v.file_url) {
                  setPlayer({
                    open: true,
                    url: v.file_url,
                    title: truncateUrl(v.original_url),
                  });
                }
              }}
              style={{ cursor: v.file_url ? 'pointer' : 'default' }}
            >
              {v.file_url ? (
                <div className="card-preview">
                  <video src={v.file_url} preload="metadata" muted />
                  <div className="play-overlay">
                    <i className="fas fa-play-circle"></i>
                  </div>
                </div>
              ) : (
                <div className="card-preview">
                  <div className="card-preview-placeholder">
                    <i className="fas fa-video"></i>
                    <span>
                      {['pending', 'downloading'].includes(v.status)
                        ? 'Загружается...'
                        : 'Нет файла'}
                    </span>
                  </div>
                </div>
              )}
              <div className="card-body">
                <div className="card-title" title={v.original_url}>
                  {truncateUrl(v.original_url)}
                </div>
                <div className="card-meta">
                  <StatusBadge status={v.status} />
                </div>
                <div className="card-actions">
                  {v.file_url && (
                    <a
                      href={v.file_url}
                      download
                      className="btn-icon"
                      title="Скачать"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fas fa-download"></i>
                    </a>
                  )}
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(v.id);
                    }}
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

      {/* Download Modal */}
      <Modal
        isOpen={downloadModal}
        onClose={() => setDownloadModal(false)}
        title="Скачать видео из TikTok"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setDownloadModal(false)}
            >
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Скачивание...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i> Скачать
                </>
              )}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Ссылки на TikTok видео</label>
          <textarea
            rows={5}
            placeholder={
              'Вставьте ссылки, каждая на новой строке\nhttps://www.tiktok.com/@user/video/123\nhttps://www.tiktok.com/@user/video/456'
            }
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
          />
        </div>
      </Modal>

      {/* Video Player */}
      <VideoPlayerModal
        isOpen={player.open}
        onClose={() => setPlayer({ open: false, url: '', title: '' })}
        url={player.url}
        title={player.title}
      />
    </section>
  );
}
