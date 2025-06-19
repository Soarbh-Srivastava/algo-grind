// src/components/ai-mentor.tsx
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { SolvedProblem, Recommendation as RecommendationType, ProblemType as AppProblemType } from '@/types';
import { ProblemTypeEnum } from '@/types'; // Import the Zod schema
import { getPersonalizedRecommendations, PersonalizedRecommendationsInput, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { STRIVER_SHEET_URL } from '@/lib/constants';
import { Icons, getIconForProblemType } from '@/components/icons';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExternalLink, Lightbulb } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { z } from 'zod';


interface AiMentorProps {
  solvedProblems: SolvedProblem[];
}

// Define the TypeScript type inferred from the flow's Zod schema
type FlowProblemType = z.infer<typeof ProblemTypeEnum>;

// Helper to map app problem types to AI flow problem types
const mapToAIProblemType = (type: AppProblemType): FlowProblemType | undefined => {
  const validTypes = ProblemTypeEnum.unwrap().innerType.enum;
  if (validTypes.includes(type)) {
    return type as FlowProblemType;
  }
  return undefined; 
};


export function AiMentor({ solvedProblems }: AiMentorProps) {
  const [recommendations, setRecommendations] = React.useState<RecommendationType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setRecommendations([]);

    const aiSolvedProblems = solvedProblems
      .map(p => {
        const aiType = mapToAIProblemType(p.type);
        if (!aiType) return null; 
        return {
          problemType: aiType,
          difficulty: p.difficulty,
          url: p.url, 
        };
      })
      .filter(p => p !== null) as PersonalizedRecommendationsInput['solvedProblems'];


    if (aiSolvedProblems.length === 0 && solvedProblems.length > 0) {
       toast({
        variant: "destructive",
        title: "No Compatible Problems",
        description: "None of your solved problems have types recognized by the AI. Please log more problems with standard types.",
      });
      setIsLoading(false);
      return;
    }
    
    const input: PersonalizedRecommendationsInput = {
      solvedProblems: aiSolvedProblems,
      striverSheetUrl: STRIVER_SHEET_URL,
      // targetProblemTypes: [], // Optionally allow user to specify this later
    };

    try {
      const result: PersonalizedRecommendationsOutput = await getPersonalizedRecommendations(input);
      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations as RecommendationType[]);
         toast({
          title: "Recommendations Ready!",
          description: "Your personalized problem suggestions are here.",
        });
      } else {
        setRecommendations([]);
        toast({
          title: "No Recommendations Yet",
          description: "The AI couldn't generate specific recommendations at this time. Try solving more diverse problems!",
        });
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        variant: "destructive",
        title: "AI Mentor Error",
        description: "Could not fetch recommendations. Please try again later.",
      });
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <Icons.AIMentor className="mr-2 h-7 w-7" /> AI Mentor
        </CardTitle>
        <CardDescription>
          Get personalized problem recommendations from Striver's A2Z Sheet based on your progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {solvedProblems.length === 0 && (
           <Alert variant="default" className="bg-accent/20 border-accent/50">
            <Lightbulb className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-accent">Log Your Progress First</AlertTitle>
            <AlertDescription className="text-accent/80">
              Solve and log some problems to enable personalized recommendations from the AI Mentor.
            </AlertDescription>
          </Alert>
        )}
        <Button onClick={handleGetRecommendations} disabled={isLoading || solvedProblems.length === 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting Recommendations...
            </>
          ) : (
            "Suggest Problems"
          )}
        </Button>

        {recommendations.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-headline text-xl text-foreground">Recommended Problems:</h3>
            <ScrollArea className="h-[400px] rounded-md border p-1">
              <Accordion type="single" collapsible className="w-full">
                {recommendations.map((rec, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="hover:no-underline px-3">
                      <div className="flex items-center space-x-3 text-left w-full">
                        {getIconForProblemType(rec.problemType, { className: "h-5 w-5 text-primary shrink-0" })}
                        <span className="flex-1 font-medium">{rec.problemName}</span>
                        <Badge variant={
                            rec.difficulty === 'easy' ? 'default' :
                            rec.difficulty === 'medium' ? 'secondary' : 'destructive'
                          } className={`
                            ${rec.difficulty === 'easy' ? 'bg-green-500/20 text-green-700 border-green-500/30' :
                            rec.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                            'bg-red-500/20 text-red-700 border-red-500/30'}
                            shrink-0
                          `}>
                            {rec.difficulty}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong className="text-foreground">Reason:</strong> {rec.reason}
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={rec.url} target="_blank" rel="noopener noreferrer">
                          Go to Problem <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </div>
        )}
      </CardContent>
      {STRIVER_SHEET_URL && (
        <CardFooter>
            <Button variant="link" asChild className="text-sm text-muted-foreground p-0 h-auto">
                <a href={STRIVER_SHEET_URL} target="_blank" rel="noopener noreferrer">
                    Access the full Striver's A2Z DSA Sheet <ExternalLink className="ml-1 h-3 w-3" />
                </a>
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
