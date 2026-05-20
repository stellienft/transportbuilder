/**
 * Content sanitization utilities for Transport Builder.
 * Prevents XSS in user-generated content before rendering or export.
 */

/**
 * Escape HTML entities in a string.
 * Use this for all user content injected into HTML templates.
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate a URL is safe (http/https only).
 * Returns the URL if valid, empty string otherwise.
 */
export function safeUrl(url: string | undefined | null): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return url;
  } catch {
    return "";
  }
}

/**
 * Sanitize a slug/filename — only allow alphanumeric, hyphens, underscores.
 */
export function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9-_]/g, "");
}
