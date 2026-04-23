import { createFileRoute } from '@tanstack/react-router'
import OfficesPage from '../../components/OfficesPage'

export const Route = createFileRoute('/companies/')({
  validateSearch: (search: Record<string, unknown>) => ({
    category: search.category ? String(search.category) : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="absolute inset-0 block">
      <div className="h-full w-full overflow-y-auto no-scrollbar">
        <OfficesPage />
      </div>
    </div>
  )
}
