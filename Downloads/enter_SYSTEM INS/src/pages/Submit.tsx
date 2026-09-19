import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2, ArrowRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCustomers, useSubmitCase } from '@/lib/resolvesphereApi'

const categories = ['Billing', 'Order', 'Technical', 'Account', 'Other']

const Submit = () => {
  const navigate = useNavigate()
  const { data: customerData } = useCustomers()
  const submit = useSubmitCase()
  const [form, setForm] = useState({ customer_id: '', customer_name: '', customer_email: '', reference_id: '', category: 'Billing', complaint: '' })

  const customers = customerData?.customers ?? []
  const disabled = !form.customer_id || form.complaint.trim().length < 10 || submit.isPending

  const onSelectCustomer = (id: string) => {
    const match = customers.find((c) => c.customer_id === id)
    setForm((prev) => ({ ...prev, customer_id: id, customer_name: match?.name ?? '', customer_email: match?.email ?? '' }))
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    submit.mutate(
      { ...form, complaint: form.complaint.trim(), reference_id: form.reference_id.trim() || undefined },
      { onSuccess: (data) => navigate(`/app/cases/${data.result.case_id}`) }
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <header className="relative z-10 border-b bg-card/80 backdrop-blur-sm px-5 py-3.5">
        <Link to="/" className="mx-auto flex max-w-3xl items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight">
            ResolveSphere <span className="gradient-text">AI</span>
          </span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Submit a Request</h1>
            <p className="text-sm text-muted-foreground">We check order, payment, and refund records before replying.</p>
          </div>
        </div>

        <form className="card-elevated rounded-2xl border bg-card p-6 animate-slide-up" onSubmit={onSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer" className="text-sm font-medium">Customer account</Label>
              <select
                id="customer"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.customer_id}
                onChange={(e) => onSelectCustomer(e.target.value)}
                required
              >
                <option value="">Select an account</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name ?? c.customer_id} ({c.customer_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                placeholder="you@example.com"
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-sm font-medium">Order / payment reference</Label>
              <Input
                id="reference"
                value={form.reference_id}
                onChange={(e) => setForm({ ...form, reference_id: e.target.value })}
                placeholder="PAY-7001, ORD-5001, REF-9002"
                className="h-10 rounded-lg font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <select
                id="category"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-1.5">
            <Label htmlFor="complaint" className="text-sm font-medium">What happened?</Label>
            <Textarea
              id="complaint"
              rows={5}
              value={form.complaint}
              onChange={(e) => setForm({ ...form, complaint: e.target.value })}
              placeholder="Describe the issue in detail, including any amounts, dates, or relevant context."
              className="rounded-lg resize-none text-sm leading-relaxed"
              required
            />
            <p className="text-xs text-muted-foreground">
              {form.complaint.trim().length}/10 characters minimum{' '}
              {form.complaint.trim().length >= 10 && <span className="text-emerald-500">✓</span>}
            </p>
          </div>

          {submit.isError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
              We could not open your request just now. Please try again in a moment.
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-5">
            <Button
              type="submit"
              disabled={disabled}
              className="gap-2 rounded-xl shadow-sm shadow-primary/20 transition-smooth hover:shadow-md"
            >
              {submit.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" />Opening your case...</>
                : <><ArrowRight className="h-4 w-4" />Submit request</>
              }
            </Button>
            <Button asChild type="button" variant="outline" className="rounded-xl">
              <Link to="/app">Open support workspace</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Submit
