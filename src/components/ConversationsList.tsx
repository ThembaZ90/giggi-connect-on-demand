import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatDialog } from "./ChatDialog";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  gig_id: string;
  application_id: string | null;
  poster_id: string;
  worker_id: string;
  last_message_at: string | null;
  created_at: string;
  gig_title: string;
  other_user_name: string;
  other_user_id: string;
  unread_count: number;
  is_gig_poster: boolean;
}

export const ConversationsList = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`poster_id.eq.${user.id},worker_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get additional data for each conversation
      const conversationsWithCounts = await Promise.all(
        data.map(async (conv) => {
          // Get gig title
          const { data: gigData } = await supabase
            .from('gigs')
            .select('title')
            .eq('id', conv.gig_id)
            .single();

          // Get poster and worker names
          const { data: posterProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', conv.poster_id)
            .single();

          const { data: workerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', conv.worker_id)
            .single();

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          const isGigPoster = conv.poster_id === user.id;
          const otherUserName = isGigPoster 
            ? workerProfile?.full_name || 'Unknown User'
            : posterProfile?.full_name || 'Unknown User';

          return {
            ...conv,
            gig_title: gigData?.title || 'Unknown Gig',
            other_user_name: otherUserName,
            other_user_id: isGigPoster ? conv.worker_id : conv.poster_id,
            unread_count: count || 0,
            is_gig_poster: isGigPoster
          };
        })
      );

      setConversations(conversationsWithCounts);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Set up real-time subscription for conversation updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const openChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
  };

  const handleChatClose = () => {
    setChatOpen(false);
    setSelectedConversation(null);
    // Refresh conversations to update unread counts
    loadConversations();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Your Conversations
          </CardTitle>
          <CardDescription>
            Messages about your gigs and applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Start chatting when you post a gig or apply for one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Card 
                  key={conversation.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openChat(conversation)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar>
                          <AvatarFallback>
                            {conversation.other_user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">
                              {conversation.other_user_name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {conversation.is_gig_poster ? 'Applicant' : 'Poster'}
                            </Badge>
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {conversation.gig_title}
                          </p>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {conversation.last_message_at ? (
                              <>Last message {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}</>
                            ) : (
                              <>Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}</>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        Open Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedConversation && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={handleChatClose}
          gigId={selectedConversation.gig_id}
          gigTitle={selectedConversation.gig_title}
          applicationId={selectedConversation.application_id || undefined}
          otherUserId={selectedConversation.other_user_id}
          otherUserName={selectedConversation.other_user_name}
          isGigPoster={selectedConversation.is_gig_poster}
        />
      )}
    </>
  );
};