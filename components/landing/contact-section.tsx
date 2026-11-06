'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = 'Please enter your name.'
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Please provide a valid work email address.'
    }
    if (!formData.organization.trim()) {
      errs.organization = 'Please specify your company or organization.'
    }
    if (!formData.subject.trim()) errs.subject = 'Please enter a subject.'
    if (!formData.message.trim() || formData.message.length < 10) {
      errs.message = 'Please provide a message with at least 10 characters.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    // Honest phase boundary: backend endpoint not connected yet
    setSubmitted(true)
  }

  return (
    <section className="py-20 md:py-32 border-t border-border/80 bg-surface/30" id="contact">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Get In Touch
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Connect with the Commun Team
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Have questions about enterprise deployment, workspace capabilities, or our pilot program?
            Reach out directly.
          </p>
        </div>

        <Card className="p-6 sm:p-10 border-border bg-card shadow-2xl">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto size-12 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-foreground">Thank you for your interest!</h3>
              <p className="text-sm text-muted max-w-md mx-auto">
                Your message has been captured locally. Live backend inquiry submission will be activated
                in upcoming phases as enterprise services are finalized.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitted(false)
                  setFormData({ name: '', email: '', organization: '', subject: '', message: '' })
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  id="contact-name"
                  placeholder="Elena Rostova"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                />
                <Input
                  label="Work Email"
                  id="contact-email"
                  type="email"
                  placeholder="elena@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Organization / Company"
                  id="contact-organization"
                  placeholder="Acme Global Inc."
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  error={errors.organization}
                  required
                />
                <Input
                  label="Subject"
                  id="contact-subject"
                  placeholder="Inquiry about Team Workspaces"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  error={errors.subject}
                  required
                />
              </div>

              <Textarea
                label="Message"
                id="contact-message"
                placeholder="Tell us about your team size, workflow requirements, or questions..."
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                error={errors.message}
                required
              />

              {/* Honest Backend Availability Notice */}
              <div className="rounded-xl border border-border/80 bg-surface/70 p-3.5 flex items-start gap-3">
                <span className="text-accent text-sm mt-0.5">ℹ</span>
                <p className="text-xs text-muted leading-relaxed">
                  <strong className="text-foreground">Phase 1 Preview Notice:</strong> Public contact submission
                  validation is currently operational on the client. Durable database ingestion endpoints
                  will be deployed during Phase 3.
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto px-8 font-bold">
                Submit Inquiry
              </Button>
            </form>
          )}
        </Card>
      </div>
    </section>
  )
}

