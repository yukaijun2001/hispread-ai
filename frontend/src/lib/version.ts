// Reload once when the server reports a newer release than the page was built
// for. The version that triggered a reload is remembered for the tab so a
// mismatched deployment cannot cause a reload loop.
const RELEASE_KEY = 'login-release';
const release = (value: string | null | undefined) => (value && /^\d+\.\d+\.\d+/.test(value) ? value : null);

export async function checkForNewRelease(): Promise<void> {
  const current = release(document.querySelector('meta[name="app-version"]')?.getAttribute('content'));
  if (!current) return;
  try {
    const response = await fetch('/api/health', { cache: 'no-store', headers: { 'X-Hub-Background': '1' } });
    if (!response.ok) return;
    const server = release((await response.json()).version);
    if (!server || server === current) {
      sessionStorage.removeItem(RELEASE_KEY);
      return;
    }
    if (sessionStorage.getItem(RELEASE_KEY) === server) return;
    sessionStorage.setItem(RELEASE_KEY, server);
    location.reload();
  } catch {
    // Offline or health endpoint unavailable: keep the current page.
  }
}

/** Check now, every 15 s, and whenever the tab regains focus. Returns a stop function. */
export function watchForNewRelease(): () => void {
  const check = () => { if (document.visibilityState === 'visible') void checkForNewRelease(); };
  check();
  const timer = window.setInterval(check, 15_000);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', check);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', check);
    document.removeEventListener('visibilitychange', check);
  };
}
