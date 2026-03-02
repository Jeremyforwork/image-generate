import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGenerate(body: {
  prompt: string;
  image: string;
  numImages: number;
  aspectRatio: string;
}, signal?: AbortSignal) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Generation failed');
  }
  return res.json();
}

export async function fetchHistory() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/history`, { headers });
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function saveHistory(record: {
  image_urls: string[];
  prompt: string;
  options: Record<string, any>;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/history`, {
    method: 'POST',
    headers,
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to save history');
  return res.json();
}

export async function deleteHistory(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/history?id=${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete history');
  return res.json();
}
