import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Submit from './pages/Submit'
import CustomerChat from './pages/CustomerChat'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import ErrorPage from './pages/Error'
import CommandCenter from './pages/app/CommandCenter'
import CaseList from './pages/app/CaseList'
import ActiveCase from './pages/app/ActiveCase'
import Escalations from './pages/app/Escalations'
import Approvals from './pages/app/Approvals'
import KnowledgeBase from './pages/app/KnowledgeBase'
import Analytics from './pages/app/Analytics'
import Settings from './pages/app/Settings'
import Admin from './pages/app/Admin'
import Status from './pages/app/Status'
import Testing from './pages/app/Testing'

export const routers = [
  { path: '/', name: 'landing', element: <Index /> },
  { path: '/login', name: 'login', element: <Login /> },
  { path: '/submit', name: 'submit', element: <Submit /> },
  { path: '/chat', name: 'customer-chat', element: <CustomerChat /> },
  { path: '/app', name: 'dashboard', element: <CommandCenter /> },
  { path: '/app/cases', name: 'case-list', element: <CaseList /> },
  { path: '/app/cases/:caseId', name: 'active-case', element: <ActiveCase /> },
  { path: '/escalations', name: 'escalations', element: <Escalations /> },
  { path: '/approvals', name: 'approvals', element: <Approvals /> },
  { path: '/knowledge', name: 'knowledge', element: <KnowledgeBase /> },
  { path: '/radar', name: 'analytics', element: <Analytics /> },
  { path: '/settings', name: 'settings', element: <Settings /> },
  { path: '/admin', name: 'admin', element: <Admin /> },
  { path: '/admin/backend', name: 'admin-backend', element: <Status /> },
  { path: '/admin/testing', name: 'admin-testing', element: <Testing /> },
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
