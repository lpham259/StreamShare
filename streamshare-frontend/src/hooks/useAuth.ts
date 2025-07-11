'use client';

import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Call the function to create/update user document
    const createUserDoc = httpsCallable(functions, 'createUserDocument');
    try {
      await createUserDoc();
    } catch (error) {
      console.log('User document creation failed:', error);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return { user, loading, signIn, signOutUser };
}