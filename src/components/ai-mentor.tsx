
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { SolvedProblem, Recommendation as RecommendationType, ProblemType as AppProblemType, ChatInput, ChatOutput, ChatMessage } from '@/types';
import { ProblemTypeEnum } from '@/types';
import { getPersonalizedRecommendations, PersonalizedRecommendationsInput, PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { chatWithMentor } from '@/ai/flows/chat-flow';
import { STRIVER_SHEET_URL } from '@/lib/constants';
import { Icons, getIconForProblemType } from '@/components/icons';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, Lightbulb, Send, User, Bot as BotIcon, ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface AiMentorProps {
  solvedProblems: SolvedProblem[];
  defaultCodingLanguage?: string;
}

type FlowProblemType = z.infer<typeof ProblemTypeEnum>;

const mapToAIProblemType = (type: AppProblemType): FlowProblemType | undefined => {
  const validTypes = ProblemTypeEnum.options;
  if (validTypes.includes(type as FlowProblemType)) {
    return type as FlowProblemType;
  }
  return undefined;
};


export function AiMentor({ solvedProblems, defaultCodingLanguage }: AiMentorProps) {
  const [recommendations, setRecommendations] = React.useState<RecommendationType[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false);
  const { toast } = useToast();

  const [chatInput, setChatInput] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = React.useState(false);

  const lastMessageRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);


  const handleGetRecommendations = async () => {
    setIsLoadingRecommendations(true);
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
        description: "None of your solved problems have types recognized by the AI for recommendations. Log more problems with standard types.",
      });
      setIsLoadingRecommendations(false);
      return;
    }

    const input: PersonalizedRecommendationsInput = {
      solvedProblems: aiSolvedProblems,
      striverSheetUrl: STRIVER_SHEET_URL,
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
      setIsLoadingRecommendations(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsChatting(true);
    const newMessage: ChatMessage = { role: 'user', content: chatInput.trim() };
    
    setIsAtBottom(true); 
    setChatHistory(prev => [...prev, newMessage]);
    setChatInput('');
    

    try {
      const currentHistoryForFlow = [...chatHistory, newMessage];
      const flowHistory = currentHistoryForFlow.slice(0, -1); 
      const input: ChatInput = { 
        message: newMessage.content, 
        history: flowHistory,
        defaultCodingLanguage: defaultCodingLanguage || 'javascript',
      };

      const result: ChatOutput = await chatWithMentor(input);
      const aiResponse: ChatMessage = { role: 'model', content: result.response };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("Error chatting with mentor:", error);
      const errorMessage = "Sorry, I encountered an error. Please try again or rephrase your question.";
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Could not get a response from the AI Mentor.",
      });
      setChatHistory(prev => [...prev, {role: 'model', content: errorMessage}]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const atBottomThreshold = 10; 
    const currentlyAtBottom = scrollHeight - scrollTop - clientHeight < atBottomThreshold;

    setIsAtBottom(currentlyAtBottom);
    setShowScrollButton(!currentlyAtBottom && scrollHeight > clientHeight + atBottomThreshold);
  };

  const scrollToBottom = () => {
    if(lastMessageRef.current) {
       requestAnimationFrame(() => {
         lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
       });
    }
    setIsAtBottom(true);
    setShowScrollButton(false);
  };

 React.useEffect(() => {
    const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;

    if (lastMessageRef.current) {
      if ((lastMessage && lastMessage.role === 'user') || (lastMessage && lastMessage.role === 'model' && isAtBottom)) {
        requestAnimationFrame(() => {
          lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
      }
    }
     
     if (chatContainerRef.current) {
      const scrollContainer = chatContainerRef.current;
      const { scrollHeight, clientHeight, scrollTop } = scrollContainer;
      const currentlyAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setShowScrollButton(!currentlyAtBottom && scrollHeight > clientHeight + 10);
    } else {
        setShowScrollButton(false); 
    }

  }, [chatHistory, isAtBottom]); 

  React.useEffect(() => {
    if (chatHistory.length === 0) {
      setIsAtBottom(true);
      setShowScrollButton(false);
    }
  }, [chatHistory.length]);


  return (
    <Card className="shadow-lg flex flex-col max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-150px)] overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <Icons.AIMentor className="mr-2 h-7 w-7" /> AI Mentor
        </CardTitle>
        <CardDescription>
          Get personalized problem recommendations and chat with your AI DSA mentor.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6"> {/* Recommendations section */}
        {solvedProblems.length === 0 && !isLoadingRecommendations && (
           <Alert variant="default" className="bg-accent/20 border-accent/50">
            <Lightbulb className="h-5 w-5 text-accent" />
            <AlertTitle className="font-headline text-accent">Log Your Progress First</AlertTitle>
            <AlertDescription className="text-accent/80">
              Solve and log some problems to enable personalized recommendations.
            </AlertDescription>
          </Alert>
        )}
        <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations || solvedProblems.length === 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
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
          <div className="space-y-4 pt-4">
            <h3 className="font-headline text-xl text-foreground">Recommended Problems:</h3>
            <ScrollArea className="h-[250px] rounded-md border p-1">
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

      <Separator className="my-2 md:my-4" />

      {/* Chat section wrapper */}
      <CardContent className="flex-1 flex flex-col space-y-2 md:space-y-4 overflow-hidden pt-0 min-h-0">
        <h3 className="font-headline text-xl text-foreground flex items-center">
          <BotIcon className="mr-2 h-6 w-6" /> Chat with Mentor
        </h3>
        {/* Chat messages area */}
        <ScrollArea
          type="auto"
          className="border rounded-md p-2 md:p-4 bg-muted/20 flex-1 min-h-0 overflow-hidden" 
          ref={chatContainerRef}
          onScrollCapture={handleScroll}
        >
          <div className="space-y-3 md:space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                ref={index === chatHistory.length - 1 ? lastMessageRef : null}
                className={cn(
                  "flex items-start space-x-2 md:space-x-3 w-full",
                  msg.role === 'user' ? "justify-end pl-6 md:pl-10" : "justify-start pr-6 md:pr-10"
                )}
              >
                {msg.role === 'model' && (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                    <AvatarFallback><BotIcon size={16} className="md:h-5 md:w-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "p-2 md:p-3 rounded-lg max-w-[85%] md:max-w-[75%]",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border"
                  )}
                >
                  <ReactMarkdown
                    className="prose prose-sm dark:prose-invert max-w-none prose-p:last:mb-0 prose-code:before:content-none prose-code:after:content-none prose-pre:p-0 prose-pre:bg-transparent"
                    components={{
                       pre: ({ node, children, className: preClassName, ...props }) => {
                        let lang = '';
                        const codeElement = React.Children.toArray(children).find(
                          (child) => React.isValidElement(child) && child.type === 'code'
                        ) as React.ReactElement | undefined;

                        if (codeElement && codeElement.props && typeof codeElement.props.className === 'string') {
                          const match = /language-(\w+)/.exec(codeElement.props.className);
                          if (match) {
                            lang = match[1];
                          }
                        }
                        return (
                          <div className="my-2 w-full rounded-md border bg-card text-card-foreground relative text-[0.9em] overflow-x-auto">
                            {lang && <div className="absolute top-1 right-2 text-xs text-muted-foreground select-none z-10">{lang}</div>}
                            <pre
                              className={cn("p-3 pt-5 whitespace-pre overflow-x-auto", preClassName)}
                              {...props}
                            >
                              {children}
                            </pre>
                          </div>
                        );
                      },
                      code({ node, inline, className, children, ...restProps }) {
                        if (inline) {
                          return (
                            <code
                              className={cn("bg-foreground/10 text-foreground px-1 py-0.5 rounded text-[0.9em] font-mono", className)}
                              {...(restProps as React.HTMLAttributes<HTMLElement>)}
                            >
                              {children}
                            </code>
                          );
                        }
                        // This is for block code
                        return (
                          <code 
                            className={cn("font-mono", className)} 
                            {...(restProps as React.HTMLAttributes<HTMLElement>)}
                          >
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                     <AvatarFallback><User size={16} className="md:h-5 md:w-5"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isChatting && chatHistory[chatHistory.length -1]?.role === 'user' && (
                <div
                  className="flex items-start space-x-2 md:space-x-3 justify-start pr-6 md:pr-10"
                  ref={lastMessageRef} 
                >
                    <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                        <AvatarFallback><BotIcon size={16} className="md:h-5 md:w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="p-2 md:p-3 rounded-lg bg-background border">
                        <Icons.Logo className="h-5 w-5 animate-spin text-primary" />
                    </div>
                </div>
            )}
            {chatHistory.length === 0 && !isChatting && (
              <div className="text-center text-muted-foreground py-8">
                Ask the AI Mentor anything about DSA!
              </div>
            )}
             {showScrollButton && (
              <div className="sticky bottom-0 flex justify-center pb-2 z-10">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={scrollToBottom}
                  className="shadow-lg rounded-full px-4 py-2 h-auto"
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  New messages
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
        {/* Chat input section */}
        <div className="flex items-center space-x-2 pt-1 md:pt-2">
          <Textarea
            placeholder="Ask a question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            className="flex-1 resize-none text-sm min-h-[40px] md:min-h-[48px]"
            disabled={isChatting}
          />
          <Button onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()} size="icon" className="shrink-0 h-10 w-10 md:h-12 md:w-12">
            <Send className="h-4 w-4 md:h-5 md:w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </CardContent>

      {STRIVER_SHEET_URL && (
        <CardFooter className="mt-auto pt-2 md:pt-4 pb-2 md:pb-4">
            <Button variant="link" asChild className="text-xs md:text-sm text-muted-foreground p-0 h-auto">
                <a href={STRIVER_SHEET_URL} target="_blank" rel="noopener noreferrer">
                    Access Striver's A2Z DSA Sheet <ExternalLink className="ml-1 h-3 w-3" />
                </a>
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}

