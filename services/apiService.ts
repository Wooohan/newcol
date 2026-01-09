const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for session cookies
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Agent endpoints - using getAllAgents for compatibility
  async getAllAgents() {
    return this.request('/agents');
  }

  async getAgent(id: string) {
    return this.request(`/agents/${id}`);
  }

  async createAgent(agent: any) {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, updates: any) {
    return this.request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAgent(id: string) {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Page endpoints - using getAllPages for compatibility
  async getAllPages() {
    return this.request('/pages');
  }

  async getPage(id: string) {
    return this.request(`/pages/${id}`);
  }

  async createPage(page: any) {
    return this.request('/pages', {
      method: 'POST',
      body: JSON.stringify(page),
    });
  }

  async updatePage(id: string, updates: any) {
    return this.request(`/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePage(id: string) {
    return this.request(`/pages/${id}`, {
      method: 'DELETE',
    });
  }

  async assignAgent(pageId: string, agentId: string) {
    return this.request(`/pages/${pageId}/assign-agent`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId }),
    });
  }

  // Conversation endpoints - using getAllConversations for compatibility
  async getAllConversations() {
    return this.request('/conversations');
  }

  async getConversations(pageId: string) {
    return this.request(`/conversations/page/${pageId}`);
  }

  async getConversation(id: string) {
    return this.request(`/conversations/${id}`);
  }

  async createConversation(conversation: any) {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation),
    });
  }

  async updateConversation(id: string, updates: any) {
    return this.request(`/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async markConversationAsRead(id: string) {
    return this.request(`/conversations/${id}/read`, {
      method: 'PATCH',
    });
  }

  async deleteConversation(id: string) {
    return this.request(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAllConversations() {
    return this.request('/conversations/clear', {
      method: 'DELETE',
    });
  }

  // Sync recent conversations (last 5)
  async syncRecentConversations(pageId: string) {
    return this.request(`/conversations/page/${pageId}/sync-recent`, {
      method: 'POST',
    });
  }

  // Sync all conversations (from settings)
  async syncAllConversations(pageId: string) {
    return this.request(`/conversations/page/${pageId}/sync-all`, {
      method: 'POST',
    });
  }

  // Message endpoints
  async getMessages(conversationId: string, limit = 50, offset = 0) {
    return this.request(`/messages/conversation/${conversationId}?limit=${limit}&offset=${offset}`);
  }

  async getMessage(id: string) {
    return this.request(`/messages/${id}`);
  }

  async createMessage(message: any) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async createBulkMessages(messages: any[]) {
    return this.request('/messages/bulk', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  async sendMessage(data: any) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMessage(id: string) {
    return this.request(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  async syncMessages(conversationId: string) {
    return this.request(`/messages/conversation/${conversationId}/sync`, {
      method: 'POST',
    });
  }

  // Link endpoints - using getAllLinks for compatibility
  async getAllLinks() {
    return this.request('/links');
  }

  async getLink(id: string) {
    return this.request(`/links/${id}`);
  }

  async createLink(link: any) {
    return this.request('/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async updateLink(id: string, updates: any) {
    return this.request(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLink(id: string) {
    return this.request(`/links/${id}`, {
      method: 'DELETE',
    });
  }

  // Media endpoints - using getAllMedia for compatibility
  async getAllMedia() {
    return this.request('/media');
  }

  async getMediaItem(id: string) {
    return this.request(`/media/${id}`);
  }

  async uploadMedia(media: any) {
    return this.request('/media', {
      method: 'POST',
      body: JSON.stringify(media),
    });
  }

  async createMedia(media: any) {
    return this.uploadMedia(media);
  }

  async deleteMedia(id: string) {
    return this.request(`/media/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
