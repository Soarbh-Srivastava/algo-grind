
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User as UserIcon, Bot as BotIcon, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import type { ChatMessage, ChatInput, ChatOutput } from '@/types';
import { chatWithCodingBuddy } from '@/ai/flows/coding-buddy-flow';
import { useAppData } from '@/hooks/use-app-data'; // To get defaultCodingLanguage

export function CodingBuddy() {
  const { toast } = useToast();
  const { appData } = useAppData(); // Get appData for default coding language
  const [chatInput, setChatInput] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = React.useState(false);

  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const lastMessageRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    setIsAtBottom(true);
    setShowScrollButton(false);
  };

  React.useEffect(() => {
    if (lastMessageRef.current && isAtBottom) {
       setTimeout(() => { // Timeout to allow DOM to update
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [chatHistory, isAtBottom]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50; 
    
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && chatHistory.length > 0 && scrollTop + clientHeight < scrollHeight - 100);
  };

   React.useEffect(() => {
    if (chatHistory.length === 0) {
      setIsAtBottom(true);
      setShowScrollButton(false);
    }
  }, [chatHistory.length]);

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
        defaultCodingLanguage: appData.goalSettings.defaultCodingLanguage || 'javascript',
      };

      const result: ChatOutput = await chatWithCodingBuddy(input);
      const aiResponse: ChatMessage = { role: 'model', content: result.response };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("Error chatting with Coding Buddy:", error);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Could not get a response from the Coding Buddy. Please try again.",
      });
      setChatHistory(prev => [...prev, {role: 'model', content: "Sorry, I encountered an error. Please try again."}]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <Card className="flex flex-col shadow-xl h-[calc(100vh-200px)] max-h-[700px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <Icons.CodingBuddy className="mr-2 h-7 w-7" /> Coding Buddy
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-2 md:space-y-4 pt-2 md:pt-4 min-h-0 overflow-hidden">
        <ScrollArea 
            className="border rounded-md p-2 md:p-4 bg-muted/20 flex-1 min-h-0" 
            onScroll={handleScroll}
            ref={chatContainerRef}
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
                     <AvatarFallback><UserIcon size={16} className="md:h-5 md:w-5"/></AvatarFallback>
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
                Ask your Coding Buddy anything about programming or DSA!
              </div>
            )}
          </div>
            {showScrollButton && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <Button
                size="sm"
                variant="secondary"
                onClick={scrollToBottom}
                className="shadow-lg rounded-full px-3 py-1.5 h-auto text-xs"
                >
                <ChevronDown className="h-3 w-3 mr-1" />
                Scroll to latest
                </Button>
            </div>
            )}
        </ScrollArea>
        <div className="flex items-center space-x-2 pt-1 md:pt-2 flex-shrink-0">
          <Textarea
            placeholder="Ask your Coding Buddy..."
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
    </Card>
  );
}
