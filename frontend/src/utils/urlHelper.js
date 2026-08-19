/**
 * EZFinanz Upload URL Resolver
 * Resolves production backend URL for uploaded selfies & documents.
 */

export const getUploadUrl = (path) => {
  if (!path || typeof path !== 'string') return '';

  // 1. Return unchanged if already an absolute HTTP/HTTPS URL or Data URI
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // 2. Resolve base backend URL from environment variables or fallback to http://localhost:5000
  let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 3. Normalize base URL by stripping trailing '/api' or slashes
  baseUrl = baseUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');

  // 4. Ensure leading slash on relative path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};
