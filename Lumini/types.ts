export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string; // Added for auth
  phoneNumber?: string; // Added for phone search
  uniqueCode?: string; // Added for unique ID search
  isOnline: boolean;
  isAi?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  name: string;
  size?: string;
  duration?: string; // Duration for audio/video
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
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reactions?: Reaction[];
  attachments?: Attachment[];
  isEdited?: boolean;
}

export interface Chat {
  id: string;
  participants: User[]; // Usually contains the 'other' person for 1-on-1
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
  isTyping?: boolean;
}