
import { FacebookPage, Conversation, Message, ConversationStatus } from '../types';

/**
 * Meta App ID: 1148755260666274
 */
const FB_APP_ID: string = '987921680673147'; 

let sdkPromise: Promise<void> | null = null;

export const isAppIdConfigured = () => {
  return FB_APP_ID !== 'YOUR_FB_APP_ID' && /^\d+$/.test(FB_APP_ID);
};

export const isSecureOrigin = () => {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export const initFacebookSDK = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve) => {
    if ((window as any).FB && (window as any).FB._initialized) {
      resolve();
      return;
    }

    (window as any).fbAsyncInit = function() {
      try {
        (window as any).FB.init({
          appId            : isAppIdConfigured() ? FB_APP_ID : '123456789',
          cookie           : true,
          xfbml            : true,
          version          : 'v22.0',
          status           : true 
        });
        (window as any).FB._initialized = true;
        resolve();
      } catch (e) {
        console.error("FB Init Error:", e);
        resolve();
      }
    };

    if (!document.getElementById('facebook-jssdk')) {
      const fjs = document.getElementsByTagName('script')[0];
      const js = document.createElement('script') as HTMLScriptElement;
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    } else if ((window as any).FB) {
      (window as any).fbAsyncInit();
    }
  });

  return sdkPromise;
};

export const loginWithFacebook = async () => {
  await initFacebookSDK();

  return new Promise<any>((resolve, reject) => {
    (window as any).FB.login((response: any) => {
      if (response.authResponse) {
        resolve(response.authResponse);
      } else {
        reject(response?.error_message || 'Login Failed. Ensure "Login with JavaScript SDK" is ENABLED in Meta Dashboard.');
      }
    }, { 
      // Added crucial scopes for persistent Long-Lived tokens
      scope: 'pages_messaging,pages_show_list,pages_manage_metadata,public_profile,pages_read_engagement' 
    });
  });
};

export const fetchUserPages = async (): Promise<FacebookPage[]> => {
  await initFacebookSDK();
  return new Promise((resolve, reject) => {
    (window as any).FB.api('/me/accounts', (response: any) => {
      if (!response || response.error) {
        reject(response?.error?.message || 'Failed to fetch pages');
        return;
      }
      const pages: FacebookPage[] = (response.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        isConnected: true,
        accessToken: p.access_token,
        assignedAgentIds: []
      }));
      resolve(pages);
    });
  });
};

export const verifyPageAccessToken = async (pageId: string, accessToken: string): Promise<boolean> => {
  try {
    const url = `https://graph.facebook.com/v22.0/${pageId}?fields=id,name&access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Improved logic: Only fail if the API explicitly says the token is invalid (Code 190)
    if (data.error && (data.error.code === 190 || data.error.code === 102)) {
      return false;
    }
    
    // If it's a network error or other, assume still connected to prevent accidental UI disconnects
    return true;
  } catch (e) {
    // Persistent by default on network timeout
    return true;
  }
};

export const fetchPageConversations = async (
  pageId: string, 
  pageAccessToken: string, 
  limit: number = 100,
  includeAvatars: boolean = true
): Promise<Conversation[]> => {
  const fields = includeAvatars 
    ? 'id,snippet,updated_time,participants{id,name,picture.type(large)},unread_count'
    : 'id,snippet,updated_time,unread_count';

  const url = `https://graph.facebook.com/v22.0/${pageId}/conversations?fields=${fields}&limit=${limit}&access_token=${pageAccessToken}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) throw new Error(data.error.message);

  return (data.data || []).map((conv: any) => {
    let customerName = 'Messenger User';
    let customerId = 'unknown';
    let avatarUrl = '';

    if (includeAvatars && conv.participants?.data) {
      const customer = conv.participants.data.find((p: any) => p.id !== pageId) || { name: 'Messenger User', id: 'unknown' };
      customerName = customer.name;
      customerId = customer.id;
      avatarUrl = customer.picture?.data?.url || '';
    }
    
    return {
      id: conv.id,
      pageId: pageId,
      customerId: customerId,
      customerName: customerName,
      customerAvatar: avatarUrl,
      lastMessage: conv.snippet || 'No message content',
      lastTimestamp: conv.updated_time,
      status: ConversationStatus.OPEN,
      assignedAgentId: null,
      unreadCount: conv.unread_count || 0
    };
  });
};

export const fetchThreadMessages = async (conversationId: string, pageId: string, pageAccessToken: string, since?: number): Promise<Message[]> => {
  // Added 'attachments' to fields to fetch image URLs from Meta
  let url = `https://graph.facebook.com/v22.0/${conversationId}/messages?fields=id,message,created_time,from,attachments{payload,type}&access_token=${pageAccessToken}`;
  if (since) {
    url += `&since=${since}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) throw new Error(data.error.message);

  return (data.data || []).map((msg: any) => {
    const isFromPage = msg.from.id === pageId;
    
    // Extract image URL if attachment exists
    let messageText = msg.message;
    if (!messageText && msg.attachments?.data?.[0]) {
      const attachment = msg.attachments.data[0];
      if (attachment.type === 'image' && attachment.payload?.url) {
        messageText = attachment.payload.url;
      }
    }

    return {
      id: msg.id,
      conversationId: conversationId,
      senderId: msg.from.id,
      senderName: msg.from.name,
      text: messageText || '',
      timestamp: msg.created_time,
      isIncoming: !isFromPage,
      isRead: true
    };
  }).reverse();
};

/**
 * Convert base64 data URL to Blob
 */
const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  const parts = base64.split(',');
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Send a message with image attachment using single multipart request
 * This is more robust and avoids (#100) parameter missing errors
 */
export const sendPageMessageWithImage = async (
  recipientId: string,
  base64Image: string,
  pageAccessToken: string,
  tag?: string
) => {
  try {
    const blob = base64ToBlob(base64Image);
    const url = `https://graph.facebook.com/v22.0/me/messages?access_token=${pageAccessToken}`;
    
    // Construct the message object as required by Meta
    const messagePayload = {
      attachment: {
        type: 'image',
        payload: {
          is_reusable: true
        }
      }
    };

    const formData = new FormData();
    formData.append('recipient', JSON.stringify({ id: recipientId }));
    formData.append('message', JSON.stringify(messagePayload));
    formData.append('filedata', blob, 'image.png');
    
    if (tag) {
      formData.append('messaging_type', 'MESSAGE_TAG');
      formData.append('tag', tag);
    } else {
      formData.append('messaging_type', 'RESPONSE');
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.error) {
      const err = new Error(data.error.message);
      (err as any).code = data.error.code;
      (err as any).subcode = data.error.error_subcode;
      throw err;
    }
    return data;
  } catch (error) {
    console.error('Failed to send image message:', error);
    throw error;
  }
};

export const sendPageMessage = async (recipientId: string, text: string, pageAccessToken: string, tag?: string) => {
  const url = `https://graph.facebook.com/v22.0/me/messages?access_token=${pageAccessToken}`;
  
  const payload: any = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: tag ? "MESSAGE_TAG" : "RESPONSE"
  };

  if (tag) {
    payload.tag = tag;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  if (data.error) {
    const err = new Error(data.error.message);
    (err as any).code = data.error.code;
    (err as any).subcode = data.error.error_subcode;
    throw err;
  }
  return data;
};
