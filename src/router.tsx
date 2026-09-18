import Index from './pages/Index'
import NotFound from './pages/NotFound'
import CommandCenter from './pages/app/CommandCenter'
import ActiveCase from './pages/app/ActiveCase'
import Escalations from './pages/app/Escalations'
import Approvals from './pages/app/Approvals'
import Radar from './pages/app/Radar'
import Testing from './pages/app/Testing'
import Status from './pages/app/Status'

export const routers = [
  { path: '/', name: 'landing', element: <Index /> },
  { path: '/app', name: 'command-center', element: <CommandCenter /> },
  { path: '/app/cases/:caseId', name: 'active-case', element: <ActiveCase /> },
  { path: '/escalations', name: 'escalations', element: <Escalations /> },
  { path: '/approvals', name: 'approvals', element: <Approvals /> },
  { path: '/radar', name: 'radar', element: <Radar /> },
  { path: '/testing', name: 'testing', element: <Testing /> },
  { path: '/status', name: 'status', element: <Status /> },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  { path: '*', name: '404', element: <NotFound /> },
]

declare global {
  interface Window {
    __routers__: typeof routers
  }
}

window.__routers__ = routers
