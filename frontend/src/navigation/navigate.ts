import { router } from '../router';
import { isRouteId, normalizeLegacyPath } from './access';

/**
 * Navigate to a server-provided target such as a notification's `targetPath`
 * ("quotes?id=…"). Paths outside the console's routes are ignored rather than
 * followed, so a stored link can never send the user somewhere unexpected.
 */
export function openTarget(target: string | null | undefined, fallback = 'notifications') {
  const path = normalizeLegacyPath(target || fallback);
  const [route, query = ''] = path.split('?');
  if (!isRouteId(route)) return;
  router.push({ path: `/${route}`, query: Object.fromEntries(new URLSearchParams(query)) });
}
