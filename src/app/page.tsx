
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
import { Leaderboard } from '@/components/leaderboard'; // Import Leaderboard
import { useAppData } from '@/hooks/use-app-data';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    appData,
    isInitialized: dataInitialized, 
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
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6 md:sticky md:top-[calc(theme(spacing.16)+1px)] bg-background/90 backdrop-blur-sm z-30 py-2 shadow-sm">
            <TabsTrigger value="dashboard" className="font-headline text-sm md:text-base justify-start">
              <Icons.Dashboard className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="log" className="font-headline text-sm md:text-base justify-start">
              <Icons.Archive className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> Problem Log
            </TabsTrigger>
            <TabsTrigger value="analytics" className="font-headline text-sm md:text-base justify-start">
              <Icons.Analytics className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="mentor" className="font-headline text-sm md:text-base justify-start">
              <Icons.AIMentor className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> AI Mentor
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-headline text-sm md:text-base justify-start">
              <Icons.Trophy className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> Leaderboard
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
            <AiMentor 
              solvedProblems={appData.solvedProblems} 
              defaultCodingLanguage={appData.goalSettings.defaultCodingLanguage}
            />
          </TabsContent>
          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Algo Grind. Keep Grinding!</p>
      </footer>
    </div>
  );
}
