import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SiteSettings } from "@/hooks/useAdminSettings";

interface SiteSettingsContextValue {
  settings: SiteSettings | undefined;
  isLoading: boolean;
  error: Error | null;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: undefined,
  isLoading: true,
  error: null,
});

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const settings: Partial<SiteSettings> = {};
      data?.forEach((row: any) => {
        settings[row.setting_key as keyof SiteSettings] = row.setting_value;
      });
      return settings as SiteSettings;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  return (
    <SiteSettingsContext.Provider value={{ settings: data, isLoading, error: error as Error | null }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettingsContext = () => useContext(SiteSettingsContext);
