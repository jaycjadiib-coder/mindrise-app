import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, cleanFirestoreData } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (name: string, e: string, p: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: (role?: 'user' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: { interests: string[]; dailyGoal: number; mainGoal: string }) => Promise<void>;
  toggleAdminRolePreview: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'mindrise_active_profile';
export const ADMIN_EMAIL = 'jaycjadiib@gmail.com';

const sanitizeUser = (raw: any): UserProfile | null => {
  if (!raw || !raw.id) return null;
  // If it's the old hardcoded demo user, clear it so fresh visitors see landing page & real login
  if (raw.id === 'demo-scholar-01') return null;

  const isUserAdmin = (raw.email?.toLowerCase() === ADMIN_EMAIL);

  return {
    id: raw.id,
    name: raw.name || 'Scholar',
    email: raw.email || '',
    photoURL: raw.photoURL || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    interests: Array.isArray(raw.interests) ? raw.interests : ['Literature', 'Philosophy', 'Science'],
    dailyReadingGoal: typeof raw.dailyReadingGoal === 'number' && !isNaN(raw.dailyReadingGoal) ? raw.dailyReadingGoal : 20,
    yearlyBookGoal: typeof raw.yearlyBookGoal === 'number' && !isNaN(raw.yearlyBookGoal) ? raw.yearlyBookGoal : 12,
    currentStreak: typeof raw.currentStreak === 'number' && !isNaN(raw.currentStreak) ? raw.currentStreak : 1,
    longestStreak: typeof raw.longestStreak === 'number' && !isNaN(raw.longestStreak) ? raw.longestStreak : 1,
    totalReadingMinutes: typeof raw.totalReadingMinutes === 'number' && !isNaN(raw.totalReadingMinutes) ? raw.totalReadingMinutes : 0,
    totalPagesRead: typeof raw.totalPagesRead === 'number' && !isNaN(raw.totalPagesRead) ? raw.totalPagesRead : 0,
    totalBooksCompleted: typeof raw.totalBooksCompleted === 'number' && !isNaN(raw.totalBooksCompleted) ? raw.totalBooksCompleted : 0,
    premium: true,
    premiumPlan: 'yearly',
    role: isUserAdmin ? 'admin' : 'user',
    lastActiveAt: raw.lastActiveAt || new Date().toISOString(),
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    bio: raw.bio || 'Curious reader and explorer of ideas.'
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const isOwnerAdmin = fbUser.email?.toLowerCase() === ADMIN_EMAIL;
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const profileData = snap.data() as UserProfile;
            const updatedProfile: UserProfile = {
              ...profileData,
              id: fbUser.uid,
              email: fbUser.email || profileData.email,
              // Strictly prioritize real Google displayName or registered name
              name: fbUser.displayName || profileData.name || 'Scholar',
              photoURL: fbUser.photoURL || profileData.photoURL,
              // Only ADMIN_EMAIL is admin
              role: isOwnerAdmin ? 'admin' : 'user',
            };
            setUser(updatedProfile);
            localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updatedProfile));
          } else {
            // New user registration
            const chosenName = fbUser.displayName || fbUser.email?.split('@')[0] || 'MindRise Scholar';
            const newProfile: UserProfile = {
              id: fbUser.uid,
              name: chosenName,
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              interests: ['Literature', 'Philosophy', 'Science'],
              dailyReadingGoal: 20,
              yearlyBookGoal: 12,
              currentStreak: 1,
              longestStreak: 1,
              totalReadingMinutes: 0,
              totalPagesRead: 0,
              totalBooksCompleted: 0,
              premium: true,
              role: isOwnerAdmin ? 'admin' : 'user',
              lastActiveAt: new Date().toISOString(),
              onboardingCompleted: true,
            };
            await setDoc(userDocRef, cleanFirestoreData(newProfile));
            setUser(newProfile);
            localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(newProfile));
          }
        } catch (err) {
          console.warn('Firestore user fetch failed, falling back to local session:', err);
        }
      } else {
        // No user logged in via Firebase -> strictly unauthenticated
        setUser(null);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    setFirebaseUser(cred.user);
    const isOwnerAdmin = cred.user.email?.toLowerCase() === ADMIN_EMAIL;
    
    // Check if user exists in Firestore or initialize
    try {
      const userDocRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const profileData = snap.data() as UserProfile;
        const profile: UserProfile = {
          ...profileData,
          id: cred.user.uid,
          email: cred.user.email || email,
          name: profileData.name || cred.user.displayName || email.split('@')[0],
          role: isOwnerAdmin ? 'admin' : 'user',
        };
        setUser(profile);
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (e) {
      console.warn('Could not fetch user profile:', e);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    setFirebaseUser(cred.user);

    const isOwnerAdmin = email.toLowerCase() === ADMIN_EMAIL;
    const newProfile: UserProfile = {
      id: cred.user.uid,
      name: name.trim() || 'MindRise Scholar',
      email: cred.user.email || email,
      createdAt: new Date().toISOString(),
      interests: ['Literature', 'Philosophy', 'Self-Development'],
      dailyReadingGoal: 20,
      yearlyBookGoal: 12,
      currentStreak: 1,
      longestStreak: 1,
      totalReadingMinutes: 0,
      totalPagesRead: 0,
      totalBooksCompleted: 0,
      premium: true,
      role: isOwnerAdmin ? 'admin' : 'user',
      lastActiveAt: new Date().toISOString(),
      onboardingCompleted: true,
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), cleanFirestoreData(newProfile));
    } catch (e) {
      console.warn('Could not save to firestore:', e);
    }

    setUser(newProfile);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(newProfile));
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    setFirebaseUser(res.user);

    const isOwnerAdmin = res.user.email?.toLowerCase() === ADMIN_EMAIL;
    // Strictly preserve Google Name
    const googleName = res.user.displayName || res.user.email?.split('@')[0] || 'MindRise Scholar';

    try {
      const userDocRef = doc(db, 'users', res.user.uid);
      const snap = await getDoc(userDocRef);
      let updatedProfile: UserProfile;

      if (snap.exists()) {
        const profileData = snap.data() as UserProfile;
        updatedProfile = {
          ...profileData,
          id: res.user.uid,
          email: res.user.email || profileData.email,
          name: res.user.displayName || profileData.name || googleName,
          photoURL: res.user.photoURL || profileData.photoURL,
          role: isOwnerAdmin ? 'admin' : 'user',
        };
        await setDoc(userDocRef, cleanFirestoreData(updatedProfile), { merge: true });
      } else {
        updatedProfile = {
          id: res.user.uid,
          name: googleName,
          email: res.user.email || '',
          photoURL: res.user.photoURL || undefined,
          createdAt: new Date().toISOString(),
          interests: ['Literature', 'Philosophy', 'Science'],
          dailyReadingGoal: 20,
          yearlyBookGoal: 12,
          currentStreak: 1,
          longestStreak: 1,
          totalReadingMinutes: 0,
          totalPagesRead: 0,
          totalBooksCompleted: 0,
          premium: true,
          role: isOwnerAdmin ? 'admin' : 'user',
          lastActiveAt: new Date().toISOString(),
          onboardingCompleted: true,
        };
        await setDoc(userDocRef, cleanFirestoreData(updatedProfile));
      }

      setUser(updatedProfile);
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Google login firestore sync error:', e);
    }
  };

  const loginAsDemoUser = async (_role?: 'user' | 'admin') => {
    // Deprecated per user directive: no demo users permitted
    console.info('Demo login disabled. Please sign in with Google or Email.');
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.error(e);
    }
    setFirebaseUser(null);
    setUser(null);
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = sanitizeUser({ ...user, ...data, lastActiveAt: new Date().toISOString() });
    setUser(updated);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));

    if (firebaseUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData(data));
      } catch (e) {
        console.warn('Firestore update failed:', e);
      }
    }
  };

  const completeOnboarding = async (data: { interests: string[]; dailyGoal: number; mainGoal: string }) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      interests: data.interests,
      dailyReadingGoal: data.dailyGoal,
      onboardingCompleted: true,
      bio: `Focusing on ${data.mainGoal}`,
    };
    setUser(updated);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updated));

    if (firebaseUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), cleanFirestoreData({
          interests: data.interests,
          dailyReadingGoal: data.dailyGoal,
          onboardingCompleted: true,
          bio: updated.bio
        }));
      } catch (e) {
        console.warn('Firestore onboarding update failed:', e);
      }
    }
  };

  const toggleAdminRolePreview = () => {
    // Strictly restricted to owner admin
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    updateUserProfile({ role: newRole });
  };

  const isAdmin = Boolean(
    user?.email?.toLowerCase() === ADMIN_EMAIL ||
    firebaseUser?.email?.toLowerCase() === ADMIN_EMAIL
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAdmin,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemoUser,
        logout,
        resetPassword,
        updateUserProfile,
        completeOnboarding,
        toggleAdminRolePreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
