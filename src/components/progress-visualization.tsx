
"use client";

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { SolvedProblem, GoalSettings, ProblemType } from '@/types';
import { GOAL_CATEGORIES, PROBLEM_TYPES } from '@/lib/constants';
import { Icons, getIconForProblemType } from '@/components/icons';
import { endOfWeek, startOfWeek, eachDayOfInterval, format, isWithinInterval, parseISO, subWeeks, getWeek, startOfDay, endOfDay } from 'date-fns';

interface ProgressVisualizationProps {
  solvedProblems: SolvedProblem[];
  goalSettings: GoalSettings;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const GOAL_COLOR = "hsl(var(--accent))";
const SOLVED_COLOR = "hsl(var(--primary))";


export function ProgressVisualization({ solvedProblems, goalSettings }: ProgressVisualizationProps) {
  const problemsByTypeChartData = React.useMemo(() => {
    return PROBLEM_TYPES.map(pt => ({
      name: pt.label,
      type: pt.value,
      solved: solvedProblems.filter(sp => sp.type === pt.value).length,
      icon: () => getIconForProblemType(pt.value, {className: "w-4 h-4"})
    })).filter(d => d.solved > 0);
  }, [solvedProblems]);

  const goalAdherenceChartData = React.useMemo(() => {
    return GOAL_CATEGORIES.map(category => {
      const solvedCount = solvedProblems.filter(sp => {
        const problemDate = parseISO(sp.dateSolved);
        let interval: Interval;
        const today = new Date();
        if (goalSettings.period === 'weekly') {
          interval = { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
        } else { // daily
          interval = { start: startOfDay(today), end: endOfDay(today) };
        }
        return category.problemTypes.includes(sp.type) && isWithinInterval(problemDate, interval);
      }).length;
      
      const goal = goalSettings.goals.find(g => g.categoryId === category.id);
      return {
        name: category.label,
        target: goal ? goal.target : 0,
        solved: solvedCount,
      };
    }).filter(d => d.target > 0 || d.solved > 0);
  }, [solvedProblems, goalSettings]);

  const weeklyProgressChartData = React.useMemo(() => {
    const weeksToShow = 8;
    const today = new Date();
    const data = [];

    for (let i = weeksToShow - 1; i >= 0; i--) {
      const targetDate = subWeeks(today, i);
      const weekNumber = getWeek(targetDate, { weekStartsOn: 1 });
      const year = targetDate.getFullYear();
      const weekLabel = `W${weekNumber}`;
      
      const start = startOfWeek(targetDate, { weekStartsOn: 1 });
      const end = endOfWeek(targetDate, { weekStartsOn: 1 });

      const problemsThisWeek = solvedProblems.filter(p => {
        const solvedDate = parseISO(p.dateSolved);
        return isWithinInterval(solvedDate, { start, end });
      }).length;
      
      data.push({ name: weekLabel, solved: problemsThisWeek, year: year});
    }
    return data;
  }, [solvedProblems]);


  if (solvedProblems.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Icons.Analytics className="mr-2 h-7 w-7" /> Progress Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Solve some problems to see your progress visualized here!
          </p>
        </CardContent>
      </Card>
    );
  }

  const problemsByTypeChartConfig = {
    solved: { label: "Solved", color: SOLVED_COLOR },
  } satisfies React.ComponentProps<typeof ChartContainer>["config"];

  const goalAdherenceChartConfig = {
    target: { label: "Target", color: GOAL_COLOR },
    solved: { label: "Solved", color: SOLVED_COLOR },
  } satisfies React.ComponentProps<typeof ChartContainer>["config"];
  
  const weeklyProgressChartConfig = {
    solved: { label: "Solved", color: SOLVED_COLOR },
  } satisfies React.ComponentProps<typeof ChartContainer>["config"];


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Icons.Analytics className="mr-2 h-7 w-7" /> Progress Analytics
          </CardTitle>
          <CardDescription>
            Visualize your DSA journey and track your consistency.
          </CardDescription>
        </CardHeader>
      </Card>

      {problemsByTypeChartData.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">Problems Solved by Type</CardTitle>
          </CardHeader>
          <CardContent>
             <ChartContainer config={problemsByTypeChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={problemsByTypeChartData}
                    dataKey="solved"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {problemsByTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                   <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {goalAdherenceChartData.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">
              {goalSettings.period.charAt(0).toUpperCase() + goalSettings.period.slice(1)} Goal Adherence (Current Period)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={goalAdherenceChartConfig} className="h-[300px] w-full">
              <BarChart data={goalAdherenceChartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="target" fill="var(--color-target)" radius={4} />
                <Bar dataKey="solved" fill="var(--color-solved)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
      
      {weeklyProgressChartData.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">Weekly Solved Problems (Last 8 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyProgressChartConfig} className="h-[300px] w-full">
              <LineChart data={weeklyProgressChartData} accessibilityLayer
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="solved" stroke="var(--color-solved)" strokeWidth={2} dot={{r:4}} activeDot={{r:6}}/>
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
