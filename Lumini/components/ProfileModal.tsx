import React, { useState, useRef } from 'react';
import { User } from '../types';
import { X, Camera, Save, LogOut, Moon, Sun, Copy, Check } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onLogout: () => void;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onUpdate, onLogout, onClose, isDarkMode, toggleTheme }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
        onUpdate({ ...user, name, avatar });
        setIsSaving(false);
        onClose();
    }, 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setAvatar(event.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const copyCode = () => {
      if (user.uniqueCode) {
          navigator.clipboard.writeText(user.uniqueCode);
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2000);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden transition-colors duration-200">
        
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600 relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Avatar Section */}
        <div className="relative px-6 -mt-16 mb-6 text-center">
            <div className="relative inline-block group">
                <img 
                    src={avatar} 
                    alt={name} 
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 object-cover bg-slate-100 dark:bg-slate-800"
                />
                <label className="absolute bottom-0 right-0 p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-full border-4 border-white dark:border-slate-900 cursor-pointer transition-colors shadow-lg">
                    <Camera size={18} />
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </label>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 space-y-5">
            
            {/* Unique Code Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Ваш уникальный код</span>
                    <span className="font-mono text-lg font-bold text-slate-800 dark:text-slate-200 tracking-widest">{user.uniqueCode || '---'}</span>
                </div>
                <button 
                    onClick={copyCode}
                    className={`p-2 rounded-lg transition-colors ${copiedCode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-violet-500'}`}
                    title="Скопировать код"
                >
                    {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Отображаемое имя</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Темная тема</span>
                    <button 
                        onClick={toggleTheme}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${isDarkMode ? 'bg-violet-600' : 'bg-slate-300'}`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                            {isDarkMode ? <Moon size={14} className="text-violet-600" /> : <Sun size={14} className="text-orange-400" />}
                        </div>
                    </button>
                </div>
            </div>

            <div className="pt-2 flex gap-3">
                <button 
                    onClick={onLogout}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-500/30"
                >
                    <LogOut size={18} />
                    <span>Выйти</span>
                </button>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-[2] py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                >
                    {isSaving ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Сохранить</span>
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};