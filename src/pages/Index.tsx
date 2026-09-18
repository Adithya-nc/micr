import { Link } from 'react-router-dom'
import { LandingHeader, LandingSection } from '@/components/resolvesphere/LandingHeader'
import { PrinciplePanel } from '@/components/resolvesphere/PrinciplePanel'
import { ArchitectureBoundaryPanel } from '@/components/resolvesphere/ArchitectureBoundaryPanel'
import { DemoScenarioPanel } from '@/components/resolvesphere/DemoScenarioPanel'
import { BackendStatusPanel } from '@/components/resolvesphere/BackendStatusPanel'
import { FooterBar } from '@/components/resolvesphere/FooterBar'
import { Button } from '@/components/ui/button'

const scenarios = [
  { name: 'Scenario 1: Autonomous Success', description: 'Successful payment with a missing order triggers an autonomous, verified refund.' },
  { name: 'Scenario 2: Evidence Gap', description: 'Ambiguous refund evidence triggers one targeted customer question.' },
  { name: 'Scenario 3: Contradiction / Human Escalation', description: 'Conflicting refund status across systems blocks autonomy and escalates.' },
  { name: 'Scenario 4: Systemic Root-Cause Detection', description: 'Recurring order failures correlate with a deployment event as an incident candidate.' },
]

const entryLinks = [
  { label: 'Open Command Center', to: '/app' },
  { label: 'View Backend Status', to: '/status' },
  { label: 'View Escalations', to: '/escalations' },
  { label: 'View Approvals', to: '/approvals' },
  { label: 'View Root-Cause Radar', to: '/radar' },
  { label: 'View Testing / Admin', to: '/testing' },
]

const Index = () => (
  <div className="min-h-screen bg-background">
    <LandingHeader />
    <LandingSection id="overview" eyebrow="Product Statement" title="ResolveSphere AI">
      <p className="text-sm font-medium text-muted-foreground">Autonomous Case Resolution for Enterprise Support</p>
      <p className="mt-3 text-base font-semibold">DON'T ANSWER THE TICKET. RESOLVE THE CASE.</p>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        ResolveSphere reconstructs customer cases, investigates evidence, applies policy and risk controls, executes approved actions, and verifies the resulting state.
      </p>
    </LandingSection>
    <LandingSection eyebrow="Operating Principles" title="How ResolveSphere behaves">
      <PrinciplePanel />
    </LandingSection>
    <LandingSection id="architecture" eyebrow="Architecture Boundary" title="Who is responsible for what">
      <ArchitectureBoundaryPanel />
    </LandingSection>
    <LandingSection id="scenarios" eyebrow="Demo Scenarios" title="Four evaluated case paths">
      <div className="grid gap-4 sm:grid-cols-2">
        {scenarios.map((scenario) => (
          <DemoScenarioPanel key={scenario.name} name={scenario.name} description={scenario.description} to="/status" />
        ))}
      </div>
    </LandingSection>
    <LandingSection eyebrow="Backend Status" title="What is actually connected right now">
      <BackendStatusPanel />
    </LandingSection>
    <LandingSection eyebrow="App Entry" title="Open the workspace">
      <div className="flex flex-wrap gap-3">
        {entryLinks.map((link) => (
          <Button key={link.to} asChild variant="outline">
            <Link to={link.to}>{link.label}</Link>
          </Button>
        ))}
      </div>
    </LandingSection>
    <FooterBar />
  </div>
)

export default Index
