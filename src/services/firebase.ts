import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log(`[Firebase Service] Initializing Firestore targeting database ID: "${dbId}"`);
export const db = dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
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
  const provider = new GoogleAuthProvider();
  if (scopes) {
    scopes.forEach(scope => provider.addScope(scope));
    // Force Google to prompt the user for consent to ensure the scopes are requested and granted
    provider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });
  }
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken || null;
  
  if (scopes && scopes.includes('https://www.googleapis.com/auth/drive.readonly')) {
    cachedDriveToken = token;
    try {
      if (token) {
        localStorage.setItem('ethersflow_drive_access_token', token);
        localStorage.setItem('ethersflow_drive_connected', 'true');
      }
    } catch (e) {
      console.warn("Could not save drive token to localStorage", e);
    }
  } else {
    cachedAccessToken = token;
    try {
      if (token) {
        localStorage.setItem('ethersflow_google_access_token', token);
      }
    } catch (e) {
      console.warn("Could not save google token to localStorage", e);
    }
  }
  return result;
};

export const signInWithGoogleDrive = async () => {
  return signInWithGoogle(['https://www.googleapis.com/auth/drive.readonly']);
};

export const getAccessToken = () => cachedAccessToken;
export const getDriveAccessToken = () => cachedDriveToken;

export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const signUpWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedDriveToken = null;
  try {
    localStorage.removeItem('ethersflow_google_access_token');
    localStorage.removeItem('ethersflow_drive_access_token');
    localStorage.removeItem('ethersflow_drive_connected');
  } catch (e) {
    console.warn("Could not clean localStorage tokens", e);
  }
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
