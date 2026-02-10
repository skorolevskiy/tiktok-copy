const API_BASE = '/api';

export async function fetchVideos() {
  const res = await fetch(`${API_BASE}/videos`);
  if (!res.ok) throw new Error('Failed to fetch videos');
  return res.json();
}

export async function downloadVideos(urls) {
  const res = await fetch(`${API_BASE}/videos/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tiktok_urls: urls }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Download failed');
  }
  return res.json();
}

export async function deleteVideo(id) {
  const res = await fetch(`${API_BASE}/videos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function fetchTracks(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/tracks${query}`);
  if (!res.ok) throw new Error('Failed to fetch tracks');
  return res.json();
}

export async function uploadTrack(name, artist, file) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('artist', artist);
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/tracks/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function deleteTrack(id) {
  const res = await fetch(`${API_BASE}/tracks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function fetchMontages() {
  const res = await fetch(`${API_BASE}/montage`);
  if (!res.ok) throw new Error('Failed to fetch montages');
  return res.json();
}

export async function createMontage(videoId, trackId) {
  const res = await fetch(`${API_BASE}/montage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_id: videoId, track_id: trackId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Create failed');
  }
  return res.json();
}
