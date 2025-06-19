"use client";

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PROBLEM_TYPES, DIFFICULTIES } from '@/lib/constants';
import type { SolvedProblem, ProblemType, Difficulty } from '@/types';
import { Icons } from '@/components/icons';

const problemFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100),
  type: z.enum(PROBLEM_TYPES.map(pt => pt.value) as [ProblemType, ...ProblemType[]], {
    required_error: "You need to select a problem type.",
  }),
  difficulty: z.enum(DIFFICULTIES.map(d => d.value) as [Difficulty, ...Difficulty[]], {
    required_error: "You need to select a difficulty.",
  }),
  url: z.string().url({ message: "Please enter a valid URL." }),
  dateSolved: z.date({
    required_error: "A date for when the problem was solved is required.",
  }),
  isForReview: z.boolean().optional(), // Add isForReview to schema
});

type ProblemFormValues = z.infer<typeof problemFormSchema>;

interface ProblemFormProps {
  onAddProblem: (problem: Omit<SolvedProblem, 'id'>) => void;
  existingProblem?: SolvedProblem | null; // For editing
  onUpdateProblem?: (problem: SolvedProblem) => void;
  onCancelEdit?: () => void;
}

export function ProblemForm({ 
  onAddProblem, 
  existingProblem = null, 
  onUpdateProblem,
  onCancelEdit
}: ProblemFormProps) {
  const { toast } = useToast();
  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: existingProblem 
      ? { 
          ...existingProblem, 
          dateSolved: new Date(existingProblem.dateSolved),
          isForReview: existingProblem.isForReview ?? false,
        } 
      : {
          title: '',
          url: '',
          dateSolved: new Date(),
          isForReview: false,
        },
  });

  React.useEffect(() => {
    if (existingProblem) {
      form.reset({
        ...existingProblem,
        dateSolved: new Date(existingProblem.dateSolved),
        isForReview: existingProblem.isForReview ?? false,
      });
    } else {
      form.reset({
        title: '',
        url: '',
        dateSolved: new Date(),
        type: undefined,
        difficulty: undefined,
        isForReview: false,
      });
    }
  }, [existingProblem, form]);


  function onSubmit(data: ProblemFormValues) {
    const problemData = {
      ...data,
      dateSolved: format(data.dateSolved, 'yyyy-MM-dd'),
      isForReview: data.isForReview ?? false,
    };
    if (existingProblem && onUpdateProblem) {
        onUpdateProblem({ ...problemData, id: existingProblem.id });
        toast({ title: "Problem Updated", description: `${data.title} has been updated.` });
    } else {
        onAddProblem(problemData);
        toast({ title: "Problem Added", description: `${data.title} has been added to your log.` });
        form.reset({ title: '', url: '', dateSolved: new Date(), type: undefined, difficulty: undefined, isForReview: false });
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">
            {existingProblem ? "Edit Problem" : "Log Solved Problem"}
        </CardTitle>
        <CardDescription>
            {existingProblem ? "Update the details of your solved problem." : "Add a new problem you've conquered to track your progress."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Two Sum" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select problem type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROBLEM_TYPES.map((pt) => (
                          <SelectItem key={pt.value} value={pt.value}>
                            {pt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/your-solution or https://leetcode.com/problems/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Link to your solution (e.g., GitHub, LeetCode submission).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <FormField
                control={form.control}
                name="dateSolved"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Solved</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Icons.Calendar className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isForReview"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 pb-2">
                     <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    <FormLabel className="font-normal !mt-0">Mark for Review</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex space-x-2 justify-end">
                {existingProblem && onCancelEdit && (
                    <Button type="button" variant="outline" onClick={onCancelEdit}>Cancel</Button>
                )}
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {existingProblem ? "Update Problem" : "Add Problem"}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
