import { createFileRoute, useNavigate } from '@tanstack/react-router'
import ProfilePage from '../../components/ProfilePage'
import { useState } from 'react'
import { Listing } from '../../types'

export const Route = createFileRoute('/profile/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const handleListingClick = (listing: Listing) => {
    navigate({ to: `/ad/${listing.id}` });
  };

  return (
    <div className="absolute inset-0 block">
      <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar">
        <ProfilePage 
          key={lastUpdate} 
          onListingClick={handleListingClick}
        />
      </div>
    </div>
  )
}
