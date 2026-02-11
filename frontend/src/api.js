const API_BASE = '/api';

// --- REFERENCES (formerly Videos) ---

export async function fetchReferences() {
  const res = await fetch(`${API_BASE}/references`);
  if (!res.ok) throw new Error('Failed to fetch references');
  return res.json();
}

export async function createReference(urls) {
  const res = await fetch(`${API_BASE}/references`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tiktok_urls: urls }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create reference');
  }
  return res.json();
}

export async function deleteReference(id) {
  const res = await fetch(`${API_BASE}/references/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// --- AVATARS ---

export async function fetchAvatars() {
  const res = await fetch(`${API_BASE}/avatars`);
  if (!res.ok) throw new Error('Failed to fetch avatars');
  return res.json();
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_type', 'Upload');

  const res = await fetch(`${API_BASE}/avatars`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function deleteAvatar(id) {
  const res = await fetch(`${API_BASE}/avatars/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// --- MOTIONS ---

export async function fetchMotions() {
  const res = await fetch(`${API_BASE}/motions`);
  if (!res.ok) throw new Error('Failed to fetch motions');
  return res.json();
}

export async function createMotion(avatarId, referenceId) {
  const res = await fetch(`${API_BASE}/motions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar_id: avatarId, reference_id: referenceId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Create motion failed');
  }
  return res.json();
}

export async function deleteMotion(id) {
  const res = await fetch(`${API_BASE}/motions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// --- TRACKS ---

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

// --- MONTAGE ---

export async function fetchMontages() {
  const res = await fetch(`${API_BASE}/montage`);
  if (!res.ok) throw new Error('Failed to fetch montages');
  return res.json();
}

export async function createMontage(sourceId, sourceType, trackId) {
  const body = { track_id: trackId };
  if (sourceType === 'motion') {
    body.motion_id = sourceId;
  } else {
    body.video_id = sourceId;
  }

  const res = await fetch(`${API_BASE}/montage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Create failed');
  }
  return res.json();
}
