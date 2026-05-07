import { createFileRoute, useNavigate } from '@tanstack/react-router'
import AuthPage from '../components/AuthPage'

import type { User } from '../shared/types/auth'

export const Route = createFileRoute('/verify')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: User) => {
    // Zustand store is already updated by AuthPage (loginUser call).
    // The route guard in __root.tsx reacts to the Zustand isAuthenticated change automatically.
    if (!user.name) {
      navigate({ to: '/quick-start' });
    } else {
      navigate({ to: '/' });
    }
  };

  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
}
