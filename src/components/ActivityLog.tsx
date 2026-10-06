import { Clock, Monitor, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccessLogs } from "@/hooks/useAccessLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ActivityLog = () => {
  const { logs, isLoading } = useAccessLogs(20);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <span>Passagens Recentes</span>
          <span className="text-sm text-muted-foreground font-normal">
            {logs.length} registros
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma passagem registrada
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{log.users.name}</h4>
                      {log.tipo_acesso === "entry" ? (
                        <ArrowRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowLeft className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{log.users.email}</p>
                  </div>
                  <Badge
                    variant={log.status === "sucesso" ? "default" : "destructive"}
                    className={log.status === "sucesso" ? "bg-success hover:bg-success" : ""}
                  >
                    {log.status === "sucesso" ? (
                      <span className="flex items-center gap-1">
                        ✓ {log.tipo_acesso === "entry" ? "Entrada" : "Saída"}
                      </span>
                    ) : (
                      "Negado"
                    )}
                  </Badge>
                </div>

                {log.status !== "sucesso" && log.observacao && (
                  <div className="mb-3 p-2 bg-destructive/10 rounded text-sm text-destructive">
                    {log.observacao}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {format(new Date(log.data_hora), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      Status: {log.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
