
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { GoalSettings, Goal } from '@/types';
import { GOAL_CATEGORIES, CODING_LANGUAGES } from '@/lib/constants'; // Added CODING_LANGUAGES
import { Icons } from './icons';
import { Separator } from './ui/separator';

const goalSchema = z.object({
  categoryId: z.string(),
  target: z.coerce.number().min(0, "Target must be non-negative.").max(100),
});

const goalSettingsSchema = z.object({
  period: z.enum(['daily', 'weekly']),
  goals: z.array(goalSchema),
  defaultCodingLanguage: z.string().optional(), // Added
});

type GoalSettingsFormValues = z.infer<typeof goalSettingsSchema>;

interface GoalSetterProps {
  currentSettings: GoalSettings;
  onUpdateSettings: (settings: GoalSettings) => void;
}

export function GoalSetter({ currentSettings, onUpdateSettings }: GoalSetterProps) {
  const { toast } = useToast();
  
  const form = useForm<GoalSettingsFormValues>({
    resolver: zodResolver(goalSettingsSchema),
    defaultValues: {
      period: currentSettings.period,
      goals: GOAL_CATEGORIES.map(category => {
        const existingGoal = currentSettings.goals.find(g => g.categoryId === category.id);
        return {
          categoryId: category.id,
          target: existingGoal ? existingGoal.target : category.defaultTarget,
        };
      }),
      defaultCodingLanguage: currentSettings.defaultCodingLanguage || 'javascript', // Default value
    },
  });

  React.useEffect(() => {
    form.reset({
      period: currentSettings.period,
      goals: GOAL_CATEGORIES.map(category => {
        const existingGoal = currentSettings.goals.find(g => g.categoryId === category.id);
        return {
          categoryId: category.id,
          target: existingGoal ? existingGoal.target : category.defaultTarget,
        };
      }),
      defaultCodingLanguage: currentSettings.defaultCodingLanguage || 'javascript', // Reset value
    });
  }, [currentSettings, form]);

  function onSubmit(data: GoalSettingsFormValues) {
    onUpdateSettings(data as GoalSettings); 
    toast({
      title: 'Goals Updated',
      description: `Your ${data.period} goals and preferences have been saved.`,
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <Icons.Goal className="mr-2 h-7 w-7" /> Set Your Grind Goals
        </CardTitle>
        <CardDescription>
          Define your consistency targets and default coding language for the AI Mentor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="defaultCodingLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Coding Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CODING_LANGUAGES.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />

            <div className="space-y-6">
              <h3 className="text-lg font-medium font-headline text-foreground">Problem Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GOAL_CATEGORIES.map((category, index) => (
                  <FormField
                    key={category.id}
                    control={form.control}
                    name={`goals.${index}.target`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{category.label}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder={`e.g., ${category.defaultTarget}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Goals & Preferences
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
