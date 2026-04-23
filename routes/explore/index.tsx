import { createFileRoute } from '@tanstack/react-router'
import ExplorePage from '../../components/ExplorePage'

export const Route = createFileRoute('/explore/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="absolute inset-0 block">
      <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar">
        <ExplorePage />
      </div>
    </div>
  )
}
