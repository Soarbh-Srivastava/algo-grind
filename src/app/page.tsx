
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/layout/header';
import { ProblemForm } from '@/components/problem-form';
import { GoalSetter } from '@/components/goal-setter';
import { ProgressTracker } from '@/components/progress-tracker';
import { ProgressVisualization } from '@/components/progress-visualization';
import { AiMentor } from '@/components/ai-mentor';
import { useAppData } from '@/hooks/use-app-data';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    appData,
    isInitialized: dataInitialized, // Renamed from isInitialized to avoid conflict
    isLoading: dataLoading, 
    addSolvedProblem,
    updateSolvedProblem,
    removeSolvedProblem,
    updateGoalSettings,
    toggleProblemReviewStatus,
  } = useAppData();

  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Combined loading state
  const isLoading = authLoading || dataLoading || !dataInitialized;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.Logo className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Algo Grind...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Redirecting to login...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto py-8 px-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 sticky top-[calc(theme(spacing.16)+1px)] bg-background/90 backdrop-blur-sm z-30 py-2 shadow-sm">
            <TabsTrigger value="dashboard" className="font-headline text-base">
              <Icons.Dashboard className="mr-2 h-5 w-5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="log" className="font-headline text-base">
              <Icons.Archive className="mr-2 h-5 w-5" /> Problem Log
            </TabsTrigger>
            <TabsTrigger value="analytics" className="font-headline text-base">
              <Icons.Analytics className="mr-2 h-5 w-5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="mentor" className="font-headline text-base">
              <Icons.AIMentor className="mr-2 h-5 w-5" /> AI Mentor
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <ProblemForm onAddProblem={addSolvedProblem} />
              </div>
              <div className="lg:col-span-1 space-y-8">
                <GoalSetter currentSettings={appData.goalSettings} onUpdateSettings={updateGoalSettings} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="log">
             <ProgressTracker 
                solvedProblems={appData.solvedProblems} 
                onUpdateProblem={updateSolvedProblem}
                onRemoveProblem={removeSolvedProblem}
                toggleProblemReviewStatus={toggleProblemReviewStatus}
              />
          </TabsContent>

          <TabsContent value="analytics">
            <ProgressVisualization
              solvedProblems={appData.solvedProblems}
              goalSettings={appData.goalSettings}
            />
          </TabsContent>

          <TabsContent value="mentor">
            <AiMentor solvedProblems={appData.solvedProblems} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Algo Grind. Keep Grinding!</p>
      </footer>
    </div>
  );
}
