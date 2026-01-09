
import { FacebookPage, Conversation, Message, ConversationStatus } from '../types';

/**
 * Meta App ID: 1148755260666274
 */
const FB_APP_ID: string = '1148755260666274'; 

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
    return !!(data && data.id && !data.error);
  } catch (e) {
    return false;
  }
};

/**
 * Enhanced fetch with limit and avatar suppression support.
 */
export const fetchPageConversations = async (
  pageId: string, 
  pageAccessToken: string, 
  limit: number = 100,
  includeAvatars: boolean = true
): Promise<Conversation[]> => {
  // If avatars aren't needed, don't even request participants to avoid User/picture calls
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
  let url = `https://graph.facebook.com/v22.0/${conversationId}/messages?fields=id,message,created_time,from&access_token=${pageAccessToken}`;
  if (since) {
    url += `&since=${since}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) throw new Error(data.error.message);

  return (data.data || []).map((msg: any) => {
    const isFromPage = msg.from.id === pageId;
    return {
      id: msg.id,
      conversationId: conversationId,
      senderId: msg.from.id,
      senderName: msg.from.name,
      text: msg.message,
      timestamp: msg.created_time,
      isIncoming: !isFromPage,
      isRead: true
    };
  }).reverse();
};

export const sendPageMessage = async (recipientId: string, text: string, pageAccessToken: string) => {
  const url = `https://graph.facebook.com/v22.0/me/messages?access_token=${pageAccessToken}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE"
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data;
};
