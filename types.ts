
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  AGENT = 'AGENT',
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  assignedPageIds: string[]; // New: Direct mapping for agent-to-page assignment
}

export interface ApprovedLink {
  id: string;
  title: string;
  url: string;
  category: string;
}

export interface ApprovedMedia {
  id: string;
  title: string;
  url: string;
  type: 'image' | 'video';
  isLocal?: boolean;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  isConnected: boolean;
  accessToken: string;
  assignedAgentIds: string[]; // Keep for two-way reference if needed
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isIncoming: boolean;
  isRead: boolean;
  notes?: string;
}

export interface Conversation {
  id: string;
  pageId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  customerAvatarBlob?: Blob; // Added for binary persistence
  lastMessage: string;
  lastTimestamp: string;
  status: ConversationStatus;
  assignedAgentId: string | null;
  unreadCount: number;
}
