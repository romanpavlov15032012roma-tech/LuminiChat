import React from 'react';
import { Chat, User } from '../types';
import { Search, Menu, PenSquare, Settings, UserPlus, Phone, Hash } from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  currentUser: User;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenProfile: () => void;
  className?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  otherUsers: User[]; // Users found in search not currently in chats
  onStartChat: (user: User) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  chats, 
  currentUser,
  selectedChatId, 
  onSelectChat, 
  onOpenProfile,
  className = '',
  searchQuery,
  onSearchChange,
  otherUsers,
  onStartChat
}) => {
  
  // Robust time formatting that handles string, Date, or invalid inputs
  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      // Check if date is valid
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full transition-colors duration-200 ${className}`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={onOpenProfile}
        >
           <div className="relative">
             {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-violet-600 group-hover:opacity-80 transition-opacity"
                />
             ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
             )}
             <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                <Settings size={12} className="text-slate-500 dark:text-slate-400" />
             </div>
           </div>
           
           <div className="flex flex-col">
             <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">Lumini</span>
             <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">Настройки</span>
           </div>
        </div>
        
        <button className="p-2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" title="Новый чат">
           <PenSquare size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Имя, телефон или код..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-500 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all border border-slate-200 dark:border-slate-700/50 group-hover:border-slate-300 dark:group-hover:border-slate-600"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 group-focus-within:text-violet-500 transition-colors" size={18} />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {chats.length > 0 && (
          chats.map((chat) => {
            const participant = chat.participants[0];
            const isSelected = selectedChatId === chat.id;
            
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'bg-violet-100 dark:bg-violet-600/20 shadow-sm border border-violet-200 dark:border-violet-500/30' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={participant.avatar} 
                    alt={participant.name} 
                    className={`w-12 h-12 rounded-full object-cover border-2 ${isSelected ? 'border-violet-500' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                  {participant.isOnline && (
                    <>
                        {/* Pulsing indicator */}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full z-10"></span>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
                    </>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-900 dark:text-violet-100' : 'text-slate-700 dark:text-slate-200'}`}>
                      {participant.name}
                    </h3>
                    {chat.lastMessage && (
                      <span className={`text-xs ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-500'}`}>
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${isSelected ? 'text-violet-700 dark:text-violet-200/70' : 'text-slate-500 dark:text-slate-400'}`}>
                      {chat.isTyping ? <span className="text-violet-500 dark:text-violet-400 animate-pulse">Печатает...</span> : chat.lastMessage?.text || <span className="italic opacity-50">Черновик</span>}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 bg-violet-500 text-white text-xs font-bold px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Global Search Results */}
        {otherUsers.length > 0 && (
          <>
            <div className="px-3 pt-4 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
               <Search size={12} />
               <span>Результаты поиска</span>
            </div>
            {otherUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onStartChat(user)}
                className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent transition-all duration-200"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                  />
                  {user.isOnline && (
                     <>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full z-10"></span>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></span>
                     </>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex justify-between items-center">
                   <div className="min-w-0">
                     <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                        {user.name}
                     </h3>
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                        {user.phoneNumber && (
                             <div className="flex items-center gap-1">
                                <Phone size={10} />
                                <span>{user.phoneNumber}</span>
                             </div>
                        )}
                        {user.uniqueCode && (
                            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                <Hash size={8} />
                                <span>{user.uniqueCode}</span>
                            </div>
                        )}
                     </div>
                   </div>
                   <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-colors flex-shrink-0">
                      <UserPlus size={16} />
                   </div>
                </div>
              </div>
            ))}
          </>
        )}
        
        {chats.length === 0 && otherUsers.length === 0 && searchQuery && (
             <div className="p-8 text-center text-slate-500">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Пользователи не найдены</p>
                <p className="text-xs mt-1 opacity-70">Попробуйте ввести имя, телефон или код</p>
             </div>
        )}
      </div>
    </div>
  );
};