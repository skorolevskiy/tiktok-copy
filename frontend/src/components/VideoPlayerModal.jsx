import { useRef, useEffect } from 'react';
import Modal from './Modal';

export default function VideoPlayerModal({ isOpen, onClose, url, title }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && videoRef.current && url) {
      videoRef.current.src = url;
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, url]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Видео'} large>
      <video ref={videoRef} controls className="video-player">
        Your browser does not support the video tag.
      </video>
    </Modal>
  );
}
