'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const faqs = [
  {
    id: 'what-is-commun',
    question: 'What is Commun and what makes it different?',
    answer:
      'Commun is a unified productivity and work-management SaaS platform that brings tasks, projects, meeting notes, institutional knowledge, and structured learning workflows into one cohesive workspace. Unlike fragmented tools or superficial social feeds, Commun focuses strictly on structured organization, team coordination, and meaningful output.',
  },
  {
    id: 'who-is-it-for',
    question: 'Who is Commun designed for?',
    answer:
      'Commun is built for corporate teams, business managers, learning and development leaders, individual professionals, and students. Any group or professional seeking to organize complex deliverables, preserve institutional knowledge, and track skill growth will benefit from Commun.',
  },
  {
    id: 'data-privacy-security',
    question: 'How does Commun safeguard organization and user data?',
    answer:
      'Data security and confidentiality are foundational. Commun enforces database-level row-level security (RLS), multi-tenant workspace isolation, end-to-end transport encryption, and strict role-based access controls. Customer workspace data is never mixed or shared across organizational boundaries.',
  },
  {
    id: 'meeting-notes-tasks',
    question: 'How do meeting notes connect to task management?',
    answer:
      'During meetings, action items and decisions can be designated with explicit assignees, due dates, and sprint milestones directly inside the notes. These action items instantly propagate to project boards, preventing dropped context and lost deliverables.',
  },
  {
    id: 'learning-tracks',
    question: 'What are structured learning tracks?',
    answer:
      'Learning tracks enable organizations and individuals to define structured curriculums, employee onboarding milestones, or technical certification roadmaps alongside daily deliverables. Progress is tracked systematically without disrupting regular work.',
  },
  {
    id: 'migration-import',
    question: 'Can teams import existing data from other tools?',
    answer:
      'Migration utilities for markdown documentation, task boards, and team directories are planned for upcoming phases. Complete import formats and automated onboarding scripts: Details coming soon.',
  },
  {
    id: 'mobile-offline',
    question: 'Is there a native mobile app or offline mode available?',
    answer:
      'Commun provides a fully responsive, mobile-optimized web application across iOS and Android browsers today. Native mobile applications and offline local synchronization capabilities: Details coming soon.',
  },
]

export function FaqSection() {
  return (
    <section className="py-20 md:py-32" id="faq">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Answers & Clarity
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Everything you need to know about Commun’s product vision, security architecture,
            and operational workflows.
          </p>
        </div>

        <Accordion type="single" defaultValue="what-is-commun" className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

