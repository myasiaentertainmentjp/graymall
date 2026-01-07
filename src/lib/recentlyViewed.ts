const STORAGE_KEY = 'recentlyViewedArticles';
const MAX_ITEMS = 20;

export function getRecentlyViewed(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addRecentlyViewed(articleId: string): void {
  try {
    const current = getRecentlyViewed();
    // Remove if already exists
    const filtered = current.filter(id => id !== articleId);
    // Add to front
    const updated = [articleId, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving recently viewed:', err);
  }
}

export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing recently viewed:', err);
  }
}