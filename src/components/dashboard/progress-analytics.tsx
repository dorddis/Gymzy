
"use client";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, TrendingUp, AlertTriangleIcon } from "lucide-react";
import Image from "next/image";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart as RechartsBarChart, Cell } from "recharts";
import { useWorkout } from "@/contexts/WorkoutContext";
import { Muscle, MAJOR_MUSCLE_GROUPS, MUSCLE_VOLUME_THRESHOLDS } from "../../../home/user/studio/src/lib/constants";

const initialChartConfig = {
  CHEST: { label: "Chest", color: "hsl(var(--primary))" },
  BACK: { label: "Back", color: "hsl(var(--accent))" },
  SHOULDERS: { label: "Shoulders", color: "hsl(var(--chart-3))" },
  LEGS: { label: "Legs", color: "hsl(var(--chart-4))" },
  ARMS: { label: "Arms", color: "hsl(var(--chart-5))" },
  CORE: { label: "Core", color: "hsl(var(--foreground))" }
} satisfies ChartConfig;


export function ProgressAnalytics() {
  const { muscleVolumes } = useWorkout();

  const aggregatedVolumes = useMemo(() => {
    const data: { group: string; volume: number }[] = [];
    let newChartConfig = { ...initialChartConfig };

    for (const groupName in MAJOR_MUSCLE_GROUPS) {
      const musclesInGroup = MAJOR_MUSCLE_GROUPS[groupName as keyof typeof MAJOR_MUSCLE_GROUPS];
      let totalVolumeForGroup = 0;
      musclesInGroup.forEach(muscle => {
        totalVolumeForGroup += muscleVolumes[muscle] || 0;
      });
      data.push({ group: groupName, volume: Math.round(totalVolumeForGroup) });
      
      if (!newChartConfig[groupName as keyof typeof initialChartConfig]) {
        // Assign a new color if group is not in initial config (should not happen with current setup)
        const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))"];
        newChartConfig[groupName as keyof typeof initialChartConfig] = {
          label: groupName.charAt(0).toUpperCase() + groupName.slice(1).toLowerCase(),
          color: chartColors[Object.keys(newChartConfig).length % chartColors.length]
        };
      }
    }
    return { chartData: data, chartConfig: newChartConfig };
  }, [muscleVolumes]);
  
  const { chartData, chartConfig } = aggregatedVolumes;

  const chestVolume = MAJOR_MUSCLE_GROUPS.CHEST.reduce((acc, muscle) => acc + (muscleVolumes[muscle] || 0), 0);
  const isChestOvertrained = chestVolume > MUSCLE_VOLUME_THRESHOLDS.HIGH;

  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Progress & Recovery</CardTitle>
        </div>
        <CardDescription>Track total muscle group training volume and get personalized alerts.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-6 p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> Training Volume by Muscle Group</h3>
          {chartData.every(d => d.volume === 0) ? (
             <div className="p-4 bg-muted/50 rounded-md text-center text-muted-foreground border border-border min-h-[200px] flex items-center justify-center">
                <p>Log some workouts to see your training volume here!</p>
             </div>
          ) : (
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-video">
              <RechartsBarChart accessibilityLayer data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  dataKey="group" 
                  type="category" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="dashed" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="volume" layout="vertical" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                     <Cell key={`cell-${entry.group}`} fill={chartConfig[entry.group as keyof typeof chartConfig]?.color || 'hsl(var(--muted))'} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ChartContainer>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center"> Muscle Heatmap (Placeholder)</h3>
          <div className="p-4 bg-muted/50 rounded-md text-center text-muted-foreground border border-border">
            <p className="mb-2">Heatmap visualization coming soon to show muscle activation distribution based on your logged workouts.</p>
            <Image 
              src="https://placehold.co/300x150.png" 
              alt="Heatmap Placeholder" 
              width={300} 
              height={150} 
              className="mx-auto mt-2 rounded-md shadow-md"
              data-ai-hint="heatmap data"
            />
          </div>
        </div>

        {isChestOvertrained && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive-foreground">
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive font-semibold">Recovery Alert!</AlertTitle>
            <AlertDescription className="text-destructive/90">
              Your cumulative chest muscle volume ({Math.round(chestVolume)}) is high. Consider a rest day for chest or focus on other muscle groups.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
