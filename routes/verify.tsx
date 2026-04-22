import { createFileRoute, useNavigate } from '@tanstack/react-router'
import AuthPage from '../components/AuthPage'
import { useAppContext } from '../components/AppContext'

import type { User } from '../shared/types/auth'

export const Route = createFileRoute('/verify')({
  component: RouteComponent,
})

function RouteComponent() {
  const { setIsAuthenticated } = useAppContext();
  const navigate = useNavigate();

  const handleLoginSuccess = (user: User) => {
    setIsAuthenticated(true);
    // If the user hasn't set up their profile (e.g. no name), send them to quick-start
    if (!user.name) {
      navigate({ to: '/quick-start' });
    } else {
      navigate({ to: '/' }); // Or to '/dashboard' if appropriate
    }
  };

  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
}
