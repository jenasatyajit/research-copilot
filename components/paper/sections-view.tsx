"use client"

import { KeyRoundIcon, ListTreeIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { Markdown } from "@/components/shared/markdown"
import { LoadError } from "@/components/shared/load-error"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SectionsView() {
  const { sections, retrySections } = usePaperSession()
  const data = sections.data ?? []

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-3.5">
        <div className="flex items-center gap-2">
          <ListTreeIcon className="size-4 text-primary" />
          <CardTitle className="text-sm font-medium">Section by section</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {sections.status === "error" && sections.error ? (
          <div className="p-3">
            <LoadError error={sections.error} onRetry={retrySections} />
          </div>
        ) : sections.status === "done" && data.length > 0 ? (
          <Accordion type="multiple" defaultValue={data.map((s) => s.sectionId)}>
            {data.map((section) => (
              <AccordionItem
                key={section.sectionId}
                value={section.sectionId}
                id={`sec-${section.sectionId}`}
                className="scroll-mt-4 border-b-0 px-3 not-last:border-b not-last:border-border/60"
              >
                <AccordionTrigger className="py-3.5 text-left text-sm font-medium hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 pb-4">
                  <Markdown>{section.explanation}</Markdown>
                  {section.keyTakeaway ? (
                    <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
                      <KeyRoundIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <p className="text-sm text-foreground/90">
                        <span className="font-medium">Takeaway: </span>
                        {section.keyTakeaway}
                      </p>
                    </div>
                  ) : null}
                  {section.whyItMatters ? (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">Why it matters: </span>
                      {section.whyItMatters}
                    </p>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
