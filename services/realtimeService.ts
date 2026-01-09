import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fiuodbhgvmylvbanbfve.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdW9kYmhndm15bHZiYW5iZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1NTg0MDAsImV4cCI6MjAyNTEzNDQwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  message_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  attachments?: any;
  is_from_page: boolean;
  timestamp: string;
  created_at: string;
}

export interface RealtimeConversation {
  id: string;
  page_id: string;
  sender_id: string;
  sender_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

class RealtimeService {
  private messageSubscriptions: Map<string, any> = new Map();
  private conversationSubscriptions: Map<string, any> = new Map();

  /**
   * Subscribe to real-time messages for a specific conversation
   */
  subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: RealtimeMessage) => void,
    onMessageUpdate: (message: RealtimeMessage) => void,
    onMessageDelete: (messageId: string) => void
  ) {
    // Unsubscribe if already subscribed
    this.unsubscribeFromMessages(conversationId);

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload.new);
          onNewMessage(payload.new as RealtimeMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload.new);
          onMessageUpdate(payload.new as RealtimeMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message deleted:', payload.old);
          onMessageDelete((payload.old as RealtimeMessage).id);
        }
      )
      .subscribe();

    this.messageSubscriptions.set(conversationId, subscription);
    console.log(`Subscribed to messages for conversation: ${conversationId}`);
  }

  /**
   * Unsubscribe from messages for a specific conversation
   */
  unsubscribeFromMessages(conversationId: string) {
    const subscription = this.messageSubscriptions.get(conversationId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.messageSubscriptions.delete(conversationId);
      console.log(`Unsubscribed from messages for conversation: ${conversationId}`);
    }
  }

  /**
   * Subscribe to real-time conversations for a specific page
   */
  subscribeToConversations(
    pageId: string,
    onNewConversation: (conversation: RealtimeConversation) => void,
    onConversationUpdate: (conversation: RealtimeConversation) => void,
    onConversationDelete: (conversationId: string) => void
  ) {
    // Unsubscribe if already subscribed
    this.unsubscribeFromConversations(pageId);

    const subscription = supabase
      .channel(`conversations:${pageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('New conversation:', payload.new);
          onNewConversation(payload.new as RealtimeConversation);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Conversation updated:', payload.new);
          onConversationUpdate(payload.new as RealtimeConversation);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Conversation deleted:', payload.old);
          onConversationDelete((payload.old as RealtimeConversation).id);
        }
      )
      .subscribe();

    this.conversationSubscriptions.set(pageId, subscription);
    console.log(`Subscribed to conversations for page: ${pageId}`);
  }

  /**
   * Unsubscribe from conversations for a specific page
   */
  unsubscribeFromConversations(pageId: string) {
    const subscription = this.conversationSubscriptions.get(pageId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.conversationSubscriptions.delete(pageId);
      console.log(`Unsubscribed from conversations for page: ${pageId}`);
    }
  }

  /**
   * Unsubscribe from all real-time subscriptions
   */
  unsubscribeAll() {
    // Unsubscribe from all messages
    this.messageSubscriptions.forEach((subscription, conversationId) => {
      this.unsubscribeFromMessages(conversationId);
    });

    // Unsubscribe from all conversations
    this.conversationSubscriptions.forEach((subscription, pageId) => {
      this.unsubscribeFromConversations(pageId);
    });

    console.log('Unsubscribed from all real-time channels');
  }
}

export const realtimeService = new RealtimeService();