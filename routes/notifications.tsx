import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import NotificationsPage from '../components/NotificationsPage';

export const Route = createFileRoute('/notifications')({
  component: NotificationsRoute,
});

function NotificationsRoute() {
  return (
    <div className="absolute inset-0 block overflow-hidden">
      <div id="notifications-scroll-container" className="h-full w-full overflow-y-auto overflow-x-hidden">
        <NotificationsPage />
      </div>
    </div>
  );
}
