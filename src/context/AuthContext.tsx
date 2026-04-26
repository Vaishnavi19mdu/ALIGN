import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../lib/authService";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (u) => {
      // Tear down any previous profile listener immediately
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      setUser(u);
      setProfile(null); // clear stale profile right away

      if (u) {
        // Real-time listener on this user's Firestore doc —
        // any change (e.g. admin toggling canCreateTask, status → approved)
        // will push a new profile object here automatically.
        profileUnsub = onSnapshot(
          doc(db, "users", u.uid),
          (snap) => {
            if (snap.exists()) {
              setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          () => {
            // Permission error or network hiccup — clear and unblock UI
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isAdmin: profile?.isAdmin ?? false }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);