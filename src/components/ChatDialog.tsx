import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gigId: string;
  gigTitle: string;
  applicationId?: string;
  otherUserId: string;
  otherUserName: string;
  isGigPoster: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

interface Conversation {
  id: string;
  gig_id: string;
  poster_id: string;
  worker_id: string;
  last_message_at: string;
}

export const ChatDialog = ({
  open,
  onOpenChange,
  gigId,
  gigTitle,
  applicationId,
  otherUserId,
  otherUserName,
  isGigPoster
}: ChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create or find conversation
  const initializeConversation = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First try to find existing conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('gig_id', gigId)
        .eq('poster_id', isGigPoster ? user.id : otherUserId)
        .eq('worker_id', isGigPoster ? otherUserId : user.id)
        .single();

      if (existingConversation) {
        setConversation(existingConversation);
        await loadMessages(existingConversation.id);
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            gig_id: gigId,
            application_id: applicationId,
            poster_id: isGigPoster ? user.id : otherUserId,
            worker_id: isGigPoster ? otherUserId : user.id
          })
          .select()
          .single();

        if (error) throw error;
        setConversation(newConversation);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load messages for conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Get sender names for each unique sender
      const senderIds = [...new Set(data.map(msg => msg.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', senderIds);

      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile.full_name;
        return acc;
      }, {} as Record<string, string>) || {};
      
      const messagesWithNames = data.map(msg => ({
        ...msg,
        sender_name: profileMap[msg.sender_id] || 'Unknown User'
      }));
      
      setMessages(messagesWithNames);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id);

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Get sender name
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', newMessage.sender_id)
            .single();

          const messageWithName = {
            ...newMessage,
            sender_name: senderProfile?.full_name || 'Unknown User'
          };

          setMessages(prev => [...prev, messageWithName]);

          // Mark as read if not sent by current user
          if (newMessage.sender_id !== user?.id) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, user]);

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open && user) {
      initializeConversation();
    }
  }, [open, user]);

  // Handle Enter key for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat about: {gigTitle}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {otherUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>Chatting with {otherUserName}</span>
            <Badge variant="outline" className="text-xs">
              {isGigPoster ? 'Job Seeker' : 'Job Poster'}
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading conversation...</div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 border rounded-lg">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <Card
                        className={`max-w-[80%] ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <CardContent className="p-3">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                            <span>{message.sender_name}</span>
                            <span>
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true
                              })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="flex gap-2 pt-4">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};