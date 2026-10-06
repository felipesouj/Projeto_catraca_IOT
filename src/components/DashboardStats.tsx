import { Users, Activity, Ban, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useStats } from "@/hooks/useStats";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  isLoading?: boolean;
}

const StatsCard = ({ title, value, icon, trend, trendUp, isLoading }: StatsCardProps) => (
  <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
    <CardContent className="p-6">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {trend && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${trendUp ? "text-success" : "text-destructive"}`}>
                <TrendingUp className={`h-4 w-4 ${!trendUp && "rotate-180"}`} />
                {trend}
              </p>
            )}
          </div>
          <div className="p-4 bg-primary/10 rounded-xl">
            {icon}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const DashboardStats = () => {
  const { stats, isLoading } = useStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total de Usuários"
        value={stats.totalUsers}
        icon={<Users className="h-8 w-8 text-primary" />}
        isLoading={isLoading}
      />
      <StatsCard
        title="Usuários Ativos"
        value={stats.activeUsers}
        icon={<Activity className="h-8 w-8 text-success" />}
        isLoading={isLoading}
      />
      <StatsCard
        title="Usuários Bloqueados"
        value={stats.blockedUsers}
        icon={<Ban className="h-8 w-8 text-destructive" />}
        isLoading={isLoading}
      />
      <StatsCard
        title="Passagens Hoje"
        value={stats.todayAccesses}
        icon={<TrendingUp className="h-8 w-8 text-accent" />}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardStats;
