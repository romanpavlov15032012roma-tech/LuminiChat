import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AuthScreen } from './components/AuthScreen';
import { ProfileModal } from './components/ProfileModal';
import { INITIAL_CHATS, AI_USER, AVAILABLE_USERS } from './constants';
import { Chat, Message, User, Attachment } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { Info, X } from 'lucide-react';

const STORAGE_KEY = 'lumini_chats';
const USER_KEY = 'lumini_user';
const USERS_REGISTRY_KEY = 'lumini_users_registry';
const WELCOME_KEY = 'lumini_welcome_seen';
const THEME_KEY = 'lumini_theme';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [knownUsers, setKnownUsers] = useState<User[]>([]);

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
    
    // Load Theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
    }

    loadChatsFromStorage();
    loadKnownUsers();
    setLoading(false);
  }, []);

  // Theme Effect
  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem(THEME_KEY, 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem(THEME_KEY, 'light');
      }
  }, [isDarkMode]);

  const toggleTheme = () => {
      setIsDarkMode(!isDarkMode);
  };

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

  const loadKnownUsers = () => {
      const savedUsers = localStorage.getItem(USERS_REGISTRY_KEY);
      if (savedUsers) {
          try {
              setKnownUsers(JSON.parse(savedUsers));
          } catch(e) {
              setKnownUsers([]);
          }
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
            loadChatsFromStorage();
          }
          if (e.key === USERS_REGISTRY_KEY) {
              loadKnownUsers();
          }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    // Add to known users registry if not exists (allows finding second account)
    const existingRegistryRaw = localStorage.getItem(USERS_REGISTRY_KEY);
    const existingRegistry: User[] = existingRegistryRaw ? JSON.parse(existingRegistryRaw) : [];
    
    if (!existingRegistry.some((u: User) => u.id === user.id)) {
        const newRegistry = [...existingRegistry, user];
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(newRegistry));
        setKnownUsers(newRegistry);
    }
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

  /**
   * Helper to safely update a message status in LocalStorage without overwriting new data
   * caused by closures capturing stale state.
   */
  const safeUpdateMessageStatus = (chatId: string, messageId: string, status: 'sent' | 'delivered' | 'read') => {
      // 1. Read fresh data from storage to avoid race conditions with new messages
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (!rawData) return;
      
      const currentChatsRaw = JSON.parse(rawData);
      
      // 2. Modify specific field
      const updatedChatsRaw = currentChatsRaw.map((c: any) => {
          if (c.id !== chatId) return c;
          
          return {
              ...c,
              messages: c.messages.map((m: any) => m.id === messageId ? { ...m, status } : m),
              lastMessage: c.lastMessage?.id === messageId ? { ...c.lastMessage, status } : c.lastMessage
          };
      });

      // 3. Write back to storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChatsRaw));
      
      // 4. Update State (Must convert Strings back to Dates to avoid crashes)
      const updatedChatsForState = updatedChatsRaw.map((c: any) => ({
          ...c,
          messages: c.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
          })),
          lastMessage: c.lastMessage ? { ...c.lastMessage, timestamp: new Date(c.lastMessage.timestamp) } : undefined
      }));
      
      setChats(updatedChatsForState);
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!selectedChatId || !currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: text,
      timestamp: new Date(),
      status: 'sending', // Start as sending
      attachments: attachments
    };

    // 1. Update local state and storage immediately
    // We must read from current state 'chats' here, but for the async parts we need fresh data
    const updatedChats = chats.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
            }
          : chat
    );
    
    saveChatsToStorage(updatedChats);

    // Simulate Network Delay and Status Updates (Sent -> Delivered -> Read)
    setTimeout(() => {
        safeUpdateMessageStatus(selectedChatId, newMessage.id, 'sent');

        // If not AI, simulate delivery
        const currentChat = updatedChats.find(c => c.id === selectedChatId);
        if (currentChat && !currentChat.participants.some(p => p.isAi)) {
            setTimeout(() => {
                safeUpdateMessageStatus(selectedChatId, newMessage.id, 'delivered');

                // Simulate Read
                setTimeout(() => {
                    safeUpdateMessageStatus(selectedChatId, newMessage.id, 'read');
                }, 3500);

            }, 1500);
        }

    }, 600);


    // AI Logic (Only if text exists, ignoring attachments for AI for now)
    const currentChat = updatedChats.find(c => c.id === selectedChatId);
    if (currentChat && currentChat.participants.some(p => p.isAi) && text.trim()) {
        
        // Mark user message as read immediately when AI processes it
        setTimeout(() => {
            safeUpdateMessageStatus(selectedChatId, newMessage.id, 'read');
        }, 800);

        // Set typing indicator
        // We use functional update to be safe, although setChats is async
        setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, isTyping: true } : c)); 

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
        // CRITICAL FIX: Read from storage again to append AI message to the *latest* version of the chat
        // (in case user sent more messages while AI was thinking)
        const freshChatsRaw = localStorage.getItem(STORAGE_KEY);
        // Ensure parsing handles dates if we were to use them, but raw parsing returns strings for dates.
        // We need to be careful. Since we are creating a new object to SAVE, we can use strings or dates.
        // But for consistency let's convert to proper objects then back.
        
        let freshChats: Chat[] = [];
        if (freshChatsRaw) {
             freshChats = JSON.parse(freshChatsRaw).map((c: any) => ({
                ...c,
                messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
                lastMessage: c.lastMessage ? { ...c.lastMessage, timestamp: new Date(c.lastMessage.timestamp) } : undefined
            }));
        } else {
            freshChats = [];
        }
        
        const finalChats = freshChats.map(c => 
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

  const handleEditMessage = (messageId: string, newText: string) => {
    if (!selectedChatId) return;

    const updatedChats = chats.map(chat => {
        if (chat.id !== selectedChatId) return chat;

        const updatedMessages = chat.messages.map(msg => 
            msg.id === messageId 
                ? { ...msg, text: newText, isEdited: true }
                : msg
        );

        // Update last message if it was the one edited
        const updatedLastMessage = chat.lastMessage?.id === messageId
            ? { ...chat.lastMessage, text: newText, isEdited: true }
            : chat.lastMessage;

        return {
            ...chat,
            messages: updatedMessages,
            lastMessage: updatedLastMessage
        };
    });

    saveChatsToStorage(updatedChats);
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

  // Combine Hardcoded Users with Registered Users for Search
  // Remove duplicates by ID
  const allSearchableUsers = [...AVAILABLE_USERS];
  knownUsers.forEach(u => {
      if (!allSearchableUsers.some(existing => existing.id === u.id)) {
          allSearchableUsers.push(u);
      }
  });

  // Search Logic (Updated to include Phone Number and Unique Code)
  const filteredChats = chats.filter(chat => 
    chat.participants[0].name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.participants[0].phoneNumber && chat.participants[0].phoneNumber.includes(searchQuery)) ||
    (chat.participants[0].uniqueCode && chat.participants[0].uniqueCode.includes(searchQuery))
  );

  const otherUsers = searchQuery.trim() === '' ? [] : allSearchableUsers.filter(user => 
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phoneNumber && user.phoneNumber.includes(searchQuery)) ||
    (user.uniqueCode && user.uniqueCode.includes(searchQuery))) && 
    !chats.some(c => c.participants[0].id === user.id) &&
    user.id !== currentUser?.id
  );

  if (loading) {
    return <div className="h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-violet-600 dark:text-violet-500 transition-colors">Loading...</div>;
  }

  if (!currentUser) {
    return (
        <>
            <AuthScreen onLogin={handleLogin} />
            {showDemoModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <button onClick={closeDemoModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-4 text-violet-500 dark:text-violet-400">
                            <Info size={28} />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Демо Режим</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                            Это демонстрационная версия <strong>Lumini Chat</strong>. 
                            Поскольку здесь нет подключенного сервера базы данных:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-500 dark:text-slate-400 text-sm mb-6">
                            <li>Сообщения сохраняются в <strong>Local Storage</strong> браузера.</li>
                            <li>Вы <strong>не можете</strong> отправлять сообщения другим людям по ссылке.</li>
                            <li>Чтобы протестировать чат: откройте этот сайт в <strong>двух разных вкладках</strong> и войдите под разными именами.</li>
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
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
            onEditMessage={handleEditMessage}
            onBack={handleBackToSidebar}
            onReaction={handleReaction}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center w-full h-full bg-slate-50 dark:bg-[#0B1120] text-slate-400 transition-colors duration-200">
             <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 flex items-center justify-center mb-6 shadow-lg shadow-violet-900/10">
                 <span className="text-4xl font-bold text-violet-600 dark:text-violet-500">L</span>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Lumini Chat</h2>
             <p className="max-w-xs text-center text-slate-500 dark:text-slate-500 mb-6 leading-relaxed">
                 Добро пожаловать, {currentUser.name}! <br/>
                 Выберите чат или воспользуйтесь поиском (по имени, телефону или коду), чтобы найти новых людей.
             </p>
             <div className="mt-8 px-4 py-2 bg-white dark:bg-slate-900 rounded-full text-xs text-slate-500 dark:text-slate-600 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 Demo Environment • Local Storage Sync
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
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default App;