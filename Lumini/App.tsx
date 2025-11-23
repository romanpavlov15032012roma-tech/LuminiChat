import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AuthScreen } from './components/AuthScreen';
import { ProfileModal } from './components/ProfileModal';
import { INITIAL_CHATS, AI_USER, AVAILABLE_USERS } from './constants';
import { Chat, Message, User, Attachment } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { Info, X } from 'lucide-react';

const STORAGE_KEY = 'lumina_chats';
const USER_KEY = 'lumina_user';
const WELCOME_KEY = 'lumina_welcome_seen';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Initial Load
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    // Check if user has seen the demo modal
    const hasSeenWelcome = localStorage.getItem(WELCOME_KEY);
    if (!hasSeenWelcome) {
        setShowDemoModal(true);
    }

    loadChatsFromStorage();
    setLoading(false);
  }, []);

  // Helper to load and parse chats safely
  const loadChatsFromStorage = () => {
    const savedChats = localStorage.getItem(STORAGE_KEY);
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((c: Chat) => ({
            ...c,
            messages: c.messages.map((m: Message) => ({
                ...m,
                timestamp: new Date(m.timestamp)
            })),
            lastMessage: c.lastMessage ? { ...c.lastMessage, timestamp: new Date(c.lastMessage.timestamp) } : undefined
        }));
        setChats(parsedChats);
      } catch (e) {
        console.error("Error parsing chats", e);
        setChats(INITIAL_CHATS);
      }
    } else {
        setChats(INITIAL_CHATS);
    }
  };

  // 2. Sync State to LocalStorage (Only when THIS tab changes data)
  const saveChatsToStorage = (updatedChats: Chat[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
      setChats(updatedChats);
  };

  // 3. Listen for changes from OTHER tabs
  useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
          if (e.key === STORAGE_KEY) {
            // Reload chats when another tab updates them
            loadChatsFromStorage();
          }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_KEY);
    setSelectedChatId(null);
    setIsMobileChatOpen(false);
    setIsProfileOpen(false);
    setSearchQuery('');
  };
  
  const closeDemoModal = () => {
      setShowDemoModal(false);
      localStorage.setItem(WELCOME_KEY, 'true');
  };

  // Derive selected chat object
  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsMobileChatOpen(true);
    setSearchQuery(''); // Clear search on select
    
    // Mark as read
    const updatedChats = chats.map(c => {
        if (c.id === chatId) {
            return { ...c, unreadCount: 0 };
        }
        return c;
    });
    saveChatsToStorage(updatedChats);
  };

  const handleBackToSidebar = () => {
    setIsMobileChatOpen(false);
    setTimeout(() => setSelectedChatId(null), 300); // Small delay for animation
  };

  const handleStartChat = (user: User) => {
      // Check if chat already exists
      const existingChat = chats.find(c => c.participants[0].id === user.id);
      
      if (existingChat) {
          handleSelectChat(existingChat.id);
      } else {
          // Create new chat
          const newChat: Chat = {
              id: `c_${Date.now()}`,
              participants: [user],
              messages: [],
              unreadCount: 0
          };
          const newChatsList = [newChat, ...chats];
          saveChatsToStorage(newChatsList);
          handleSelectChat(newChat.id);
      }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!selectedChatId || !currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: text,
      timestamp: new Date(),
      status: 'sent',
      attachments: attachments
    };

    // 1. Update local state and storage immediately
    const updatedChats = chats.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
              // Note: In a real backend, unread count logic is handled on server.
              // For localhost demo, we don't increment unread here because we are the sender.
            }
          : chat
    );
    
    saveChatsToStorage(updatedChats);

    // AI Logic (Only if text exists, ignoring attachments for AI for now)
    const currentChat = updatedChats.find(c => c.id === selectedChatId);
    if (currentChat && currentChat.participants.some(p => p.isAi) && text.trim()) {
        
        // Set typing indicator
        const typingChats = updatedChats.map(c => c.id === selectedChatId ? { ...c, isTyping: true } : c);
        setChats(typingChats); // Just state, don't save typing to storage to avoid flickering

        // Prepare history for API
        const history = currentChat.messages.map(m => ({
            role: m.senderId === AI_USER.id ? 'model' as const : 'user' as const,
            parts: [{ text: m.text }]
        }));

        const aiResponseText = await sendMessageToGemini(text, history);

        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            senderId: AI_USER.id,
            text: aiResponseText,
            timestamp: new Date(),
            status: 'read'
        };

        // Add AI response and remove typing indicator
        const finalChats = chats.map(c => 
            c.id === selectedChatId ? {
                ...c,
                messages: [...c.messages, aiMessage],
                lastMessage: aiMessage,
                isTyping: false
            } : c
        );
        saveChatsToStorage(finalChats);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
      if (!selectedChatId || !currentUser) return;

      const updatedChats = chats.map(chat => {
          if (chat.id !== selectedChatId) return chat;

          return {
              ...chat,
              messages: chat.messages.map(msg => {
                  if (msg.id !== messageId) return msg;

                  const existingReactions = msg.reactions || [];
                  const userReactionIndex = existingReactions.findIndex(r => r.emoji === emoji && r.userId === currentUser.id);

                  let newReactions = [...existingReactions];

                  if (userReactionIndex >= 0) {
                      // Remove reaction if already exists (toggle)
                      newReactions.splice(userReactionIndex, 1);
                  } else {
                      // Add new reaction
                      newReactions.push({
                          emoji,
                          userId: currentUser.id,
                          count: 1
                      });
                  }
                  
                  return { ...msg, reactions: newReactions };
              })
          };
      });

      saveChatsToStorage(updatedChats);
  };

  // Search Logic
  const filteredChats = chats.filter(chat => 
    chat.participants[0].name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const otherUsers = searchQuery.trim() === '' ? [] : AVAILABLE_USERS.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !chats.some(c => c.participants[0].id === user.id)
  );

  if (loading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center text-violet-500">Loading...</div>;
  }

  if (!currentUser) {
    return (
        <>
            <AuthScreen onLogin={handleLogin} />
            {showDemoModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <button onClick={closeDemoModal} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-4 text-violet-400">
                            <Info size={28} />
                            <h2 className="text-xl font-bold text-white">Демо Режим</h2>
                        </div>
                        <p className="text-slate-300 mb-4 leading-relaxed">
                            Это демонстрационная версия <strong>Lumina Chat</strong>. 
                            Поскольку здесь нет подключенного сервера базы данных:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm mb-6">
                            <li>Сообщения сохраняются только в <strong>вашем браузере</strong>.</li>
                            <li>Вы <strong>не можете</strong> отправлять сообщения другим людям по ссылке.</li>
                            <li>Вы можете открыть сайт в <strong>двух вкладках</strong>, чтобы протестировать чат с самим собой.</li>
                            <li>ИИ (Gemini) работает полноценно.</li>
                        </ul>
                        <button 
                            onClick={closeDemoModal}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors"
                        >
                            Всё понятно, поехали!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`
        ${isMobileChatOpen ? 'hidden md:flex' : 'flex'} 
        w-full md:w-80 lg:w-96 flex-shrink-0 h-full
      `}>
        <Sidebar 
          chats={filteredChats} 
          currentUser={currentUser}
          selectedChatId={selectedChatId} 
          onSelectChat={handleSelectChat}
          onOpenProfile={() => setIsProfileOpen(true)}
          className="w-full"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          otherUsers={otherUsers}
          onStartChat={handleStartChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 h-full relative
        ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}
      `}>
        {selectedChat ? (
          <ChatWindow 
            chat={selectedChat} 
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            onBack={handleBackToSidebar}
            onReaction={handleReaction}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center w-full h-full bg-[#0B1120] text-slate-400">
             <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 flex items-center justify-center mb-6 shadow-lg shadow-violet-900/10">
                 <span className="text-4xl font-bold text-violet-500">L</span>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Lumina Chat</h2>
             <p className="max-w-xs text-center text-slate-500 mb-6 leading-relaxed">
                 Добро пожаловать, {currentUser.name}! <br/>
                 Выберите чат или воспользуйтесь поиском, чтобы найти новых людей.
             </p>
             <div className="mt-8 px-4 py-2 bg-slate-900 rounded-full text-xs text-slate-600 border border-slate-800 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 Demo Environment • Local Storage
             </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal 
            user={currentUser}
            onUpdate={handleUpdateProfile}
            onLogout={handleLogout}
            onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  );
};

export default App;