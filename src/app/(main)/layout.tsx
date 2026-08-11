import { completionStreak } from "@/db/queries";
import { getOwnerId } from "@/lib/auth";
import { Sidebar, MobileHeader } from "@/components/chrome";
import { AmbientSoundscapePlayer } from "@/components/ambient-soundscape";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const ownerId = await getOwnerId();
  const streak = await completionStreak(ownerId);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-bg text-ink">
      <Sidebar streak={streak} />
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <MobileHeader />
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-2 flex justify-end">
          <AmbientSoundscapePlayer />
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-4 md:py-6">
          {children}
        </div>
      </div>
      
      {/* Floating Action Button (Add Task / Focus) */}
      <Link
        href="/focus"
        title="Start Focus Session"
        className="fixed bottom-6 right-6 md:right-12 size-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all backdrop-blur-md z-50 group border border-white/20"
      >
        <Plus className="size-7 group-hover:rotate-90 transition-transform duration-300" />
      </Link>
    </div>
  );
}

