import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserProfile {
  name: string;
  jobTitle: string;
  company: string;
  department: string;
  industry: string;
  certifications: string;
  experience: string;
}

const EMPTY_PROFILE: UserProfile = {
  name: "",
  jobTitle: "",
  company: "",
  department: "",
  industry: "",
  certifications: "",
  experience: "",
};

interface ProfileContextValue {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  hasProfile: boolean;
  profileSummary: string;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);
const STORAGE_KEY = "safeguard_profile";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setProfile({ ...EMPTY_PROFILE, ...JSON.parse(data) });
        } catch {}
      }
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const hasProfile = useMemo(() => {
    return !!(profile.name || profile.jobTitle || profile.company);
  }, [profile]);

  const profileSummary = useMemo(() => {
    const parts: string[] = [];
    if (profile.name) parts.push(`Name: ${profile.name}`);
    if (profile.jobTitle) parts.push(`Job Title: ${profile.jobTitle}`);
    if (profile.company) parts.push(`Company: ${profile.company}`);
    if (profile.department) parts.push(`Department: ${profile.department}`);
    if (profile.industry) parts.push(`Industry: ${profile.industry}`);
    if (profile.certifications) parts.push(`Certifications: ${profile.certifications}`);
    if (profile.experience) parts.push(`Experience: ${profile.experience}`);
    return parts.join("\n");
  }, [profile]);

  const value = useMemo(
    () => ({ profile, updateProfile, hasProfile, profileSummary }),
    [profile, updateProfile, hasProfile, profileSummary],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
