import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import AddWizard from '../../components/AddWizard'
import { useIsHotel } from '../../features/account/hooks/useHotelProfile'

export const Route = createFileRoute('/post-ad/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { isHotel, isLoading } = useIsHotel();

  useEffect(() => {
    if (isHotel) navigate({ to: '/profile', replace: true });
  }, [isHotel, navigate]);

  const handleWizardComplete = () => {
    navigate({ to: '/profile' });
  };

  if (isLoading || isHotel) return null;

  return (
    <div className="absolute inset-0 block">
      <AddWizard onComplete={handleWizardComplete} />
    </div>
  )
}
