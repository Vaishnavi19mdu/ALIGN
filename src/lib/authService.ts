import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export type UserRole = "volunteer" | "org_admin" | "org_staff";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  createdAt: any;
  // volunteer fields
  fullName?: string;
  location?: string;
  skills?: string[];
  phone?: string;
  availability?: string[];
  notifications?: boolean;
  // org_admin fields
  orgName?: string;
  orgType?: string;
  orgSize?: string;
  orgWebsite?: string;
  regNum?: string;
  status?: "pending" | "approved" | "rejected"; // for org_admin approval
  orgCode?: string; // assigned after approval
  // org_staff fields
  orgCodeUsed?: string; // code they joined with
}

// ── Volunteer signup ─────────────────────────────────────────────────────────
export const signUpVolunteer = async (
  email: string,
  password: string,
  data: { fullName: string; location: string; skills: string[] }
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    role: "volunteer",
    isAdmin: false,
    createdAt: serverTimestamp(),
    ...data,
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  return cred;
};

// ── Org Admin signup ─────────────────────────────────────────────────────────
export const signUpOrgAdmin = async (
  email: string,
  password: string,
  data: {
    fullName: string;
    orgName: string;
    orgType: string;
    orgSize: string;
    orgWebsite: string;
    regNum: string;
  }
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    role: "org_admin",
    isAdmin: false,
    status: "pending",
    createdAt: serverTimestamp(),
    ...data,
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  return cred;
};

// ── Org Staff signup ─────────────────────────────────────────────────────────
export const signUpOrgStaff = async (
  email: string,
  password: string,
  data: { fullName: string; orgCodeUsed: string }
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile: UserProfile = {
    uid: cred.user.uid,
    email,
    role: "org_staff",
    isAdmin: false,
    status: "pending",
    createdAt: serverTimestamp(),
    ...data,
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  return cred;
};

// ── Sign in & fetch profile ──────────────────────────────────────────────────
export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  const profile = snap.data() as UserProfile;
  return { cred, profile };
};

export const logOut = () => signOut(auth);

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};