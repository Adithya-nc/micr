import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Send, User, Bot, ArrowLeft, Sparkles, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth'
import { useCustomerCases, useAnswerQuestion, useSubmitCase } from '@/lib/resolvesphereApi'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const quickActions = [
  { label: 'Missing Order', text: 'My order has not arrived and I was charged.', category: 'Order' },
  { label: 'Payment Issue', text: 'I was charged but the order failed.', category: 'Billing' },
  { label: 'Refund Status', text: 'I have not received my refund yet.', category: 'Billing' },
  { label: 'Talk to Human', text: 'I would like to speak with a human agent.', category: 'Other' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Opened', color: 'text-blue-500' },
  ROUTED: { label: 'Assigned', color: 'text-violet-500' },
  INVESTIGATING: { label: 'Investigating', color: 'text-amber-500' },
  EVIDENCE_GAP: { label: 'Waiting for your reply', color: 'text-orange-500' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-500' },
  ESCALATED: { label: 'Escalated to specialist', color: 'text-red-500' },
}

const CustomerChat = () => {
  const navigate = useNavigate()
  const { user, customerId, signOut } = useAuth()
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Billing')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: casesData, refetch: refetchCases } = useCustomerCases(customerId ?? undefined)
  const answerQuestion = useAnswerQuestion()
  const submitCase = useSubmitCase()

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
    if (!text.trim() || !customerId) return
    const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    if (!activeCaseId) {
      submitCase.mutate(
        { customer_id: customerId, complaint: text.trim(), category: selectedCategory },
        {
          onSuccess: (data) => {
            setActiveCaseId(data.result.case_id)
            setIsTyping(false)
            refetchCases()
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
        { customer_id: customerId, answer: text.trim() },
        {
          onSuccess: () => {
            setIsTyping(false)
            refetchCases()
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access customer support</p>
          <Button asChild><Link to="/login">Sign in</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-sm px-5 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">
              ResolveSphere <span className="gradient-text">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut} className="rounded-lg text-xs">Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-4">
        {!activeCaseId ? (
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Your Support Cases</h2>
                <p className="text-sm text-muted-foreground">Select a case or start a new conversation.</p>
              </div>
            </div>

            {cases.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border bg-card py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">No cases yet</h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Describe your issue below to get started. Our AI will investigate it immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((c) => {
                  const st = statusMap[c.status] ?? { label: c.status, color: 'text-muted-foreground' }
                  return (
                    <button
                      key={c.case_id}
                      onClick={() => setActiveCaseId(c.case_id)}
                      className="w-full rounded-xl border bg-card p-4 text-left transition-smooth hover:bg-muted/40 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-primary">{c.case_id}</span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${st.color}`}>
                          <Clock className="h-3 w-3" />
                          {st.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{c.raw_complaint}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Quick actions + input for new case */}
            <div className="mt-auto rounded-2xl border bg-card p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {quickActions.map((btn) => (
                  <Button
                    key={btn.label}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => { setInput(btn.text); setSelectedCategory(btn.category) }}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input) }} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your issue... (Enter to send)"
                  className="flex-1 min-h-[60px] rounded-xl resize-none text-sm"
                  rows={2}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="self-end rounded-xl h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            {/* Case header */}
            <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setActiveCaseId(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="font-mono text-xs font-semibold text-primary">{activeCase?.case_id}</p>
                  <p className={`text-xs ${statusMap[activeCase?.status ?? '']?.color ?? 'text-muted-foreground'}`}>
                    {statusMap[activeCase?.status ?? '']?.label ?? activeCase?.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                AI-assisted
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border bg-card p-4" style={{ minHeight: 0, maxHeight: '60vh' }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm bg-muted'
                      }`}
                  >
                    <p>{msg.content}</p>
                    <p className="mt-1 text-[10px] opacity-60 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                    <span className="flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="space-y-2">
              {activeCase?.status === 'EVIDENCE_GAP' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">We need one detail from you</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Please share your order or payment reference so we can continue investigating.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {quickActions.map((btn) => (
                  <Button
                    key={btn.label}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => { setInput(btn.text); setSelectedCategory(btn.category) }}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input) }} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 min-h-[60px] rounded-xl resize-none text-sm"
                  rows={2}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="self-end rounded-xl h-10 w-10 p-0 shadow-sm shadow-primary/20"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CustomerChat
