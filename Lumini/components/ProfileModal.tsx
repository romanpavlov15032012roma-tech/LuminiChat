import React, { useState } from 'react';
import { User } from '../types';
import { X, Camera, Save, LogOut } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onUpdate, onLogout, onClose }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
        onUpdate({ ...user, name, avatar });
        setIsSaving(false);
        onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        
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
                    className="w-32 h-32 rounded-full border-4 border-slate-900 object-cover bg-slate-800"
                />
                <label className="absolute bottom-0 right-0 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full border-4 border-slate-900 cursor-pointer transition-colors shadow-lg">
                    <Camera size={18} />
                    {/* Mock file input functionality by asking for URL text for simplicity in this demo */}
                    <input 
                        type="button" 
                        className="hidden" 
                        onClick={() => {
                            const url = prompt('Введите URL новой аватарки:', avatar);
                            if (url) setAvatar(url);
                        }}
                    />
                </label>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">{user.name}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 space-y-4">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Отображаемое имя</label>
                <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
            </div>

            <div>
                 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">О себе</label>
                 <textarea 
                    placeholder="Напишите пару слов..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none h-20"
                 ></textarea>
            </div>

            <div className="pt-4 flex gap-3">
                <button 
                    onClick={onLogout}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700 hover:border-red-500/30"
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