import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useToast } from '../hooks/useToast';
import { shortId } from '../utils';
import StatusBadge from './StatusBadge';
import VideoPlayerModal from './VideoPlayerModal';
import Modal from './Modal';

export default function MotionGenerationPage() {
  const [motions, setMotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  
  // Selection data
  const [avatars, setAvatars] = useState([]);
  const [references, setReferences] = useState([]);
  
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedReference, setSelectedReference] = useState('');
  
  const [creating, setCreating] = useState(false);
  const [player, setPlayer] = useState({ open: false, url: '', title: '' });
  const showToast = useToast();

  const loadMotions = useCallback(async () => {
    try {
      const data = await api.fetchMotions();
      setMotions(data);
    } catch {
      showToast('Ошибка загрузки моушенов', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMotions();
  }, [loadMotions]);

  useEffect(() => {
      const hasPending = motions.some((m) =>
        ['pending', 'processing'].includes(m.status)
      );
      if (!hasPending) return;
      const interval = setInterval(loadMotions, 5000);
      return () => clearInterval(interval);
    }, [motions, loadMotions]);

  const openCreateModal = async () => {
    try {
      const [aData, rData] = await Promise.all([
        api.fetchAvatars(),
        api.fetchReferences(),
      ]);
      setAvatars(aData);
      // Filter references that are ready (downloaded/completed)
      setReferences(rData.filter(r => ['downloaded', 'completed', 'success'].includes(r.status))); 
      setCreateModal(true);
    } catch (e) {
      showToast('Ошибка загрузки данных для создания', 'error');
    }
  };

  const handleCreate = async () => {
    if (!selectedAvatar || !selectedReference) {
      showToast('Выберите аватар и референс', 'error');
      return;
    }
    setCreating(true);
    try {
      await api.createMotion(selectedAvatar, selectedReference);
      showToast('Генерация запущена', 'success');
      setCreateModal(false);
      setSelectedAvatar('');
      setSelectedReference('');
      loadMotions();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить?')) return;
    try {
      await api.deleteMotion(id);
      setMotions(prev => prev.filter(m => m.id !== id));
      showToast('Удалено', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="page-container">
        <div className="page-header">
            <h1>Генерация Моушена</h1>
            <button className="btn btn-primary" onClick={openCreateModal}>
                <i className="fas fa-magic"></i> Создать
            </button>
        </div>

        {loading ? (
            <div className="loading">Загрузка...</div>
        ) : motions.length === 0 ? (
            <div className="empty-state">Нет генераций</div>
        ) : (
            <div className="card-grid">
                {motions.map(item => (
                    <div key={item.id} className="card">
                        <div className="card-preview"
                            onClick={() => item.motion_video_url && setPlayer({
                                open: true, 
                                url: item.motion_video_url, 
                                title: `Motion #${shortId(item.id)}`
                            })}
                        >
                            {item.motion_thumbnail_url ? (
                                <img src={item.motion_thumbnail_url} alt="Thumb" />
                            ) : (
                                <div className="placeholder">
                                    <i className="fas fa-running"></i>
                                </div>
                            )}
                            {item.motion_video_url && (
                                <div className="play-overlay"><i className="fas fa-play"></i></div>
                            )}
                            <StatusBadge status={item.status} />
                        </div>
                        <div className="card-body">
                            <div className="card-info">ID: {shortId(item.id)}</div>
                            <div className="card-actions">
                                <button className="btn-icon delete" onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                }}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {createModal && (
            <Modal title="Создать Моушен" onClose={() => setCreateModal(false)}>
                <div className="form-group">
                    <label>Выберите Аватар</label>
                    <div className="selection-grid">
                        {avatars.map(a => (
                            <div 
                                key={a.id} 
                                className={`selection-item ${selectedAvatar === a.id ? 'selected' : ''}`}
                                onClick={() => setSelectedAvatar(a.id)}
                            >
                                <img src={a.image_url} alt="av" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label>Выберите Референс</label>
                    <div className="selection-grid">
                        {references.map(r => (
                            <div 
                                key={r.id}
                                className={`selection-item ${selectedReference === r.id ? 'selected' : ''}`}
                                onClick={() => setSelectedReference(r.id)}
                            >
                                {r.thumbnail_url ? <img src={r.thumbnail_url} /> : <div className="no-img">Ref</div>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                        {creating ? 'Запуск...' : 'Сгенерировать'}
                    </button>
                </div>
            </Modal>
        )}

        {player.open && (
            <VideoPlayerModal 
                url={player.url} 
                title={player.title} 
                onClose={() => setPlayer({...player, open: false})} 
            />
        )}
    </div>
  );
}
