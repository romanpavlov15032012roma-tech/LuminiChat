import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Generate a random 6-digit unique code
      const uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();

      const newUser: User = {
        id: 'me', // Keeping 'me' to sync with mock chat data
        name: isRegistering ? name : (email.split('@')[0] || 'User'),
        email: email,
        phoneNumber: '',
        uniqueCode: uniqueCode,
        avatar: isRegistering && avatarUrl 
          ? avatarUrl 
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        isOnline: true,
      };
      
      onLogin(newUser);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-200">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>

        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 transition-colors duration-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Lumini Chat</h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isRegistering ? 'Создайте новый аккаунт' : 'С возвращением!'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Имя</label>
                <input
                  type="text"
                  required={isRegistering}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                  placeholder="Как вас зовут?"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="ваш@email.com"
              />
            </div>

            {isRegistering && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Ссылка на аватар (необязательно)</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                    placeholder="https://..."
                  />
                </div>
            )}
            
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-violet-600/30 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                        <>
                           {isRegistering ? 'Зарегистрироваться' : 'Войти'}
                           <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
             <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm transition-colors"
             >
                {isRegistering 
                    ? 'Уже есть аккаунт? Войти' 
                    : 'Нет аккаунта? Зарегистрироваться'}
             </button>
          </div>
          
          <div className="mt-6 flex justify-center gap-2 text-xs text-slate-500 dark:text-slate-600">
             <Lock size={12} />
             <span>Защищенное end-to-end шифрование (Demo)</span>
          </div>
        </div>
    </div>
  );
};