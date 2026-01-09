import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fiuodbhgvmylvbanbfve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdW9kYmhndm15bHZiYW5iZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTY3MzIsImV4cCI6MjA4MjkzMjczMn0.EjPK8Oyjr3mcbEkFO2dkeRECHHxFJJKR1B4CxRYK5RQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Realtime channels
let messagesChannel: RealtimeChannel | null = null;
let conversationsChannel: RealtimeChannel | null = null;

/**
 * Subscribe to real-time messages for a conversation
 * Replaces 500ms polling with instant push notifications
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: any) => void
) {
  // Unsubscribe from previous channel if exists
  if (messagesChannel) {
    supabase.removeChannel(messagesChannel);
  }

  messagesChannel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversationId=eq.${conversationId}`
      },
      (payload) => {
        console.log('📨 Real-time message received:', payload.new);
        onMessage(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to messages for conversation:', conversationId);
      }
    });

  return messagesChannel;
}

/**
 * Subscribe to real-time conversation updates
 * Replaces 5s polling with instant push notifications
 */
export function subscribeToConversations(
  pageIds: string[],
  onUpdate: (conversation: any) => void
) {
  // Unsubscribe from previous channel if exists
  if (conversationsChannel) {
    supabase.removeChannel(conversationsChannel);
  }

  conversationsChannel = supabase
    .channel('conversations:all')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'conversations'
      },
      (payload) => {
        console.log('💬 Real-time conversation update:', payload);
        
        // Filter by pageIds on client side
        const conv = payload.new || payload.old;
        if (conv && pageIds.includes(conv.pageId)) {
          onUpdate({
            type: payload.eventType,
            data: payload.new || payload.old
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to conversations for pages:', pageIds);
      }
    });

  return conversationsChannel;
}

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll() {
  if (messagesChannel) {
    supabase.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  if (conversationsChannel) {
    supabase.removeChannel(conversationsChannel);
    conversationsChannel = null;
  }
  console.log('✅ Unsubscribed from all real-time channels');
}

/**
 * Fetch initial conversations (called once on login)
 * Limit to 5 for quick load as requested
 */
export async function fetchInitialConversations(pageId: string, limit: number = 5) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('pageId', pageId)
    .order('lastTimestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Fetch full conversation history (called from settings)
 */
export async function fetchFullHistory(pageId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('pageId', pageId)
    .order('lastTimestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Fetch messages for a conversation (called once when opening chat)
 */
export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversationId', conversationId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Send a message (optimistic UI + database insert)
 */
export async function sendMessage(message: any) {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update conversation status
 */
export async function updateConversation(id: string, updates: any) {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
