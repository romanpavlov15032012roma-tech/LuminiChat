import React from 'react';
import { Chat, User } from '../types';
import { Search, Menu, PenSquare, Settings, UserPlus } from 'lucide-react';

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
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col bg-slate-900 border-r border-slate-800 h-full ${className}`}>
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
             <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5">
                <Settings size={12} className="text-slate-400" />
             </div>
           </div>
           
           <div className="flex flex-col">
             <span className="font-bold text-lg tracking-tight text-white leading-none">Lumina</span>
             <span className="text-xs text-slate-400 group-hover:text-violet-400 transition-colors">Настройки</span>
           </div>
        </div>
        
        <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
           <PenSquare size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Поиск людей..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 placeholder-slate-500 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all border border-slate-700/50"
          />
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
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
                    ? 'bg-violet-600/20 shadow-md border border-violet-500/30' 
                    : 'hover:bg-slate-800 border border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={participant.avatar} 
                    alt={participant.name} 
                    className={`w-12 h-12 rounded-full object-cover border-2 ${isSelected ? 'border-violet-500' : 'border-slate-700'}`}
                  />
                  {participant.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-100' : 'text-slate-200'}`}>
                      {participant.name}
                    </h3>
                    {chat.lastMessage && (
                      <span className={`text-xs ${isSelected ? 'text-violet-300' : 'text-slate-500'}`}>
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${isSelected ? 'text-violet-200/70' : 'text-slate-400'}`}>
                      {chat.isTyping ? <span className="text-violet-400 animate-pulse">Печатает...</span> : chat.lastMessage?.text || <span className="italic opacity-50">Черновик</span>}
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
            <div className="px-3 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
               <Search size={12} />
               <span>Глобальный поиск</span>
            </div>
            {otherUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => onStartChat(user)}
                className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-800 border border-transparent transition-all duration-200"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-slate-600"
                  />
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex justify-between items-center">
                   <div>
                     <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white">
                        {user.name}
                     </h3>
                     <p className="text-xs text-slate-400">Нажмите, чтобы написать</p>
                   </div>
                   <div className="p-2 bg-slate-800 rounded-full text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
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
             </div>
        )}
      </div>
    </div>
  );
};