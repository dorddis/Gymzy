
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dumbbell, CheckCircle, Activity } from "lucide-react";
import { useWorkout } from "@/contexts/WorkoutContext";
import { EXERCISES } from "../../../home/user/studio/src/lib/constants";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const workoutSchema = z.object({
  exerciseId: z.string().min(1, { message: "Please select an exercise." }),
  sets: z.coerce.number().min(1, { message: "Min 1 set."}).max(100, {message: "Max 100 sets."}),
  reps: z.coerce.number().min(1, { message: "Min 1 rep."}).max(100, {message: "Max 100 reps."}),
  weight: z.coerce.number().min(0, { message: "Min 0 weight."}).max(1000, {message: "Max 1000 weight."}),
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;

export function WorkoutLogger() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { toast } = useToast();
  const { addWorkout, getExerciseById } = useWorkout();

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      exerciseId: "",
      sets: 3,
      reps: 10,
      weight: 0,
    },
  });

  useEffect(() => {
    if (feedback) {
      setShowFeedback(true);
      const timer = setTimeout(() => setShowFeedback(false), 5000); // Feedback visible for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  function onSubmit(data: WorkoutFormValues) {
    addWorkout(data);
    const exercise = getExerciseById(data.exerciseId);
    const exerciseName = exercise ? exercise.name : "Selected exercise";
    
    const primaryMuscles = exercise?.primaryMuscles.join(', ') || 'target muscles';
    const secondaryMuscles = exercise?.secondaryMuscles.join(', ') || '';
    let targetedMusclesString = `Primary: ${primaryMuscles}`;
    if (secondaryMuscles) {
      targetedMusclesString += `; Secondary: ${secondaryMuscles}`;
    }

    setFeedback(`Logged: ${exerciseName}. Targeted: ${targetedMusclesString}. Diagram updated!`);
    toast({
      title: "Workout Logged!",
      description: (
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span>{exerciseName} added successfully.</span>
        </div>
      ),
      duration: 3000,
    });
    
    const randomExercise = EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
    form.reset({ 
        exerciseId: randomExercise.id, 
        sets: Math.floor(Math.random()*3)+2, 
        reps: Math.floor(Math.random()*8)+5, 
        weight: Math.floor(Math.random()*50)+10 
    });
  }

  return (
    <Card className="flex flex-col h-full shadow-xl bg-card hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <CardTitle className="font-headline text-xl">Log Workout</CardTitle>
        </div>
        <CardDescription>Track your exercises and see real-time muscle feedback.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow flex flex-col">
          <CardContent className="space-y-4 p-4 flex-grow">
            <FormField
              control={form.control}
              name="exerciseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select an exercise" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXERCISES.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sets</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3" {...field} className="bg-background/50"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reps</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} className="bg-background/50"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" {...field} className="bg-background/50"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch p-4 pt-2">
            <Button type="submit" className="w-full transition-all duration-150 ease-in-out hover:shadow-lg active:scale-95">
              <Dumbbell className="mr-2 h-5 w-5" /> Log Exercise
            </Button>
            <div className={cn("mt-3 text-sm text-center p-2 rounded-md bg-accent/10 text-accent-foreground transition-opacity duration-500 ease-in-out", showFeedback ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden")}>
              {feedback}
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
