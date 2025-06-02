import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Scan } from "lucide-react";

export function AnatomyVisualization() {
  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Interactive Anatomy</CardTitle>
        </div>
        <CardDescription>Visualize your muscle engagement. Rotatable 3D model.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4] max-w-xs sm:max-w-sm md:max-w-md mb-4 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center border border-border">
          <Image
            src="https://placehold.co/600x800.png"
            alt="3D Anatomy Model"
            width={600}
            height={800}
            className="object-contain"
            data-ai-hint="anatomy muscle"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none"></div>
          <p className="absolute bottom-2 left-2 text-[10px] sm:text-xs text-white bg-black/60 px-2 py-1 rounded shadow">
            Color: White (Untrained) to Deep Red (Trained)
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" aria-label="Rotate Left" className="transition-transform hover:scale-110 active:scale-95">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Rotate Right" className="transition-transform hover:scale-110 active:scale-95">
            <RotateCw className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Zoom In" className="transition-transform hover:scale-110 active:scale-95">
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Zoom Out" className="transition-transform hover:scale-110 active:scale-95">
            <ZoomOut className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
