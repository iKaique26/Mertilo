/**
 * Cliente HTTP base para comunicação com API
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number>;
}

/**
 * Faz requisições HTTP com tratamento de erro
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { query, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).map(([k, v]) => [k, String(v)])
    );
    url += `?${params.toString()}`;
  }

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mertilo_token') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    } as Record<string,string>;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.error || `Erro HTTP ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro na requisição: ${message}`);
  }
}
