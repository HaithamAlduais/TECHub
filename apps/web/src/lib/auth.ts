import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    UserCredential,
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  // Register
  export const register = (email: string, password: string): Promise<UserCredential> =>
    createUserWithEmailAndPassword(auth, email, password);
  
  // Login
  export const login = (email: string, password: string): Promise<UserCredential> =>
    signInWithEmailAndPassword(auth, email, password);
  
  // Google login
  export const loginWithGoogle = (): Promise<UserCredential> =>
    signInWithPopup(auth, new GoogleAuthProvider());
  
  // Logout
  export const logout = (): Promise<void> =>
    signOut(auth);
  
  // Password reset
  export const resetPassword = (email: string): Promise<void> =>
    sendPasswordResetEmail(auth, email);
  
  // Get current user's ID token (for backend API calls)
  export const getIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  };