
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ChatInput, ChatOutput, ChatMessage } from '@/types';
import { chatWithMentor } from '@/ai/flows/chat-flow';
import { STRIVER_SHEET_URL } from '@/lib/constants';
import { Icons } from '@/components/icons';
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, Send, User, Bot as BotIcon, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface AiMentorProps {
  defaultCodingLanguage?: string;
}

export function AiMentor({ defaultCodingLanguage }: AiMentorProps) {
  const { toast } = useToast();

  const [chatInput, setChatInput] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = React.useState(false);

  const lastMessageRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);


  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    setIsAtBottom(true); 
    setShowScrollButton(false);
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

   React.useEffect(() => {
    if (lastMessageRef.current && isAtBottom) {
      setTimeout(() => { 
        lastMessageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    }
  }, [chatHistory.length, isAtBottom]); 

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50; 
    
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && chatHistory.length > 0);
  };

  React.useEffect(() => {
    if (chatHistory.length === 0) {
      setIsAtBottom(true);
      setShowScrollButton(false);
    }
  }, [chatHistory.length]);


  return (
     <div className="flex flex-col space-y-6 max-h-[calc(100vh-100px)] overflow-hidden">
      
      <div className="flex-shrink-0 px-1">
        <div className="flex items-center space-x-2">
          <Icons.AIMentor className="h-7 w-7 text-primary" />
          <h2 className="font-headline text-2xl text-primary">
            AI Mentor
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Chat with your AI DSA mentor.
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-lg">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="font-headline text-xl text-foreground flex items-center">
            <BotIcon className="mr-2 h-6 w-6" /> Chat with Mentor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-2 md:space-y-4 pt-2 md:pt-4 min-h-0 overflow-hidden">
          <div
            className="border rounded-md p-2 md:p-4 bg-muted/20 flex-1 min-h-0 overflow-y-auto"
            ref={chatContainerRef}
            onScroll={handleScroll}
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
          </div>
          <div className="flex items-center space-x-2 pt-1 md:pt-2 flex-shrink-0">
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
              rows={3}
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
          <CardFooter className="mt-auto pt-2 md:pt-4 pb-2 md:pb-4 flex-shrink-0">
              <Button variant="link" asChild className="text-xs md:text-sm text-muted-foreground p-0 h-auto">
                  <a href={STRIVER_SHEET_URL} target="_blank" rel="noopener noreferrer">
                      Access Striver's A2Z DSA Sheet <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
              </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
