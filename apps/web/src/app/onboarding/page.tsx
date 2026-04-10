'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronRight, ChevronLeft, Users, Layout, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    workspaceName: '',
    workspaceSlug: '',
    invites: [] as string[],
    template: 'kanban'
  })

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const handleFinish = () => {
    // In a real app, we would call the API to create the workspace
    // For now, we'll just redirect to the dashboard
    router.push(`/${formData.workspaceSlug || 'default'}`)
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-8 flex justify-between">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10",
              step >= i ? "bg-accent text-white" : "bg-bg-elevated text-text-tertiary border border-border-subtle"
            )}>
              {step > i ? <Check size={16} /> : i}
            </div>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              step >= i ? "text-text-primary" : "text-text-tertiary"
            )}>
              {i === 1 ? 'Workspace' : i === 2 ? 'Teammates' : 'Template'}
            </span>
            {i < 3 && (
              <div className={cn(
                "absolute top-4 left-[50%] w-full h-[2px] bg-border-subtle -z-0",
                step > i && "bg-accent"
              )} />
            )}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-lg bg-bg-surface border-border-subtle animate-fade-up">
        {step === 1 && (
          <>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-2">
                <Layout size={24} />
              </div>
              <CardTitle>Create your workspace</CardTitle>
              <CardDescription>This is where your team&apos;s projects and issues will live.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Workspace Name</Label>
                <Input 
                  id="name" 
                  placeholder="Acme Corp" 
                  value={formData.workspaceName}
                  onChange={(e) => {
                    const name = e.target.value
                    setFormData(prev => ({ 
                      ...prev, 
                      workspaceName: name,
                      workspaceSlug: name.toLowerCase().replace(/\s+/g, '-')
                    }))
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Workspace URL</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-text-tertiary">lumo.app/</span>
                  <Input 
                    id="slug" 
                    placeholder="acme-corp" 
                    value={formData.workspaceSlug}
                    onChange={(e) => setFormData(prev => ({ ...prev, workspaceSlug: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-2">
                <Users size={24} />
              </div>
              <CardTitle>Invite your team</CardTitle>
              <CardDescription>Collaborate with your teammates to get things done faster.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Team Member Emails</Label>
                <div className="flex gap-2">
                  <Input placeholder="email@example.com" id="email-input" />
                  <Button variant="secondary" onClick={() => {
                    const input = document.getElementById('email-input') as HTMLInputElement
                    if (input.value) {
                      setFormData(prev => ({ ...prev, invites: [...prev.invites, input.value] }))
                      input.value = ''
                    }
                  }}>
                    Add
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.invites.map((email) => (
                  <Badge key={email} variant="secondary" className="px-2 py-1 flex items-center gap-1.5">
                    {email}
                    <button onClick={() => setFormData(prev => ({ ...prev, invites: prev.invites.filter(e => e !== email) }))} className="text-text-tertiary hover:text-red-500">
                      &times;
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-2">
                <Rocket size={24} />
              </div>
              <CardTitle>Choose a template</CardTitle>
              <CardDescription>Select a workflow that fits your team&apos;s style.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                { id: 'kanban', name: 'Kanban', desc: 'Visual board for flow' },
                { id: 'scrum', name: 'Scrum', desc: 'Sprints and backlogs' },
              ].map((t) => (
                <div 
                  key={t.id}
                  onClick={() => setFormData(prev => ({ ...prev, template: t.id }))}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-bg-elevated",
                    formData.template === t.id ? "border-accent bg-accent/5" : "border-border-subtle"
                  )}
                >
                  <span className="block font-bold text-sm text-text-primary">{t.name}</span>
                  <span className="block text-[11px] text-text-tertiary mt-1">{t.desc}</span>
                  {formData.template === t.id && (
                    <div className="mt-2 text-accent flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                      <Check size={12} /> Selected
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </>
        )}

        <CardFooter className="flex justify-between border-t border-border-subtle pt-6">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={step === 1}
          >
            <ChevronLeft size={16} className="mr-2" />
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={nextStep} disabled={step === 1 && !formData.workspaceName}>
              Continue
              <ChevronRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20">
              Get Started
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
