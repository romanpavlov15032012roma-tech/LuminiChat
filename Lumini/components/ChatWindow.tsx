import React, { useState, useRef, useEffect } from 'react';
import { Chat, Attachment } from '../types';
import { User } from '../types';
import { 
  Send, Paperclip, Smile, MoreVertical, Phone, Video, ArrowLeft, Bot, 
  X, Image as ImageIcon, FileText, Mic, MicOff, VideoOff, PhoneOff, Plus, Download, Pencil, Check, CheckCheck, Clock, Play
} from 'lucide-react';

interface ChatWindowProps {
  chat: Chat;
  currentUser: User;
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onBack: () => void;
  onReaction: (messageId: string, emoji: string) => void;
}

// Common emojis for quick reaction
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
// Extended emojis for input picker
const INPUT_EMOJIS = [
    '😊', '😂', '🥰', '😍', '😒', '😭', '😩', '😤', '😡', '😱',
    '👍', '👎', '👊', '👋', '🙏', '💪', '🔥', '✨', '🎉', '💯',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️'
];

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUser, onSendMessage, onEditMessage, onBack, onReaction }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Attachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  // Call State
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const participant = chat.participants[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only auto-scroll if NOT editing (to avoid jumping while editing old messages)
    if (!editingMessageId) {
        scrollToBottom();
    }
  }, [chat.messages, selectedFiles, editingMessageId]);

  // Focus edit input when editing starts
  useEffect(() => {
      if (editingMessageId && editInputRef.current) {
          editInputRef.current.focus();
      }
  }, [editingMessageId]);

  // Call Timer
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (callStatus === 'connected') {
          interval = setInterval(() => {
              setCallDuration(prev => prev + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [callStatus]);

  const handleSend = () => {
    if (inputText.trim() || selectedFiles.length > 0) {
      onSendMessage(inputText, selectedFiles);
      setInputText('');
      setSelectedFiles([]);
      setShowEmojiPicker(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startEditing = (msg: { id: string, text: string }) => {
      setEditingMessageId(msg.id);
      setEditText(msg.text);
      setHoveredMessageId(null); // Hide hover menu
  };

  const saveEdit = () => {
      if (editingMessageId && editText.trim()) {
          onEditMessage(editingMessageId, editText);
          setEditingMessageId(null);
          setEditText('');
      }
  };

  const cancelEdit = () => {
      setEditingMessageId(null);
      setEditText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          saveEdit();
      } else if (e.key === 'Escape') {
          cancelEdit();
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          
          reader.onload = (event) => {
              if (event.target?.result) {
                  let type: 'image' | 'video' | 'file' = 'file';
                  if (file.type.startsWith('image/')) type = 'image';
                  else if (file.type.startsWith('video/')) type = 'video';

                  const newAttachment: Attachment = {
                      id: Date.now().toString(),
                      type: type,
                      url: event.target.result as string,
                      name: file.name,
                      size: (file.size / 1024).toFixed(1) + ' KB'
                  };
                  setSelectedFiles(prev => [...prev, newAttachment]);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const removeAttachment = (id: string) => {
      setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const startCall = (type: 'audio' | 'video') => {
      setCallType(type);
      setCallStatus('calling');
      setIsVideoEnabled(type === 'video');
      
      // Simulate connection after 2 seconds
      setTimeout(() => {
          setCallStatus('connected');
      }, 2000);
  };

  const endCall = () => {
      setCallStatus('idle');
      setCallDuration(0);
      setCallType(null);
  };

  const formatCallDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Robust Date Format
  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
  };
  
  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'sending': return <Clock size={14} className="text-slate-400" />;
          case 'sent': return <Check size={16} className="text-slate-400" />;
          case 'delivered': return <CheckCheck size={16} className="text-slate-400" />;
          case 'read': return <CheckCheck size={16} className="text-blue-400 dark:text-blue-400" />;
          default: return <Clock size={14} className="text-slate-400" />;
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] relative overflow-hidden transition-colors duration-200">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
             <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[100px]"></div>
        </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
            <ArrowLeft size={24} />
          </button>
          
          <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
             <img src={participant.avatar} alt={participant.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
             {participant.isOnline && (
                 <>
                    {/* Enhanced Online Indicator */}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 z-20"></span>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping opacity-75 z-10"></span>
                 </>
             )}
          </div>
          
          <div className="cursor-pointer">
            <h2 className="text-slate-800 dark:text-slate-100 font-bold text-lg flex items-center gap-2 hover:text-violet-600 dark:hover:text-violet-200 transition-colors">
                {participant.name}
                {participant.isAi && <Bot size={18} className="text-violet-500 dark:text-violet-400" />}
            </h2>
            <div className={`text-xs flex items-center gap-1.5 ${participant.isOnline ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                {participant.isAi ? (
                    'ИИ Ассистент'
                ) : (participant.isOnline ? (
                    <>
                        <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></span>
                        В сети
                    </>
                ) : (
                    'Был(а) недавно'
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <button onClick={() => startCall('audio')} className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Phone size={20} /></button>
          <button onClick={() => startCall('video')} className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Video size={20} /></button>
          <button className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Call Overlay */}
      {callStatus !== 'idle' && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8 animate-fade-in">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                 <img src={participant.avatar} className="w-full h-full object-cover opacity-20 blur-xl" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950/80"></div>
             </div>
             
             <div className="relative z-10 flex flex-col items-center flex-1 justify-center w-full max-w-sm">
                 <div className="relative mb-8">
                     {callStatus === 'calling' && (
                         <div className="absolute inset-0 bg-violet-500 rounded-full animate-pulse-ring"></div>
                     )}
                     <img src={participant.avatar} className="w-32 h-32 rounded-full border-4 border-slate-800 relative z-10 shadow-2xl" />
                 </div>
                 
                 <h2 className="text-2xl font-bold text-white mb-2">{participant.name}</h2>
                 <p className="text-violet-300 font-medium mb-8">
                     {callStatus === 'calling' ? 'Звонок...' : formatCallDuration(callDuration)}
                 </p>
                 
                 <div className="flex items-center gap-6">
                     <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-800/80 text-white hover:bg-slate-700'}`}
                     >
                         {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                     </button>
                     
                     <button 
                        onClick={endCall}
                        className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transform hover:scale-110 transition-all"
                     >
                         <PhoneOff size={32} />
                     </button>
                     
                     {callType === 'video' && (
                        <button 
                            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                            className={`p-4 rounded-full transition-all ${!isVideoEnabled ? 'bg-white text-slate-900' : 'bg-slate-800/80 text-white hover:bg-slate-700'}`}
                        >
                            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                     )}
                 </div>
             </div>
          </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {chat.messages.map((msg, index) => {
          const isMe = msg.senderId === currentUser.id;
          const showAvatar = !isMe && (index === 0 || chat.messages[index - 1].senderId !== msg.senderId);
          const isHovered = hoveredMessageId === msg.id;
          const isEditingThis = editingMessageId === msg.id;

          return (
            <div 
                key={msg.id} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 animate-slide-up relative group/messageRow`}
                onMouseEnter={() => !isEditingThis && setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                style={{ zIndex: isHovered || isEditingThis ? 50 : 'auto' }}
            >
                {!isMe && (
                    <div className={`w-8 h-8 mr-2 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                        <img src={participant.avatar} className="w-8 h-8 rounded-full" />
                    </div>
                )}
              
              {/* Message Row Wrapper */}
              <div className="relative max-w-[75%] md:max-w-[65%] flex flex-col group/bubbleContainer">
                  
                  {/* Message Bubble */}
                  <div 
                    className={`px-3 py-2 rounded-2xl relative shadow-sm overflow-hidden z-0 ${
                      isMe 
                        ? 'bg-violet-600 text-white rounded-br-sm shadow-violet-900/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700 shadow-md'
                    } ${isEditingThis ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                  >
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                            {msg.attachments.map(att => (
                                <div key={att.id}>
                                    {att.type === 'image' ? (
                                        <img src={att.url} alt="Attachment" className="rounded-lg max-h-60 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity" />
                                    ) : att.type === 'video' ? (
                                        <div className="rounded-lg overflow-hidden bg-black max-h-60 w-full relative group/video">
                                            <video src={att.url} controls className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 bg-black/5 dark:bg-black/20 p-3 rounded-lg">
                                            <div className="p-2 bg-black/5 dark:bg-white/10 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{att.name}</div>
                                                <div className="text-xs opacity-70">{att.size}</div>
                                            </div>
                                            <a href={att.url} download={att.name} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full">
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {isEditingThis ? (
                        <div className="min-w-[200px]">
                            <input 
                                ref={editInputRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                className="w-full bg-black/20 text-white p-2 rounded focus:outline-none mb-2"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={cancelEdit} className="p-1 hover:bg-white/10 rounded"><X size={14} /></button>
                                <button onClick={saveEdit} className="p-1 bg-white/20 hover:bg-white/30 rounded"><Check size={14} /></button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                             <p className="whitespace-pre-wrap text-[15px] leading-relaxed break-words relative z-10 pr-2">
                                {msg.text}
                                {msg.isEdited && <span className="text-[10px] opacity-60 ml-1 italic">(ред.)</span>}
                            </p>
                            <div className={`text-[10px] mt-1 flex items-center justify-end gap-1.5 ${isMe ? 'text-violet-200/80' : 'text-slate-400 dark:text-slate-500'}`}>
                                <span>{formatTime(msg.timestamp)}</span>
                                {isMe && (
                                    <span title={msg.status}>
                                        {getStatusIcon(msg.status)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                  </div>
                  
                  {/* Reactions Display (Below bubble) */}
                  {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 relative z-0 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {msg.reactions.map((reaction, i) => (
                              <button 
                                key={i}
                                onClick={() => onReaction(msg.id, reaction.emoji)}
                                className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 transition-colors ${
                                    reaction.userId === currentUser.id 
                                        ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/50 text-violet-700 dark:text-violet-200' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                  <span>{reaction.emoji}</span>
                                  <span className="font-semibold">{reaction.count > 1 ? reaction.count : ''}</span>
                              </button>
                          ))}
                      </div>
                  )}

                  {/* Message Actions (Reaction + Edit) */}
                  <div 
                    className={`absolute top-2 transition-opacity duration-200 z-50 ${isMe ? '-left-16' : '-right-8'} ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                  >
                      <div className="flex gap-1">
                          {/* Edit Button (Only for me) */}
                          {isMe && (
                              <button 
                                onClick={() => startEditing(msg)}
                                className="p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-violet-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700"
                                title="Редактировать"
                              >
                                  <Pencil size={14} />
                              </button>
                          )}

                          <div className="relative group/reaction">
                              {/* Invisible bridge prevents closing when moving mouse */}
                              <div className="absolute -inset-4 bg-transparent z-0 hidden group-hover/reaction:block"></div>

                              <button className="relative z-10 p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-violet-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700">
                                 <Smile size={14} />
                              </button>
                              
                              {/* Quick Reaction Popover */}
                              <div className={`absolute bottom-full mb-2 hidden group-hover/reaction:flex z-50 ${isMe ? 'right-0' : 'left-0'}`}>
                                   {/* Bridge for the popover gap */}
                                   <div className="absolute top-full w-full h-4 bg-transparent"></div>
                                   
                                   <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-xl p-1.5 flex gap-1 animate-slide-up whitespace-nowrap">
                                      {REACTION_EMOJIS.map(emoji => (
                                          <button 
                                            key={emoji}
                                            onClick={() => onReaction(msg.id, emoji)}
                                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all hover:scale-125 transform"
                                          >
                                              {emoji}
                                          </button>
                                      ))}
                                      <button 
                                        onClick={() => {
                                            onReaction(msg.id, '👍'); 
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
                                      >
                                          <Plus size={16} />
                                      </button>
                                   </div>
                              </div>
                          </div>
                      </div>
                  </div>

              </div>
            </div>
          );
        })}
        {chat.isTyping && (
             <div className="flex justify-start mb-1 animate-slide-up">
                 <div className="w-8 h-8 mr-2 flex-shrink-0">
                        <img src={participant.avatar} className="w-8 h-8 rounded-full" />
                 </div>
                 <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center h-10">
                     <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
        
        {/* Attachment Previews */}
        {selectedFiles.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 px-1">
                {selectedFiles.map(file => (
                    <div key={file.id} className="relative group flex-shrink-0">
                        {file.type === 'image' ? (
                            <img src={file.url} className="h-16 w-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                        ) : file.type === 'video' ? (
                            <div className="h-16 w-16 bg-black rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                                <video src={file.url} className="h-full w-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play size={20} className="text-white fill-white" />
                                </div>
                            </div>
                        ) : (
                            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-1">
                                <FileText size={20} className="text-slate-400 mb-1" />
                                <span className="text-[8px] text-slate-500 w-full text-center truncate">{file.name}</span>
                            </div>
                        )}
                        <button 
                            onClick={() => removeAttachment(file.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
            <>
            <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)}></div>
            <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 grid grid-cols-6 gap-1 w-72 z-20">
                {INPUT_EMOJIS.map(emoji => (
                    <button 
                        key={emoji}
                        onClick={() => {
                            setInputText(prev => prev + emoji);
                            // Keep picker open for multiple selections
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xl transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            </>
        )}

        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple 
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-xl"
          >
            <Paperclip size={20} />
          </button>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFiles.length > 0 ? "Добавьте подпись..." : "Напишите сообщение..."}
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none max-h-32 py-2"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-xl ${showEmojiPicker ? 'text-violet-500 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Smile size={20} />
          </button>

          <button 
            onClick={handleSend}
            disabled={!inputText.trim() && selectedFiles.length === 0}
            className={`p-2 rounded-xl transition-all ${
                inputText.trim() || selectedFiles.length > 0
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 scale-100' 
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 scale-95 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};