import { useState, useEffect } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithGoogleDrive, logout, signInWithEmail, signUpWithEmail } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, signInWithGoogle, signInWithGoogleDrive, logout, signInWithEmail, signUpWithEmail };
}
