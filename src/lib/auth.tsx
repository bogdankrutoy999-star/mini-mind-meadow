import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext<{ user: User | null; ready: boolean; username: string }>({ user: null, ready: false, username: "" });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) { setUser(data.user); setReady(true); }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)) return;
      if (event === "SIGNED_OUT") { setUser(null); queryClient.clear(); }
      else { void refresh(); void queryClient.invalidateQueries(); }
      void router.invalidate();
    });
    void refresh();
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  const profile = useQuery({ queryKey: ["profile", user?.id], enabled: Boolean(user), queryFn: async () => {
    const { data, error } = await supabase.from("profiles").select("username").eq("id", user?.id ?? "").single();
    if (error) throw error;
    return data;
  } });
  return <AuthContext.Provider value={{ user, ready, username: profile.data?.username ?? "" }}>{children}</AuthContext.Provider>;
}
export const useMiniAuth = () => useContext(AuthContext);