import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ErrorPage from './pages/Error'
import CommandCenter from './pages/app/CommandCenter'
import CaseList from './pages/app/CaseList'
import ActiveCase from './pages/app/ActiveCase'
import Escalations from './pages/app/Escalations'
import Approvals from './pages/app/Approvals'
import Radar from './pages/app/Radar'
import Testing from './pages/app/Testing'
import Admin from './pages/app/Admin'
import Status from './pages/app/Status'

export const routers = [
  { path: '/', name: 'landing', element: <Index /> },
  { path: '/login', name: 'login', element: <Login /> },
  { path: '/app', name: 'command-center', element: <CommandCenter /> },
  { path: '/app/cases', name: 'case-list', element: <CaseList /> },
  { path: '/app/cases/:caseId', name: 'active-case', element: <ActiveCase /> },
  { path: '/escalations', name: 'escalations', element: <Escalations /> },
  { path: '/approvals', name: 'approvals', element: <Approvals /> },
  { path: '/radar', name: 'radar', element: <Radar /> },
  { path: '/testing', name: 'testing', element: <Testing /> },
  { path: '/admin', name: 'admin', element: <Admin /> },
  { path: '/status', name: 'status', element: <Status /> },
  { path: '/terms', name: 'terms', element: <Terms /> },
  { path: '/privacy', name: 'privacy', element: <Privacy /> },
  { path: '/error', name: 'error', element: <ErrorPage /> },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  { path: '*', name: '404', element: <NotFound /> },
]

declare global {
  interface Window {
    __routers__: typeof routers
  }
}

window.__routers__ = routers
