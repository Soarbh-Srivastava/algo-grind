
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { AIChatMessage, AIChatInput, AIChatOutput } from '@/types';
import { chatWithAIChatMentor } from '@/ai/flows/ai-chat-flow';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Send, User as UserIcon, Bot as BotIcon } from 'lucide-react';

interface AiChatMentorProps {
  defaultCodingLanguage?: string;
}

export function AiChatMentor({ defaultCodingLanguage }: AiChatMentorProps) {
  const [chatInput, setChatInput] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<AIChatMessage[]>([]);
  const [isChatting, setIsChatting] = React.useState(false);
  const { toast } = useToast();
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const lastMessageRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (chatContainerRef.current) {
       chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]);


  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsChatting(true);
    const newMessage: AIChatMessage = { role: 'user', content: chatInput.trim() };

    setChatHistory(prev => [...prev, newMessage]);
    setChatInput('');
    setTimeout(scrollToBottom, 0);


    try {
      const currentHistoryForFlow: AIChatMessage[] = [...chatHistory, newMessage];
      const flowHistory = currentHistoryForFlow.slice(0, -1);

      const input: AIChatInput = {
        message: newMessage.content,
        history: flowHistory,
        defaultCodingLanguage: defaultCodingLanguage || 'javascript',
      };

      const result: AIChatOutput = await chatWithAIChatMentor(input);
      const aiResponse: AIChatMessage = { role: 'model', content: result.response };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("Error chatting with AI mentor:", error);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: error.message || "Could not get a response from the AI Mentor. Please try again.",
      });
      setChatHistory(prev => [...prev, {role: 'model', content: "Sorry, I encountered an error. Please try again."}]);
    } finally {
      setIsChatting(false);
      setTimeout(scrollToBottom, 0);
    }
  };

  return (
    <div className="flex flex-col space-y-6 max-h-[calc(100vh-180px)] overflow-hidden">
      <div className="flex-shrink-0 px-1">
        <div className="flex items-center space-x-2">
          <Icons.AIMentor className="h-7 w-7 text-primary" />
          <h2 className="font-headline text-2xl text-primary">
            AI Mentor Chat
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask your AI mentor about Data Structures and Algorithms.
        </p>
      </div>
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-lg">
        <CardContent className="flex-1 flex flex-col space-y-2 md:space-y-4 pt-4 md:pt-6 min-h-0 overflow-hidden">
          <div
            className="border rounded-md p-2 md:p-4 bg-muted/20 flex-1 min-h-0 overflow-y-auto"
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
                    <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0 bg-primary/20 text-primary">
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
                    <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0 bg-secondary text-secondary-foreground">
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
                      <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0 bg-primary/20 text-primary">
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
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-1 md:pt-2 flex-shrink-0">
            <Textarea
              placeholder="Ask a question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isChatting) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={3}
              className="flex-1 resize-none text-sm min-h-[60px] md:min-h-[72px]"
              disabled={isChatting}
            />
            <Button onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()} size="icon" className="shrink-0 h-10 w-10 md:h-12 md:w-12">
              <Send className="h-4 w-4 md:h-5 md:w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
