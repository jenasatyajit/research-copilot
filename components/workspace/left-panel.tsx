"use client"

import { ConceptsList } from "@/components/workspace/concepts-list"
import { Notes } from "@/components/workspace/notes"
import { Outline } from "@/components/workspace/outline"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function LeftPanel() {
  return (
    <Tabs
      defaultValue="outline"
      className="flex h-full flex-col gap-0 bg-sidebar"
    >
      <div className="flex h-14 shrink-0 items-center border-b px-2">
        <TabsList className="w-full">
          <TabsTrigger value="outline" className="flex-1 text-xs">
            Outline
          </TabsTrigger>
          <TabsTrigger value="concepts" className="flex-1 text-xs">
            Concepts
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1 text-xs">
            Notes
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="min-h-0 flex-1">
        <TabsContent value="outline" className="h-full">
          <ScrollArea className="scroll-thin h-full">
            <Outline />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="concepts" className="h-full">
          <ScrollArea className="scroll-thin h-full">
            <ConceptsList />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="notes" className="h-full">
          <Notes />
        </TabsContent>
      </div>
    </Tabs>
  )
}
