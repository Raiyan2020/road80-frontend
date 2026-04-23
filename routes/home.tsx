import { createFileRoute } from '@tanstack/react-router'
import HomePage from '../features/home/components/HomePage'
import { useAppContext } from '../components/AppContext'

export const Route = createFileRoute('/home')({
  component: RouteComponent,
})

function RouteComponent() {
  const { theme, setTheme } = useAppContext();
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="absolute inset-0 block">
      <div className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
        <HomePage theme={theme} onToggleTheme={toggleTheme} />
      </div>
    </div>
  )
}
