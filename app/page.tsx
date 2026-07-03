import { PaperSessionProvider } from "@/components/providers/paper-session"
import { AppRoot } from "@/components/workspace/app-root"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function Page() {
  return (
    <PaperSessionProvider>
      <TooltipProvider delayDuration={200}>
        <AppRoot />
      </TooltipProvider>
    </PaperSessionProvider>
  )
}
