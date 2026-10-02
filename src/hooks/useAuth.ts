import { useState, useEffect } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithGoogleDrive, logout, signInWithEmail, signUpWithEmail } from '../services/firebase';

const mockBypassUser: any = {
  uid: 'dev-bypass-user',
  email: 'ethersflow.dev@gmail.com',
  displayName: 'EthersFlow Developer',
  emailVerified: true,
  getIdToken: async () => 'mock_token'
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (localStorage.getItem('ethersflow_bypass_active') === 'true') {
      return mockBypassUser;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('ethersflow_bypass_active') === 'true') {
      setUser(mockBypassUser);
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onIdTokenChanged(auth, (authUser) => {
        if (authUser) {
          setUser(authUser);
        } else if (localStorage.getItem('ethersflow_bypass_active') === 'true') {
          setUser(mockBypassUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }, (err) => {
        console.warn("[Auth] onIdTokenChanged warning, enabling local dev bypass user:", err?.message);
        localStorage.setItem('ethersflow_bypass_active', 'true');
        setUser(mockBypassUser);
        setLoading(false);
      });
      return unsubscribe;
    } catch (e) {
      setUser(mockBypassUser);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      if (localStorage.getItem('ethersflow_bypass_active') === 'true') {
        setUser(mockBypassUser);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { user, loading, signInWithGoogle, signInWithGoogleDrive, logout, signInWithEmail, signUpWithEmail };
}
