import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import * as A from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as F from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6P1nF6TJ4e9eb8iCNyonRxHL6dRVKE1U",
  authDomain: "friendship-portal-be0b8.firebaseapp.com",
  projectId: "friendship-portal-be0b8",
  storageBucket: "friendship-portal-be0b8.firebasestorage.app",
  messagingSenderId: "998673536499",
  appId: "1:998673536499:web:3b317bd76e670633bb6e86"
};

const app = initializeApp(firebaseConfig);
export const auth = A.getAuth(app);
export const db = F.getFirestore(app);
export { A, F };