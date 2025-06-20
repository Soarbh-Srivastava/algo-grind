
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { SolvedProblem, Recommendation as RecommendationType, ProblemType as AppProblemType } from '@/types';
import { ProblemTypeEnum } from '@/types';
import { getPersonalizedRecommendations, PersonalizedRecommendationsInput, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { STRIVER_SHEET_URL } from '@/lib/constants';
import { Icons, getIconForProblemType } from '@/components/icons';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink, Lightbulb } from 'lucide-react';
import { z } from 'zod';

interface ProblemRecommendationsProps {
  solvedProblems: SolvedProblem[];
}

// Helper to map app's ProblemType to the AI flow's expected Zod enum type
type FlowProblemType = z.infer<typeof ProblemTypeEnum>;

const mapToAIProblemType = (type: AppProblemType): FlowProblemType | undefined => {
  const validTypes = ProblemTypeEnum.options;
  // Check if the app's problem type string is a valid option in the Zod enum
  if (validTypes.includes(type as FlowProblemType)) {
    return type as FlowProblemType;
  }
  // console.warn(`Problem type "${type}" is not recognized by the AI flow. Skipping for recommendations.`);
  return undefined; // Or handle as a generic type if the AI can manage it
};

export function ProblemRecommendations({ solvedProblems }: ProblemRecommendationsProps) {
  const [recommendations, setRecommendations] = React.useState<RecommendationType[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoadingRecommendations(true);
    
    // Map SolvedProblem array to the format expected by the AI flow
    const aiSolvedProblems = solvedProblems
      .map(p => {
        const aiType = mapToAIProblemType(p.type);
        // Only include problems with types recognized by the AI flow
        if (!aiType) return null; 
        return {
          problemType: aiType, // This is now correctly typed
          difficulty: p.difficulty,
          url: p.url,
        };
      })
      .filter(p => p !== null) as PersonalizedRecommendationsInput['solvedProblems']; // Type assertion after filtering

    if (aiSolvedProblems.length === 0 && solvedProblems.length > 0) {
       toast({
        variant: "destructive",
        title: "No Compatible Problems Logged",
        description: "None of your solved problems have types currently recognized by the AI for generating recommendations. Try logging problems with standard types like 'array', 'string', 'dp', etc.",
      });
      setIsLoadingRecommendations(false);
      return;
    }
     if (solvedProblems.length === 0 && aiSolvedProblems.length === 0) {
        // If no problems are logged at all, don't show the above error, just proceed.
        // The AI will be informed that no problems are logged.
        // We can clear existing recommendations here if desired.
        setRecommendations([]); 
     }


    const input: PersonalizedRecommendationsInput = {
      solvedProblems: aiSolvedProblems, // Use the mapped and filtered problems
      striverSheetUrl: STRIVER_SHEET_URL,
      // targetProblemTypes: [], // Optionally, add UI to select target types
    };

    try {
      const result: PersonalizedRecommendationsOutput = await getPersonalizedRecommendations(input);
      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations as RecommendationType[]); // Cast if necessary, though Zod schema should align
         toast({
          title: "Recommendations Ready!",
          description: "Your personalized problem suggestions are here.",
        });
      } else {
        setRecommendations([]); 
        toast({
          title: "No Recommendations Yet",
          description: "The AI couldn't generate specific recommendations at this time. This can happen if the Striver sheet doesn't have suitable matches or if you've covered many areas. Try solving more diverse problems!",
        });
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        variant: "destructive",
        title: "AI Mentor Error",
        description: "Could not fetch recommendations. Please try again later.",
      });
      setRecommendations([]); // Clear recommendations on error
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-foreground">AI Problem Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0"> {/* Adjusted for potential scroll within accordion */}
        {solvedProblems.length === 0 && !isLoadingRecommendations && recommendations.length === 0 && (
          <Alert variant="default" className="bg-accent/20 border-accent/50">
            <Lightbulb className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-accent">Log Your Progress First</AlertTitle>
            <AlertDescription className="text-accent/80">
              Solve and log some problems to enable personalized recommendations from the AI mentor.
            </AlertDescription>
          </Alert>
        )}
        <Button 
          onClick={handleGetRecommendations} 
          disabled={isLoadingRecommendations || solvedProblems.length === 0} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
        >
          {isLoadingRecommendations ? (
            <>
              <Icons.Logo className="mr-2 h-5 w-5 animate-spin" />
              Getting Recommendations...
            </>
          ) : (
            "Suggest Problems"
          )}
        </Button>

        {recommendations.length > 0 && (
          <div className="space-y-2 pt-2">
             <h3 className="font-headline text-base text-foreground">Recommended Problems:</h3>
              <Accordion type="single" collapsible className="w-full">
                {recommendations.map((rec, index) => (
                  <AccordionItem value={`${rec.problemName}-${index}`} key={`${rec.problemName}-${index}`}>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    
