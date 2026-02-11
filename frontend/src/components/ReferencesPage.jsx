import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useToast } from '../hooks/useToast';
import { truncateUrl, shortId } from '../utils';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import VideoPlayerModal from './VideoPlayerModal';

export default function ReferencesPage() {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [urls, setUrls] = useState('');
  const [creating, setCreating] = useState(false);
  const [player, setPlayer] = useState({ open: false, url: '', title: '' });
  const showToast = useToast();

  const loadReferences = useCallback(async () => {
    try {
      const data = await api.fetchReferences();
      setReferences(data);
    } catch {
      showToast('Ошибка загрузки референсов', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  // Auto-refresh for pending/downloading items
  useEffect(() => {
    const hasPending = references.some((r) =>
      ['pending', 'downloading'].includes(r.status)
    );
    if (!hasPending) return;
    const interval = setInterval(loadReferences, 5000);
    return () => clearInterval(interval);
  }, [references, loadReferences]);

  const handleCreate = async () => {
    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);
    if (urlList.length === 0) {
      showToast('Введите хотя бы одну ссылку', 'error');
      return;
    }

    setCreating(true);
    try {
      await api.createReference(urlList);
      showToast('Референсы добавлены в очередь', 'success');
      setCreateModal(false);
      setUrls('');
      loadReferences();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот референс?')) return;
    try {
      await api.deleteReference(id);
      setReferences((prev) => prev.filter((r) => r.id !== id));
      showToast('Референс удален', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Референсы</h1>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
          <i className="fas fa-plus"></i> Добавить
        </button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : references.length === 0 ? (
        <div className="empty-state">Нет референсов</div>
      ) : (
        <div className="card-grid">
          {references.map((item) => (
            <div key={item.id} className="card video-card">
              <div
                className="card-preview"
                onClick={() =>
                  item.file_url &&
                  setPlayer({
                    open: true,
                    url: item.file_url,
                    title: `Ref #${shortId(item.id)}`,
                  })
                }
              >
                {item.thumbnail_url ? (
                   <img src={item.thumbnail_url} className="w-full h-full object-cover" alt="Thumbnail" />
                ) : item.file_url ? (
                   <video src={item.file_url} className="w-full h-full object-cover" preload="metadata" muted />
                ) : (
                  <div className="placeholder w-full h-full flex items-center justify-center bg-dark-lighter">
                    <i className="fas fa-film text-2xl opacity-50"></i>
                  </div>
                )}
                {item.file_url && (
                  <div className="play-overlay">
                    <i className="fas fa-play"></i>
                  </div>
                )}
              </div>
              <div className="card-body">
                <StatusBadge status={item.status} />
                <div className="card-info" title={item.original_url}>
                  <a
                    href={item.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {truncateUrl(item.original_url)}
                  </a>
                </div>
                <div className="card-actions">
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      className="btn-icon"
                      style={{ marginRight: '8px' }}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Скачать"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fas fa-download"></i>
                    </a>
                  )}
                  <button
                    className="btn-icon delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModal && (
        <Modal
          title="Добавить референсы (TikTok)"
          onClose={() => setCreateModal(false)}
        >
          <div className="form-group">
            <label>Ссылки на TikTok видео (одна на строку)</label>
            <textarea
              rows={5}
              className="form-control"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/..."
            />
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </Modal>
      )}

      {player.open && (
        <VideoPlayerModal
          isOpen={true}
          url={player.url}
          title={player.title}
          onClose={() => setPlayer({ ...player, open: false })}
        />
      )}
    </div>
  );
}
