import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export interface AccessLog {
  id: string;
  id_usuario: string;
  tipo_acesso: "entry" | "exit";
  data_hora: string;
  status: string;
  observacao: string | null;
  users: {
    name: string;
    email: string;
  };
}

export const useAccessLogs = (limit = 50) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["access-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registros_acesso")
        .select(`
          *,
          users (name, email)
        `)
        .order("data_hora", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AccessLog[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("registros-acesso-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "registros_acesso",
        },
        (payload) => {
          console.log("Novo registro de acesso:", payload);
          toast.success("Nova passagem registrada!");
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { logs: data || [], isLoading, error, refetch };
};
