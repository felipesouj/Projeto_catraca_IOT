import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalAccesses: number;
  todayAccesses: number;
}

export const useStats = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      // Count total users
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Count active users
      const { count: activeUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Count blocked users
      const { count: blockedUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "blocked");

      // Count total accesses
      const { count: totalAccesses } = await supabase
        .from("registros_acesso")
        .select("*", { count: "exact", head: true });

      // Count today's accesses
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayAccesses } = await supabase
        .from("registros_acesso")
        .select("*", { count: "exact", head: true })
        .gte("data_hora", today.toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        blockedUsers: blockedUsers || 0,
        totalAccesses: totalAccesses || 0,
        todayAccesses: todayAccesses || 0,
      } as Stats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    stats: data || {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      totalAccesses: 0,
      todayAccesses: 0,
    },
    isLoading,
    error,
  };
};
