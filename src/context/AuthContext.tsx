import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile, UserProfile } from "../lib/authService";

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setProfile(null); // ✅ clear immediately — no stale profile while fetch is in-flight
      
      if (u) {
        try {
          const p = await getUserProfile(u.uid);
          // ✅ guard: make sure the user hasn't changed again by the time fetch resolves
          setUser(current => {
            if (current?.uid === u.uid) {
              setProfile(p);
            }
            return current;
          });
        } catch {
          setProfile(null);
        }
      }
      
      setLoading(false);
    });
    return unsub;
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