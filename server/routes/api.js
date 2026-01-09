import express from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Sync recent conversations (limit to 5 for quick login)
 * This is called on login - NOT polling
 */
router.post('/sync-conversations', async (req, res) => {
  try {
    const { pageId, limit = 5 } = req.body;

    if (!pageId) {
      return res.status(400).json({ error: 'pageId is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('pageId', pageId)
      .order('lastTimestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    logger.info(`✅ Synced ${data.length} conversations for page ${pageId}`);
    res.json({ conversations: data });
  } catch (error) {
    logger.error('❌ Error syncing conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync full history (called from settings button)
 */
router.post('/sync-full-history', async (req, res) => {
  try {
    const { pageId, limit = 50 } = req.body;

    if (!pageId) {
      return res.status(400).json({ error: 'pageId is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('pageId', pageId)
      .order('lastTimestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    logger.info(`✅ Full history sync: ${data.length} conversations for page ${pageId}`);
    res.json({ conversations: data });
  } catch (error) {
    logger.error('❌ Error syncing full history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get messages for a conversation
 * Called once when opening a chat - NOT polling
 */
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversationId', conversationId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    res.json({ messages: data });
  } catch (error) {
    logger.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send message (called from UI)
 */
router.post('/send-message', async (req, res) => {
  try {
    const { conversationId, text, senderId, senderName } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({ error: 'conversationId and text are required' });
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Store in database - Realtime will push to all clients
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        id: messageId,
        conversationId,
        senderId: senderId || 'agent',
        senderName: senderName || 'Agent',
        text,
        timestamp,
        isIncoming: false,
        isRead: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message
    await supabaseAdmin
      .from('conversations')
      .update({
        lastMessage: text,
        lastTimestamp: timestamp
      })
      .eq('id', conversationId);

    logger.info('✅ Message sent and pushed to clients:', messageId);
    res.json({ message: data });
  } catch (error) {
    logger.error('❌ Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update conversation status
 */
router.patch('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('✅ Conversation updated:', id);
    res.json({ conversation: data });
  } catch (error) {
    logger.error('❌ Error updating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check for API
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    realtime: 'active'
  });
});

export default router;
