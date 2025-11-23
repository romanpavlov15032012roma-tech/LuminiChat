export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string; // Added for auth
  isOnline: boolean;
  isAi?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  count: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  reactions?: Reaction[];
  attachments?: Attachment[];
}

export interface Chat {
  id: string;
  participants: User[]; // Usually contains the 'other' person for 1-on-1
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
  isTyping?: boolean;
}