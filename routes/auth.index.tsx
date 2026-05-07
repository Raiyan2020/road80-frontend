import { createFileRoute, useNavigate } from '@tanstack/react-router'
import AuthPage from '../components/AuthPage'

export const Route = createFileRoute('/auth/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // Zustand store is already updated by AuthPage (loginUser call).
    // The route guard in __root.tsx reacts to the Zustand isAuthenticated change automatically.
    navigate({ to: '/quick-start' });
  };

  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
}
