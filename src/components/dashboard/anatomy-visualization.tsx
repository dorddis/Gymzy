'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import type { Mesh } from 'three';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Scan } from "lucide-react";

function ModelPlaceholder() {
  const meshRef = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Box ref={meshRef} args={[1.5, 2.5, 1.5]} position={[0, 0.25, 0]}>
      <meshStandardMaterial color="hsl(var(--primary))" />
    </Box>
  );
}

export function AnatomyVisualization() {
  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Interactive Anatomy</CardTitle>
        </div>
        <CardDescription>Visualize muscle engagement. Interact with the 3D model placeholder below.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4] max-w-xs sm:max-w-sm md:max-w-md mb-4 rounded-lg overflow-hidden bg-muted/50 border border-border">
          <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={2} />
            <directionalLight position={[-5, 5, 5]} intensity={1} />
            <ModelPlaceholder />
            <OrbitControls enableZoom={true} enablePan={true} />
          </Canvas>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" aria-label="Rotate Left" className="transition-transform hover:scale-110 active:scale-95" disabled>
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Rotate Right" className="transition-transform hover:scale-110 active:scale-95" disabled>
            <RotateCw className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Zoom In" className="transition-transform hover:scale-110 active:scale-95" disabled>
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Zoom Out" className="transition-transform hover:scale-110 active:scale-95" disabled>
            <ZoomOut className="w-5 h-5" />
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground px-2">
          Use mouse/touch to rotate and zoom the model. Panel buttons are for future enhancements.
        </p>
      </CardContent>
    </Card>
  );
}
