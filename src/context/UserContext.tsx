import { createContext, useContext, useState, ReactNode } from 'react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'staff';
  orgName: string;
}

interface UserContextValue {
  user: UserProfile;
  setUser: (u: Partial<UserProfile>) => void;
  initials: string;
  displayName: string;
}

const defaultUser: UserProfile = {
  firstName: 'Maha Gowri',
  lastName: 'S',
  email: 'mahagowri@impactglobal.org',
  role: 'admin',
  orgName: 'Impact Global NGO',
};

function getInitials(firstName: string, lastName: string) {
  const f = firstName.trim()[0] ?? '';
  const l = lastName.trim()[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserProfile>(defaultUser);

  const setUser = (partial: Partial<UserProfile>) =>
    setUserState(prev => ({ ...prev, ...partial }));

  const initials = getInitials(user.firstName, user.lastName);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <UserContext.Provider value={{ user, setUser, initials, displayName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
};