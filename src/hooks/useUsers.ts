import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  rfid_card: string;
  status: "active" | "blocked";
  created_at: string;
}

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as User[];
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({
      userId,
      currentStatus,
    }: {
      userId: string;
      currentStatus: "active" | "blocked";
    }) => {
      const newStatus = currentStatus === "active" ? "blocked" : "active";
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;
      return { userId, newStatus };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        `Usuário ${result.newStatus === "blocked" ? "bloqueado" : "desbloqueado"} com sucesso!`
      );
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status do usuário");
      console.error(error);
    },
  });

  return {
    users: data || [],
    isLoading,
    error,
    toggleUserStatus: toggleUserStatus.mutate,
    isUpdating: toggleUserStatus.isPending,
  };
};
