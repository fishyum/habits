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
    // Check if the configuration is active
    const response = await fetch("/firebase-applet-config.json");
    if (!response.ok) {
      throw new Error("No active firebase config file found");
    }
    const firebaseConfig = await response.json();
    
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
