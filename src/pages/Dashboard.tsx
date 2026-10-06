import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardStats from "@/components/DashboardStats";
import UsersTable from "@/components/UsersTable";
import ActivityLog from "@/components/ActivityLog";
import UserAccessDetails from "@/components/UserAccessDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  const handleViewUserDetails = (userId: string) => {
    setSelectedUserId(userId);
    setUserDetailsOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    onLogout();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <UserAccessDetails 
        userId={selectedUserId} 
        open={userDetailsOpen} 
        onOpenChange={setUserDetailsOpen}
      />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "users" && "Gerenciamento de Usuários"}
              {activeTab === "activity" && "Histórico de Passagens"}
            </h2>
            <p className="text-muted-foreground">
              {activeTab === "dashboard" && "Visão geral do sistema de controle de catracas RFID"}
              {activeTab === "users" && "Gerencie usuários e controle de acesso aos cartões RFID"}
              {activeTab === "activity" && "Histórico completo de passagens pelas catracas"}
            </p>
          </div>

          {activeTab === "dashboard" && (
            <>
              <DashboardStats />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Usuários Cadastrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UsersTable onViewDetails={handleViewUserDetails} />
                  </CardContent>
                </Card>

                <ActivityLog />
              </div>
            </>
          )}

          {activeTab === "users" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Todos os Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersTable onViewDetails={handleViewUserDetails} />
              </CardContent>
            </Card>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              <ActivityLog />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
