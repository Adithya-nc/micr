import Index from './pages/Index'
import NotFound from './pages/NotFound'

const workspace = <Index />
export const routers = [
  { path: '/', name: 'command-center', element: workspace },
  { path: '/cases', name: 'active-case', element: workspace },
  { path: '/escalations', name: 'escalations', element: workspace },
  { path: '/approvals', name: 'approvals', element: workspace },
  { path: '/radar', name: 'radar', element: workspace },
  { path: '/admin', name: 'admin', element: workspace },
  { path: '*', name: '404', element: <NotFound /> },
]
declare global { interface Window { __routers__: typeof routers } }
window.__routers__ = routers
