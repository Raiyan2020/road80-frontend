import { createFileRoute, useNavigate } from '@tanstack/react-router'
import AuthPage from '../components/AuthPage'

/**
 * `redirect` carries the destination the route guard interrupted — e.g. a hotel
 * link shared to someone who was signed out (use case 1.5). Returning them there
 * after login is what keeps a shared link usable.
 */
type AuthSearch = { redirect?: string };

export const Route = createFileRoute('/auth/')({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const value = typeof search.redirect === 'string' ? search.redirect : undefined;
    // Only same-origin paths: never bounce to an absolute URL supplied via the
    // query string, which would be an open redirect.
    return value && value.startsWith('/') && !value.startsWith('//')
      ? { redirect: value }
      : {};
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const handleLoginSuccess = () => {
    // Zustand store is already updated by AuthPage (loginUser call).
    // The route guard in __root.tsx reacts to the Zustand isAuthenticated change automatically.
    if (redirect) {
      navigate({ to: redirect as never, replace: true });
      return;
    }
    navigate({ to: '/quick-start' });
  };

  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
}
