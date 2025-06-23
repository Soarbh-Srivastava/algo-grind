"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AppHeader } from '@/components/layout/header';
import { ProblemForm } from '@/components/problem-form';
import { GoalSetter } from '@/components/goal-setter';
import { ProgressTracker } from '@/components/progress-tracker';
import { ProgressVisualization } from '@/components/progress-visualization';
import { ProblemRecommendations } from '@/components/problem-recommendations';
import { CodingBuddy } from '@/components/coding-buddy';
import { Leaderboard } from '@/components/leaderboard';
import { useAppData } from '@/hooks/use-app-data';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { isSameDay, parseISO } from 'date-fns';
import { GOAL_CATEGORIES } from '@/lib/constants';

export default function HomePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    appData,
    isInitialized,
    isLoading: dataLoading,
    addSolvedProblem,
    updateSolvedProblem,
    removeSolvedProblem,
    updateGoalSettings,
    toggleProblemReviewStatus,
  } = useAppData();

  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const isLoading = authLoading || dataLoading || !isInitialized;

  // This effect will handle the API call for unmet goals.
  React.useEffect(() => {
    if (isLoading || !isInitialized || !appData || !currentUser || !currentUser.email) {
      return;
    }

    const checkGoalsAndSendData = async () => {
      // Only run for daily goals
      if (appData.goalSettings.period !== 'daily') {
        return;
      }

      const now = new Date();
      const reminderTimeStr = appData.goalSettings.reminderTime || '18:00';
      const [reminderHours, reminderMinutes] = reminderTimeStr.split(':').map(Number);
      
      // Don't run if it's before the user's specified reminder time
      if (now.getHours() < reminderHours || (now.getHours() === reminderHours && now.getMinutes() < reminderMinutes)) {
        return;
      }

      const lastApiCallSentStr = localStorage.getItem('userApiDataSent');
      // Don't run if data has already been sent today
      if (lastApiCallSentStr && isSameDay(new Date(JSON.parse(lastApiCallSentStr)), now)) {
        return;
      }

      const solvedToday = appData.solvedProblems.filter(p => isSameDay(parseISO(p.dateSolved), now));
      const allGoals = appData.goalSettings.goals.filter(g => g.target > 0);
      
      const unmetGoalDetails = allGoals
        .map(goal => {
          const categoryInfo = GOAL_CATEGORIES.find(c => c.id === goal.categoryId);
          if (!categoryInfo) return null;

          const solvedInCategory = solvedToday.filter(p => categoryInfo.problemTypes.includes(p.type)).length;
          const remaining = goal.target - solvedInCategory;
          
          if (remaining > 0) {
              return {
                  category: categoryInfo.label,
                  target: goal.target,
                  solved: solvedInCategory,
                  remaining: remaining,
              };
          }
          return null;
        })
        .filter(g => g !== null);

      if (unmetGoalDetails.length > 0) {
        // Set flag immediately to prevent re-sends on refresh, even if an API fails
        localStorage.setItem('userApiDataSent', JSON.stringify(now));

        try {
          const payload = {
            email: currentUser.email,
            unmetGoals: unmetGoalDetails,
          };
          const fetchOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          };

          // --- Send to first endpoint ---
          const userDataResponse = await fetch('/api/user-data', fetchOptions);
          if (userDataResponse.ok) {
            console.log('Successfully sent unmet goal data to /api/user-data.');
          } else {
            const errorData = await userDataResponse.json();
            console.error('Failed to send data to /api/user-data:', errorData.message);
          }

          // --- Send to second endpoint ---
          const triggerFetchResponse = await fetch('/api/trigger-fetch', fetchOptions);
          if (triggerFetchResponse.ok) {
            console.log('Successfully sent unmet goal data to /api/trigger-fetch.');
          } else {
            const errorData = await triggerFetchResponse.json();
            console.error('Failed to send data to /api/trigger-fetch:', errorData.message);
          }
        } catch (error) {
          console.error('Error calling API endpoints:', error);
        }
      }
    };

    checkGoalsAndSendData();
    
  }, [appData, isInitialized, isLoading, currentUser]);

  const tabsConfig = [
    { value: "dashboard", label: "Dashboard", icon: Icons.Dashboard },
    { value: "log", label: "Problem Log", icon: Icons.Archive },
    { value: "analytics", label: "Analytics", icon: Icons.Analytics },
    { value: "codingbuddy", label: "Coding Buddy", icon: Icons.CodingBuddy },
    { value: "leaderboard", label: "Leaderboard", icon: Icons.Trophy },
  ];

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <div className="md:hidden mb-4">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open navigation menu">
                  <Icons.Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="font-headline text-2xl text-primary flex items-center">
                    <Icons.Logo className="mr-2 h-7 w-7" /> Algo Grind
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-1 p-4">
                  {tabsConfig.map((tab) => (
                    <SheetClose asChild key={tab.value}>
                      <Button
                        variant={activeTab === tab.value ? "secondary" : "ghost"}
                        className="w-full justify-start text-left font-headline text-base h-12"
                        onClick={() => {
                          setActiveTab(tab.value);
                          setMobileSheetOpen(false);
                        }}
                      >
                        <tab.icon className="mr-3 h-5 w-5" />
                        {tab.label}
                      </Button>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <TabsList className="hidden md:grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-5 mb-6 md:sticky md:top-[calc(theme(spacing.16)+1px)] bg-background/90 backdrop-blur-sm z-30 py-2 shadow-sm">
            {tabsConfig.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="font-headline text-sm md:text-base justify-start"
              >
                <tab.icon className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <ProblemForm onAddProblem={addSolvedProblem} />
                <ProblemRecommendations solvedProblems={appData.solvedProblems} />
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

          <TabsContent value="codingbuddy">
            <CodingBuddy />
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
