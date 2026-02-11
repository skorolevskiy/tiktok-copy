import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useToast } from '../hooks/useToast';
import Modal from './Modal';

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const showToast = useToast();

  const loadAvatars = useCallback(async () => {
    try {
      const data = await api.fetchAvatars();
      setAvatars(data);
    } catch {
      showToast('Ошибка загрузки аватаров', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const handleUpload = async () => {
    if (!file) {
      showToast('Выберите файл', 'error');
      return;
    }

    setUploading(true);
    try {
      await api.uploadAvatar(file);
      showToast('Аватар загружен', 'success');
      setUploadModal(false);
      setFile(null);
      loadAvatars();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот аватар?')) return;
    try {
      await api.deleteAvatar(id);
      setAvatars((prev) => prev.filter((a) => a.id !== id));
      showToast('Аватар удален', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Аватары</h1>
        <button className="btn btn-primary" onClick={() => setUploadModal(true)}>
          <i className="fas fa-upload"></i> Загрузить
        </button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : avatars.length === 0 ? (
        <div className="empty-state">Нет аватаров</div>
      ) : (
        <div className="card-grid">
          {avatars.map((avatar) => (
            <div key={avatar.id} className="card">
              <div className="card-preview">
                <img src={avatar.image_url} alt="Avatar" style={{ objectFit: 'contain' }} />
              </div>
              <div className="card-body">
                 <div className="card-actions" style={{ justifyContent: 'flex-end' }}>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(avatar.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadModal && (
        <Modal title="Загрузить Аватар" onClose={() => setUploadModal(false)}>
          <div className="form-group">
            <label>Изображение</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept="image/*"
              className="form-control"
            />
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
