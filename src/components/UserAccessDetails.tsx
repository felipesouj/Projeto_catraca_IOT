import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUserAccessLogs } from "@/hooks/useUserAccessLogs";
import { useUsers } from "@/hooks/useUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, XCircle } from "lucide-react";

interface UserAccessDetailsProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserAccessDetails = ({ userId, open, onOpenChange }: UserAccessDetailsProps) => {
  const { logs, isLoading } = useUserAccessLogs(userId);
  const { users } = useUsers();
  
  const user = users.find((u) => u.id === userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Histórico de Acessos - {user?.name}
          </DialogTitle>
          {user && (
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <span>{user.email}</span>
              <span>•</span>
              <span className="font-mono">{user.rfid_card}</span>
              <Badge
                variant={user.status === "active" ? "default" : "destructive"}
                className={user.status === "active" ? "bg-success hover:bg-success" : ""}
              >
                {user.status === "active" ? "Ativo" : "Bloqueado"}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : logs.length === 0 ? (
            <Card className="p-8 text-center border-border">
              <p className="text-muted-foreground">Nenhum acesso registrado</p>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="p-4 border-border hover:bg-secondary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {log.status === "sucesso" ? (
                        log.tipo_acesso === "entry" ? (
                          <ArrowDownCircle className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-primary" />
                        )
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {log.tipo_acesso === "entry" ? "Entrada" : "Saída"}
                        </Badge>
                        <Badge 
                          variant={log.status === "sucesso" ? "default" : "destructive"}
                          className={log.status === "sucesso" ? "bg-success hover:bg-success text-xs" : "text-xs"}
                        >
                          {log.status}
                        </Badge>
                      </div>
                      {log.observacao && (
                        <p className="text-sm text-muted-foreground">
                          {log.observacao}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-foreground">
                      {format(new Date(log.data_hora), "HH:mm:ss")}
                    </div>
                    <div className="text-muted-foreground">
                      {format(new Date(log.data_hora), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {logs.length > 0 && (
          <div className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
            Total de acessos: {logs.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserAccessDetails;
