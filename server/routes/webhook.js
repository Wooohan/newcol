import express from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import logger from '../utils/logger.js';

const router = express.Router();

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'my_secret_123';

/**
 * Facebook Webhook Verification (GET)
 * Called by Facebook to verify the webhook endpoint
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.info('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.error('❌ Webhook verification failed');
    res.status(403).send('Verification failed');
  }
});

/**
 * Facebook Webhook Event Handler (POST)
 * Receives real-time events from Facebook Messenger
 * Stores them in Supabase - Realtime automatically pushes to clients
 */
router.post('/', async (req, res) => {
  const body = req.body;

  // Respond immediately to Facebook (required within 20 seconds)
  res.status(200).send('EVENT_RECEIVED');

  // Process webhook events asynchronously
  if (body.object === 'page') {
    try {
      for (const entry of body.entry) {
        const webhookEvent = entry.messaging[0];
        
        if (!webhookEvent) continue;

        const senderId = webhookEvent.sender.id;
        const recipientId = webhookEvent.recipient.id;
        const pageId = recipientId; // The page that received the message
        
        // Handle different event types
        if (webhookEvent.message) {
          await handleMessage(webhookEvent, pageId, senderId);
        } else if (webhookEvent.delivery) {
          await handleDelivery(webhookEvent);
        } else if (webhookEvent.read) {
          await handleRead(webhookEvent);
        }
      }
    } catch (error) {
      logger.error('❌ Error processing webhook event:', error);
    }
  }
});

/**
 * Handle incoming message from Facebook
 */
async function handleMessage(event, pageId, senderId) {
  const message = event.message;
  
  if (!message.text) {
    logger.warn('⚠️ Received non-text message, skipping');
    return;
  }

  try {
    const messageId = message.mid;
    const messageText = message.text;
    const timestamp = new Date(event.timestamp).toISOString();

    // Check if conversation exists, create if not
    const { data: existingConv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('customerId', senderId)
      .eq('pageId', pageId)
      .single();

    if (!existingConv) {
      // Create new conversation
      const conversationId = `${pageId}_${senderId}`;
      
      await supabaseAdmin
        .from('conversations')
        .upsert({
          id: conversationId,
          pageId: pageId,
          customerId: senderId,
          customerName: `User ${senderId.substring(0, 8)}`,
          customerAvatar: '',
          lastMessage: messageText,
          lastTimestamp: timestamp,
          status: 'OPEN',
          assignedAgentId: null,
          unreadCount: 1
        });
      
      logger.info('✅ New conversation created:', conversationId);
    } else {
      // Update existing conversation
      await supabaseAdmin
        .from('conversations')
        .update({
          lastMessage: messageText,
          lastTimestamp: timestamp,
          unreadCount: supabaseAdmin.rpc('increment', { x: 1 })
        })
        .eq('id', existingConv.id);
    }

    // Store the message - Realtime will automatically push to all clients
    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        id: messageId,
        conversationId: existingConv?.id || `${pageId}_${senderId}`,
        senderId: senderId,
        senderName: `User ${senderId.substring(0, 8)}`,
        text: messageText,
        timestamp: timestamp,
        isIncoming: true,
        isRead: false
      });

    if (messageError) {
      logger.error('❌ Error storing message:', messageError);
    } else {
      logger.info('✅ Message stored and pushed to clients (real-time):', messageId);
    }
  } catch (error) {
    logger.error('❌ Error handling message:', error);
  }
}

/**
 * Handle message delivery confirmation
 */
async function handleDelivery(event) {
  const messageIds = event.delivery.mids;
  
  if (messageIds && messageIds.length > 0) {
    try {
      await supabaseAdmin
        .from('messages')
        .update({ isRead: true })
        .in('id', messageIds);
      
      logger.info('✅ Messages marked as delivered:', messageIds.length);
    } catch (error) {
      logger.error('❌ Error updating delivery status:', error);
    }
  }
}

/**
 * Handle message read confirmation
 */
async function handleRead(event) {
  const watermark = event.read.watermark;
  
  try {
    await supabaseAdmin
      .from('messages')
      .update({ isRead: true })
      .lte('timestamp', new Date(watermark).toISOString());
    
    logger.info('✅ Messages marked as read up to:', watermark);
  } catch (error) {
    logger.error('❌ Error updating read status:', error);
  }
}

export default router;
