import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
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
      <header className="border-b bg-card px-5 py-4">
        <Link to="/" className="mx-auto flex max-w-3xl items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">ResolveSphere AI</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <h1 className="text-xl font-semibold">Submit a request</h1>
        <p className="mt-1 text-sm text-muted-foreground">We check your order, payment, and refund records before replying.</p>

        <form className="mt-6 space-y-4 rounded-lg border bg-card p-5" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer account</Label>
              <select
                id="customer"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.customer_id}
                onChange={(e) => onSelectCustomer(e.target.value)}
                required
              >
                <option value="">Select an account</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>{c.name ?? c.customer_id} ({c.customer_id})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Order / payment reference</Label>
              <Input id="reference" value={form.reference_id} onChange={(e) => setForm({ ...form, reference_id: e.target.value })} placeholder="PAY-7001, ORD-5001, REF-9002" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select id="category" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complaint">What happened?</Label>
            <Textarea id="complaint" rows={5} value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} placeholder="Describe the issue, including any amounts or dates." required />
          </div>

          {submit.isError && (
            <p className="text-sm text-destructive">We could not open your request just now. Please try again in a moment.</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={disabled}>{submit.isPending ? 'Opening your case...' : 'Submit request'}</Button>
            <Button asChild type="button" variant="outline"><Link to="/app">Open support workspace</Link></Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Submit
