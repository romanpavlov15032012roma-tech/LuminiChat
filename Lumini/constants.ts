import { User, Chat } from './types';

// CURRENT_USER is now handled dynamically in App.tsx via Auth

export const AI_USER: User = {
  id: 'gemini_ai',
  name: 'Lumina AI',
  avatar: 'https://picsum.photos/id/532/200/200', // Abstract tech look
  isOnline: true,
  isAi: true,
};

// Database of users that can be found via search
export const AVAILABLE_USERS: User[] = [
  {
    id: 'u1',
    name: 'Анна Смирнова',
    avatar: 'https://picsum.photos/id/65/200/200',
    isOnline: true,
  },
  {
    id: 'u2',
    name: 'Максим Волков',
    avatar: 'https://picsum.photos/id/91/200/200',
    isOnline: false,
  },
  {
    id: 'u3',
    name: 'Design Team',
    avatar: 'https://picsum.photos/id/180/200/200',
    isOnline: false,
  },
  {
    id: 'u4',
    name: 'Елена Соколова',
    avatar: 'https://picsum.photos/id/342/200/200',
    isOnline: true,
  },
  {
    id: 'u5',
    name: 'Дмитрий Петров',
    avatar: 'https://picsum.photos/id/338/200/200',
    isOnline: true,
  },
  {
    id: 'u6',
    name: 'Tech Support',
    avatar: 'https://picsum.photos/id/445/200/200',
    isOnline: false,
  },
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'c1',
    participants: [AI_USER],
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        senderId: 'gemini_ai',
        text: 'Привет! Я Lumina AI, твой персональный ассистент. Чем могу помочь сегодня?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: 'read',
      },
    ],
    lastMessage: {
        id: 'm1',
        senderId: 'gemini_ai',
        text: 'Привет! Я Lumina AI, твой персональный ассистент. Чем могу помочь сегодня?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: 'read',
    }
  }
];