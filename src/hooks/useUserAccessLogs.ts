import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AccessLog } from "./useAccessLogs";

export const useUserAccessLogs = (userId: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-access-logs", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("registros_acesso")
        .select(`
          *,
          users (name, email)
        `)
        .eq("id_usuario", userId)
        .order("data_hora", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AccessLog[];
    },
    enabled: !!userId,
  });

  return { logs: data || [], isLoading, error };
};
