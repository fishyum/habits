import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

let app: any = null;
let db: any = null;
let auth: any = null;
let provider: any = null;
let isConfigured = false;

// Safe lazy loading of firebase config file
export async function initFirebase() {
  if (isConfigured) return { app, db, auth, provider, isConfigured };
  
  try {
    const firebaseConfig = {
      projectId: "axial-goal-wf4nj",
      appId: "1:685383931428:web:ec08370dd7552a300b6ab1",
      apiKey: "AIzaSyAFyBDXo4Njyg-0pNHrxbHaAT7XyY-Twu8",
      authDomain: "axial-goal-wf4nj.firebaseapp.com",
      firestoreDatabaseId: "ai-studio-67116852-f779-4ed3-8a11-7e4b585dadc1",
      storageBucket: "axial-goal-wf4nj.firebasestorage.app",
      messagingSenderId: "685383931428"
    };
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    
    isConfigured = true;
    console.log("[AGENCY DATABASE] Cloud Synchronization Module fully online.", firebaseConfig.projectId);
    
    // Validate connection test as required by skill specification
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (err: any) {
      if (err instanceof Error && err.message.includes("client is offline")) {
        console.error("Please check your Firebase configuration state.");
      }
    }
  } catch (error) {
    console.log("[AGENCY DATABASE] Operation running in local secure sandbox format. (Cloud storage offline)");
  }
  
  return { app, db, auth, provider, isConfigured };
}

// Access references safely
export function getFirebaseObjects() {
  return { app, db, auth, provider, isConfigured };
}
