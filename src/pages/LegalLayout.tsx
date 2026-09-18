import { Link } from 'react-router-dom'
import { LandingHeader } from '@/components/resolvesphere/LandingHeader'
import { FooterBar } from '@/components/resolvesphere/FooterBar'

const Legal = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <LandingHeader />
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-5 space-y-3 text-sm text-muted-foreground">{children}</div>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary underline">Back to home</Link>
    </main>
    <FooterBar />
  </div>
)

export default Legal
