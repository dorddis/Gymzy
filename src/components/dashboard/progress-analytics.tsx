"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, TrendingUp, AlertTriangleIcon } from "lucide-react";
import Image from "next/image";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart as RechartsBarChart } from "recharts";

const chartData = [
  { month: "Jan", chestVolume: 186, backVolume: 80 },
  { month: "Feb", chestVolume: 305, backVolume: 200 },
  { month: "Mar", chestVolume: 237, backVolume: 120 },
  { month: "Apr", chestVolume: 173, backVolume: 190 },
  { month: "May", chestVolume: 209, backVolume: 130 },
  { month: "Jun", chestVolume: 214, backVolume: 140 },
];

const chartConfig = {
  chestVolume: { label: "Chest Volume", color: "hsl(var(--primary))" },
  backVolume: { label: "Back Volume", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

export function ProgressAnalytics() {
  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Progress & Recovery</CardTitle>
        </div>
        <CardDescription>Track muscle-specific training volume and get personalized alerts.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-6 p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> Training Volume</h3>
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-video">
            <RechartsBarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="dashed" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="chestVolume" fill="var(--color-chestVolume)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="backVolume" fill="var(--color-backVolume)" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ChartContainer>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center"> Muscle Heatmap (Placeholder)</h3>
          <div className="p-4 bg-muted/50 rounded-md text-center text-muted-foreground border border-border">
            <p className="mb-2">Heatmap visualization coming soon to show muscle activation distribution.</p>
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

        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive-foreground">
          <AlertTriangleIcon className="h-5 w-5 text-destructive" />
          <AlertTitle className="text-destructive font-semibold">Recovery Alert!</AlertTitle>
          <AlertDescription className="text-destructive/90">
            Your chest muscles might be overtrained. Consider a rest day or focus on other muscle groups.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
