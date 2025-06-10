import { StatusBar } from "@/components/layout/header";
import { AnatomyVisualization } from "@/components/dashboard/anatomy-visualization";
import { WorkoutLogger } from "@/components/dashboard/workout-logger";
import { ProgressAnalytics } from "@/components/dashboard/progress-analytics";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <StatusBar />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
          {/* Anatomy visualization takes 2/5ths width on extra large screens, full width on smaller */}
          {/* Make it stretch to fill height if possible, or define a fixed aspect ratio */}
          <div className="xl:col-span-2 flex">
            <AnatomyVisualization />
          </div>
          
          {/* Logger and Analytics take 3/5ths width, stacked, also stretching */}
          <div className="xl:col-span-3 space-y-6 flex flex-col">
            <div className="flex-1 flex">
              <WorkoutLogger />
            </div>
            <div className="flex-1 flex">
              <ProgressAnalytics />
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/40">
        Gymzy &copy; {new Date().getFullYear()} - Train Smarter.
      </footer>
    </div>
  );
}
