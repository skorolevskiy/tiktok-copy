import { useState, useEffect, useCallback } from 'react';
import * as api from '../api';
import { useToast } from '../hooks/useToast';
import { shortId, formatDuration } from '../utils';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import VideoPlayerModal from './VideoPlayerModal';

export default function MontagePage() {
  const [montages, setMontages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [motions, setMotions] = useState([]); 
  const [videos, setVideos] = useState([]);
  const [tracks, setTracks] = useState([]);
  
  const [sourceType, setSourceType] = useState('motion'); // 'motion' | 'video'
  const [selectedSourceId, setSelectedSourceId] = useState('');
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
      const [mData, tData, vData] = await Promise.all([
        api.fetchMotions(),
        api.fetchTracks(),
        api.fetchReferences(),
      ]);
      setMotions(
        mData.filter((m) => ['success', 'completed'].includes(m.status))
      );
      setVideos(
        vData.filter((v) => ['downloaded', 'completed'].includes(v.status))
      );
      setTracks(tData);
      setSelectedSourceId('');
      setSelectedTrack('');
      setSourceType('motion');
      setStep(1);
      setCreateModal(true);
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    }
  };

  const handleCreate = async () => {
    if (!selectedSourceId || !selectedTrack) return;
    setCreating(true);
    try {
      await api.createMontage(selectedSourceId, sourceType, selectedTrack);
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

  const selectedSourceObj = 
    sourceType === 'motion' 
      ? motions.find((m) => m.id === selectedSourceId)
      : videos.find((v) => v.id === selectedSourceId);
      
  const selectedTrackObj = tracks.find((t) => t.id === selectedTrack);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Монтаж</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="fas fa-wand-magic-sparkles"></i> Создать монтаж
        </button>
      </div>

      <div className="card-grid">
        {loading ? (
          <div className="col-span-full loading">
            <i className="fas fa-spinner fa-spin text-4xl mb-2"></i> Загрузка...
          </div>
        ) : montages.length === 0 ? (
          <div className="col-span-full empty-state">
            <i className="fas fa-wand-magic-sparkles"></i>
            <p>Нет монтажей. Создайте первый монтаж!</p>
          </div>
        ) : (
          montages.map((m) => (
            <div className="card video-card group" key={m.id}>
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
                  <video src={m.file_url} preload="metadata" muted className="w-full h-full object-cover" />
                  <div className="play-overlay">
                    <i className="fas fa-play-circle"></i>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ) : (
                <div className="card-preview bg-dark-lighter flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-dark-card flex items-center justify-center mb-3">
                        <i className={`fas ${['failed', 'error'].includes(m.status) ? 'fa-exclamation-triangle text-danger' : 'fa-cog fa-spin text-primary' } text-2xl`}></i>
                    </div>
                    <span className="text-sm font-medium text-text-muted">
                      {['pending', 'processing'].includes(m.status)
                        ? 'Обработка...'
                        : 'Ошибка генерации'}
                    </span>
                    <StatusBadge status={m.status} />
                </div>
              )}
              
              <div className="card-body">
                <div className="card-info font-medium text-white">ID: {shortId(m.id)}</div>
                <div className="card-actions justify-end">
                    {/* Additional actions can go here */}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {createModal && (
        <Modal title={stepTitle} onClose={() => setCreateModal(false)} large>
          <div className="p-1">
              {/* Stepper Header */}
              <div className="flex items-center mb-8 px-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold transition-colors ${step >= 1 ? 'bg-primary text-white' : 'bg-dark-input text-text-muted'}`}>1</div>
                  <div className={`h-1 flex-1 mx-2 rounded ${step >= 2 ? 'bg-primary' : 'bg-dark-input'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold transition-colors ${step >= 2 ? 'bg-primary text-white' : 'bg-dark-input text-text-muted'}`}>2</div>
                  <div className={`h-1 flex-1 mx-2 rounded ${step >= 3 ? 'bg-primary' : 'bg-dark-input'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold transition-colors ${step >= 3 ? 'bg-primary text-white' : 'bg-dark-input text-text-muted'}`}>3</div>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  {/* Source Tabs */}
                  <div className="flex space-x-2 border-b border-border mb-4">
                    <button
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${sourceType === 'motion' ? 'border-primary text-white' : 'border-transparent text-text-muted hover:text-white'}`}
                      onClick={() => { setSourceType('motion'); setSelectedSourceId(''); }}
                    >
                      Generated Motions
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${sourceType === 'video' ? 'border-primary text-white' : 'border-transparent text-text-muted hover:text-white'}`}
                      onClick={() => { setSourceType('video'); setSelectedSourceId(''); }}
                    >
                      Reference Videos
                    </button>
                  </div>

                  <div className="selection-grid h-[50vh] max-h-[500px] overflow-y-auto">
                    {sourceType === 'motion' ? (
                        motions.length === 0 ? (
                            <div className="col-span-full text-center text-text-muted py-8">Нет доступных motion видео</div>
                        ) : (
                            motions.map((m) => (
                              <div
                                key={m.id}
                                className={`selection-item group relative cursor-pointer border rounded-lg overflow-hidden ${selectedSourceId === m.id ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}
                                onClick={() => setSelectedSourceId(m.id)}
                              >
                                 <div className="aspect-[9/16] relative bg-dark-lighter">
                                     {m.motion_thumbnail_url ? (
                                        <img src={m.motion_thumbnail_url} alt="motion" className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <i className="fas fa-film text-2xl opacity-50"></i>
                                        </div>
                                     )}
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                 </div>
                                 <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-xs text-center truncate text-white">
                                    {shortId(m.id)}
                                 </div>
                              </div>
                            ))
                        )
                    ) : (
                        videos.length === 0 ? (
                            <div className="col-span-full text-center text-text-muted py-8">Нет доступных референсных видео</div>
                        ) : (
                            videos.map((v) => (
                              <div
                                key={v.id}
                                className={`selection-item group relative cursor-pointer border rounded-lg overflow-hidden ${selectedSourceId === v.id ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}
                                onClick={() => setSelectedSourceId(v.id)}
                              >
                                 <div className="aspect-[9/16] relative bg-dark-lighter">
                                     {v.thumbnail_url ? (
                                        <img src={v.thumbnail_url} alt="video" className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <i className="fas fa-video text-2xl opacity-50"></i>
                                        </div>
                                     )}
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                 </div>
                                 <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-xs text-center truncate text-white">
                                    {shortId(v.id)}
                                 </div>
                              </div>
                            ))
                        )
                    )}
                  </div>
                  <div className="modal-actions">
                    <button
                      className="btn btn-primary"
                      disabled={!selectedSourceId}
                      onClick={() => setStep(2)}
                    >
                      Далее <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2">
                        {tracks.map((t) => (
                        <div
                            key={t.id}
                            className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${selectedTrack === t.id ? 'bg-primary/10 border-primary' : 'bg-dark-input border-border hover:border-primary/50'}`}
                            onClick={() => setSelectedTrack(t.id)}
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 shrink-0">
                                <i className="fas fa-music"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-white">{t.name}</div>
                                <div className="text-xs text-text-muted truncate">{t.artist}</div>
                            </div>
                            <div className="text-xs text-text-muted ml-3 whitespace-nowrap">
                                {formatDuration(t.duration_seconds)}
                            </div>
                        </div>
                        ))}
                    </div>
                  <div className="modal-actions justify-between">
                    <button className="btn btn-secondary" onClick={() => setStep(1)}>
                         <i className="fas fa-arrow-left"></i> Назад
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!selectedTrack}
                      onClick={() => setStep(3)}
                    >
                      Далее <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-check text-4xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Всё готово!</h3>
                  <p className="text-text-muted mb-8 max-w-xs mx-auto">
                    Вы выбрали {sourceType === 'motion' ? 'моушен' : 'видео'} <b>{selectedSourceObj ? shortId(selectedSourceObj.id) : '...'}</b> и трек <b>{selectedTrackObj ? selectedTrackObj.name : '...'}</b>.
                  </p>
                  
                  <div className="modal-actions justify-between">
                    <button className="btn btn-secondary" onClick={() => setStep(2)} disabled={creating}>
                        <i className="fas fa-arrow-left"></i> Назад
                    </button>
                    <button
                      className="btn btn-primary px-8"
                      onClick={handleCreate}
                      disabled={creating}
                    >
                        {creating ? (
                            <><i className="fas fa-spinner fa-spin"></i> Создание...</>
                        ) : (
                            <><i className="fas fa-check-circle"></i> Создать монтаж</>
                        )}
                    </button>
                  </div>
                </div>
              )}
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
