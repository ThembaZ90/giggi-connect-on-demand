-- Create conversations table to track chats between users
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL,
  application_id UUID NULL,
  poster_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NULL,
  UNIQUE(gig_id, poster_id, worker_id)
);

-- Create messages table for individual chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view conversations they are part of" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = poster_id OR auth.uid() = worker_id);

CREATE POLICY "Users can create conversations for gigs they posted or applied to" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = poster_id OR 
  auth.uid() = worker_id
);

CREATE POLICY "Users can update conversations they are part of" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = poster_id OR auth.uid() = worker_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE auth.uid() = poster_id OR auth.uid() = worker_id
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE auth.uid() = poster_id OR auth.uid() = worker_id
  )
);

CREATE POLICY "Users can update messages they sent" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update conversation last_message_at when a message is added
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation when message is added
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Enable realtime for messages and conversations
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;