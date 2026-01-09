import { supabaseAdmin } from './supabase.js';
import logger from '../utils/logger.js';

let messagesChannel = null;
let conversationsChannel = null;
let agentsChannel = null;

/**
 * Initialize all Supabase Realtime subscriptions
 * This replaces ALL polling with instant push notifications
 */
export async function initializeRealtimeSubscriptions() {
  try {
    // Messages channel - Instant message delivery
    messagesChannel = supabaseAdmin
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          logger.info('📨 New message received (real-time):', {
            id: payload.new.id,
            conversationId: payload.new.conversationId,
            timestamp: payload.new.timestamp
          });
          
          // Message is automatically pushed to all subscribed clients
          // No manual broadcasting needed - Supabase handles it
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          logger.info('✏️ Message updated (real-time):', payload.new.id);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('✅ Messages channel subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('❌ Messages channel error');
        }
      });

    // Conversations channel - Instant conversation updates
    conversationsChannel = supabaseAdmin
      .channel('realtime:conversations')
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          logger.info('💬 Conversation updated (real-time):', {
            event: payload.eventType,
            id: payload.new?.id || payload.old?.id
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('✅ Conversations channel subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('❌ Conversations channel error');
        }
      });

    // Agents presence channel - Online/offline status
    agentsChannel = supabaseAdmin
      .channel('realtime:agents')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents'
        },
        (payload) => {
          logger.info('👤 Agent status updated (real-time):', {
            id: payload.new.id,
            status: payload.new.status
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('✅ Agents channel subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('❌ Agents channel error');
        }
      });

    logger.info('⚡ All Realtime channels initialized - 0ms delay mode active');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize Realtime subscriptions:', error);
    throw error;
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export async function cleanupRealtimeSubscriptions() {
  try {
    if (messagesChannel) await supabaseAdmin.removeChannel(messagesChannel);
    if (conversationsChannel) await supabaseAdmin.removeChannel(conversationsChannel);
    if (agentsChannel) await supabaseAdmin.removeChannel(agentsChannel);
    
    logger.info('✅ Realtime subscriptions cleaned up');
  } catch (error) {
    logger.error('❌ Error cleaning up subscriptions:', error);
  }
}

export { messagesChannel, conversationsChannel, agentsChannel };
