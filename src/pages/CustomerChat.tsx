import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Send, User, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCustomers, useCustomerCases, useAnswerQuestion, useSubmitCase } from '@/lib/resolvesphereApi'
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

const helperButtons = [
  { label: 'Missing order', text: 'My order has not arrived and I was charged.' },
  { label: 'Payment issue', text: 'I was charged but the order failed.' },
  { label: 'Refund status', text: 'I have not received my refund yet.' },
  { label: 'Talk to human', text: 'I would like to speak with a human agent.' },
]

const CustomerChat = () => {
  const navigate = useNavigate()
  const { data: customerData, isLoading: customersLoading } = useCustomers()
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: casesData } = useCustomerCases(selectedCustomer || undefined)
  const answerQuestion = useAnswerQuestion()
  const submitCase = useSubmitCase()

  const customers = customerData?.customers ?? []
  const cases = casesData?.cases ?? []
  const activeCase = cases.find((c) => c.case_id === activeCaseId)

  useEffect(() => {
    if (activeCase) {
      const initialMessages: Message[] = [
        { id: '1', role: 'assistant', content: `Hello! I'm looking into your case ${activeCase.case_id}. I can see you reported: "${activeCase.raw_complaint}"`, timestamp: new Date().toISOString() },
      ]
      if (activeCase.customer_response) {
        initialMessages.push({ id: '2', role: 'assistant', content: activeCase.customer_response, timestamp: new Date().toISOString() })
      }
      if (activeCase.status === 'EVIDENCE_GAP') {
        initialMessages.push({ id: '3', role: 'assistant', content: 'To continue investigating, I need one detail from you. Could you share your order or payment reference number?', timestamp: new Date().toISOString() })
      }
      setMessages(initialMessages)
    } else {
      setMessages([])
    }
  }, [activeCaseId, activeCase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text: string) => {
    if (!text.trim() || !selectedCustomer) return
    const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    if (!activeCaseId) {
      submitCase.mutate(
        { customer_id: selectedCustomer, complaint: text.trim(), category: 'Billing' },
        {
          onSuccess: (data) => {
            setActiveCaseId(data.result.case_id)
            setIsTyping(false)
            setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: `Thank you. I've opened case ${data.result.case_id} and assigned it to ${data.result.specialist}. We're investigating your issue now.`, timestamp: new Date().toISOString() }])
          },
          onError: () => {
            setIsTyping(false)
            setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'I encountered an error opening your case. Please try again.', timestamp: new Date().toISOString() }])
          },
        }
      )
    } else if (activeCase?.status === 'EVIDENCE_GAP') {
      answerQuestion.mutate(
        { customer_id: selectedCustomer, answer: text.trim() },
        {
          onSuccess: () => {
            setIsTyping(false)
            setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Thank you for that information. I\'m passing this to our specialist who will review your case and follow up shortly.', timestamp: new Date().toISOString() }])
          },
          onError: () => {
            setIsTyping(false)
            setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'I had trouble recording your answer. Please try again.', timestamp: new Date().toISOString() }])
          },
        }
      )
    } else {
      setIsTyping(false)
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Your message has been received. A specialist will review and respond within 24 hours.', timestamp: new Date().toISOString() }])
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = { NEW: 'Opened', ROUTED: 'Assigned', INVESTIGATING: 'Investigating', EVIDENCE_GAP: 'Waiting for your reply', RESOLVED: 'Resolved', ESCALATED: 'Escalated to specialist' }
    return map[status] ?? status
  }

  if (!selectedCustomer) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b bg-card px-5 py-4">
          <Link to="/" className="mx-auto flex max-w-3xl items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">ResolveSphere AI</span>
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5">
          <div className="w-full space-y-4 rounded-lg border bg-card p-6">
            <h1 className="text-lg font-semibold">Customer Support</h1>
            <p className="text-sm text-muted-foreground">Select your account to start a conversation.</p>
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
              <option value="">Select account</option>
              {customersLoading && <option value="" disabled>Loading accounts...</option>}
              {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.name ?? c.customer_id}</option>)}
            </select>
            {customersLoading && <p className="text-xs text-muted-foreground">Loading customer accounts...</p>}
            {!customersLoading && customers.length === 0 && <p className="text-xs text-destructive">No customer accounts available. Please check backend connection.</p>}
            <p className="text-xs text-muted-foreground">Demo environment — synthetic accounts only.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-5 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">ResolveSphere</span>
          </Link>
          <div className="flex items-center gap-3">
            <CustomerAvatar id={selectedCustomer} name={customers.find((c) => c.customer_id === selectedCustomer)?.name} size="sm" />
            <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(''); setActiveCaseId(null) }}>Switch account</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-4">
        {!activeCaseId ? (
          <div className="flex flex-1 flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Your cases</h2>
              <p className="text-sm text-muted-foreground">Select a case to continue the conversation or start a new one.</p>
            </div>
            {cases.length === 0 ? (
              <div className="flex-1 rounded-lg border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No cases yet. Describe your issue below to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((c) => (
                  <button key={c.case_id} onClick={() => setActiveCaseId(c.case_id)} className="w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/40">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.case_id}</span>
                      <span className="text-xs text-muted-foreground">{getStatusText(c.status)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.raw_complaint}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-lg border bg-card p-4">
              <p className="mb-2 text-sm font-medium">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {helperButtons.map((btn) => (
                  <Button key={btn.label} variant="outline" size="sm" onClick={() => handleSend(btn.text)}>{btn.label}</Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between rounded-lg border bg-card px-4 py-2">
              <div>
                <p className="text-sm font-medium">{activeCase?.case_id}</p>
                <p className="text-xs text-muted-foreground">{getStatusText(activeCase?.status ?? '')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveCaseId(null)}>Back to cases</Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-card p-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <Bot className="mt-1 h-5 w-5 shrink-0 text-primary" />}
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p>{msg.content}</p>
                    <p className="mt-1 text-[10px] opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                  {msg.role === 'user' && <User className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2">
                  <Bot className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Typing...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-3 space-y-2">
              {activeCase?.status === 'EVIDENCE_GAP' && (
                <div className="rounded-lg border border-warning/50 bg-warning/5 p-3 text-sm">
                  <p className="font-medium text-warning">We need one detail from you</p>
                  <p className="mt-1 text-xs text-muted-foreground">Please share your order or payment reference so we can continue investigating.</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {helperButtons.map((btn) => (
                  <Button key={btn.label} variant="outline" size="sm" onClick={() => handleSend(btn.text)}>{btn.label}</Button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input) }} className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="flex-1" />
                <Button type="submit" disabled={!input.trim() || isTyping}><Send className="h-4 w-4" /></Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CustomerChat
