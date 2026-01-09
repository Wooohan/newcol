
import { User, UserRole, FacebookPage, Conversation } from './types';

/**
 * MASTER ADMIN CREDENTIALS
 * These are hardcoded to ensure the portal is always accessible
 * even if the MongoDB Atlas cluster is offline or unreachable.
 */
export const MASTER_ADMIN: User = {
  id: 'admin-master',
  name: 'Zayn (Master)',
  email: 'wooohan3@gmail.com',
  password: 'Admin@1122',
  role: UserRole.SUPER_ADMIN,
  avatar: 'https://picsum.photos/seed/zayn-master/200',
  status: 'online',
  assignedPageIds: [],
};

export const MOCK_USERS: User[] = [
  MASTER_ADMIN,
  {
    id: 'admin-1',
    name: 'Alex Johnson',
    email: 'admin@messengerflow.io',
    password: 'password123',
    role: UserRole.SUPER_ADMIN,
    avatar: 'https://picsum.photos/seed/admin/200',
    status: 'online',
    assignedPageIds: [],
  }
];

export const MOCK_PAGES: FacebookPage[] = [];
export const MOCK_CONVERSATIONS: Conversation[] = [];
