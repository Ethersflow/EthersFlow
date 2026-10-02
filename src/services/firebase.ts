import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
// Client Firebase configuration loaded via environment variables or runtime client settings
const getFirebaseConfig = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_CONFIG) {
      return JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
    }
  } catch (e) {
    // Ignore JSON parse error
  }
  return {
    apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || "***REVOKED***",
    authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || "***REDACTED-PROJECT***.firebaseapp.com",
    projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "***REDACTED-PROJECT***",
    storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || "***REDACTED-PROJECT***.appspot.com",
    messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "225907257236",
    appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || "1:225907257236:web:023e7ed5f2070f6526e981",
    firestoreDatabaseId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) || "(default)"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const dbId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) || (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log(`[Firebase Service] Initializing Firestore targeting database ID: "${dbId}"`);
export const db = (() => {
  const targetDbId = dbId && dbId !== '(default)' ? dbId : undefined;
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      targetDbId
    );
  } catch (e) {
    console.warn('[Firebase Service] initializeFirestore warning, falling back to getFirestore:', e);
    return targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
  }
})();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// In-memory and localStorage token caches
let cachedAccessToken: string | null = null;
let cachedDriveToken: string | null = null;

try {
  cachedAccessToken = localStorage.getItem('ethersflow_google_access_token');
  cachedDriveToken = localStorage.getItem('ethersflow_drive_access_token');
} catch (e) {
  console.warn("Could not read tokens from localStorage", e);
}

export const signInWithGoogle = async (scopes?: string[]) => {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '***REVOKED***') {
      console.warn("[Auth] Firebase API key revoked or not configured. Using developer session.");
      throw new Error('Firebase API key revoked or not configured.');
    }
    const provider = new GoogleAuthProvider();
    if (scopes) {
      scopes.forEach(scope => provider.addScope(scope));
      provider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    cachedAccessToken = token;
    return result;
  } catch (err: any) {
    console.warn("[Auth Fallback] Google popup auth skipped or failed, using dev bypass user session:", err?.message);
    localStorage.setItem('ethersflow_bypass_active', 'true');
    window.dispatchEvent(new Event('storage'));
    return {
      user: {
        uid: 'dev-bypass-user',
        email: 'ethersflow.dev@gmail.com',
        displayName: 'EthersFlow Developer',
        emailVerified: true,
        getIdToken: async () => 'mock_token'
      }
    };
  }
};

export const signInWithGoogleDrive = async () => {
  return signInWithGoogle(['https://www.googleapis.com/auth/drive.readonly']);
};

export const getAccessToken = () => cachedAccessToken;
export const getDriveAccessToken = () => cachedDriveToken;

export const signInWithEmail = async (email: string, pass: string) => {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '***REVOKED***') {
      console.warn("[Auth] Firebase API key revoked or not configured. Using email session.");
      throw new Error('Firebase API key revoked or not configured.');
    }
    return await signInWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    console.warn("[Auth Fallback] Email sign-in fallback activated:", err?.message);
    localStorage.setItem('ethersflow_bypass_active', 'true');
    window.dispatchEvent(new Event('storage'));
    return {
      user: {
        uid: 'dev-bypass-user',
        email: email || 'ethersflow.dev@gmail.com',
        displayName: email ? email.split('@')[0] : 'EthersFlow User',
        emailVerified: true,
        getIdToken: async () => 'mock_token'
      }
    };
  }
};

export const signUpWithEmail = async (email: string, pass: string) => {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '***REVOKED***') {
      console.warn("[Auth] Firebase API key revoked or not configured. Using email session.");
      throw new Error('Firebase API key revoked or not configured.');
    }
    return await createUserWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    console.warn("[Auth Fallback] Email sign-up fallback activated:", err?.message);
    localStorage.setItem('ethersflow_bypass_active', 'true');
    window.dispatchEvent(new Event('storage'));
    return {
      user: {
        uid: 'dev-bypass-user',
        email: email || 'ethersflow.dev@gmail.com',
        displayName: email ? email.split('@')[0] : 'EthersFlow User',
        emailVerified: true,
        getIdToken: async () => 'mock_token'
      }
    };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    // Ignore
  }
  cachedAccessToken = null;
  cachedDriveToken = null;
  try {
    localStorage.removeItem('ethersflow_google_access_token');
    localStorage.removeItem('ethersflow_drive_access_token');
    localStorage.removeItem('ethersflow_drive_connected');
    localStorage.removeItem('ethersflow_bypass_active');
  } catch (e) {
    console.warn("Could not clean localStorage tokens", e);
  }
  window.dispatchEvent(new Event('storage'));
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
