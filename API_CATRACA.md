# API de Integração - Sistema de Catracas RFID

Esta documentação descreve como integrar suas catracas RFID com o sistema de controle de acesso.

## Endpoint de Validação de Acesso

### POST /functions/v1/turnstile-access

Este endpoint deve ser chamado toda vez que um cartão RFID for apresentado em uma catraca.

#### Headers Necessários
```
Content-Type: application/json
apikey: [sua-chave-supabase-anon-key]
```

#### Corpo da Requisição (JSON)
```json
{
  "rfid_card": "1234567890ABCD",
  "tipo_acesso": "entry"
}
```

**Campos:**
- `rfid_card` (string, obrigatório): Código do cartão RFID lido
- `tipo_acesso` (string, obrigatório): Tipo de acesso - "entry" (entrada) ou "exit" (saída)

#### Respostas

**Acesso Autorizado (200 OK)**
```json
{
  "access": true,
  "status": "sucesso",
  "user": {
    "id": "uuid-do-usuario",
    "name": "João Silva",
    "email": "joao@exemplo.com"
  }
}
```

**Acesso Negado - Cartão Não Cadastrado (200 OK)**
```json
{
  "access": false,
  "status": "negado",
  "observacao": "Cartão RFID não cadastrado"
}
```

**Acesso Negado - Usuário Bloqueado (200 OK)**
```json
{
  "access": false,
  "status": "bloqueado",
  "observacao": "Usuário bloqueado"
}
```

**Erro no Servidor (500)**
```json
{
  "error": "mensagem de erro"
}
```

## Estrutura do Banco de Dados

### Tabela: registros_acesso
- `id` (uuid): ID único do registro
- `id_usuario` (uuid): ID do usuário que passou pela catraca
- `data_hora` (timestamp): Data e hora do acesso
- `tipo_acesso` (texto): "entry" (entrada) ou "exit" (saída)
- `status` (texto): "sucesso", "negado", "bloqueado"
- `observacao` (texto, opcional): Informações adicionais sobre o acesso

### Tabela: users
- `id` (uuid): ID único do usuário
- `name` (texto): Nome do usuário
- `email` (texto): Email do usuário
- `rfid_card` (texto): Código do cartão RFID
- `status` (texto): "active" (ativo) ou "blocked" (bloqueado)
- `created_at` (timestamp): Data de criação

## Fluxo de Integração

1. **Leitura do Cartão**: Quando um cartão RFID é aproximado da catraca
2. **Chamada à API**: A catraca faz uma requisição POST ao endpoint com os dados
3. **Validação**: O sistema verifica se o cartão está cadastrado e se o usuário está ativo
4. **Resposta**: A API retorna se o acesso foi autorizado ou negado
5. **Ação da Catraca**: A catraca libera ou bloqueia a passagem baseado na resposta
6. **Registro**: Todo acesso (autorizado ou negado) é registrado no banco de dados

## Exemplos de Código

### cURL
```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/turnstile-access \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave-anon" \
  -d '{
    "rfid_card": "1234567890ABCD",
    "tipo_acesso": "entry"
  }'
```

### Python
```python
import requests

url = "https://seu-projeto.supabase.co/functions/v1/turnstile-access"
headers = {
    "Content-Type": "application/json",
    "apikey": "sua-chave-anon"
}
data = {
    "rfid_card": "1234567890ABCD",
    "tipo_acesso": "entry"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()

if result.get("access"):
    print(f"Acesso autorizado para: {result['user']['name']}")
else:
    print(f"Acesso negado: {result.get('observacao')}")
```

### Arduino/ESP32
```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

void validateAccess(String rfidCard) {
  HTTPClient http;
  
  String url = "https://seu-projeto.supabase.co/functions/v1/turnstile-access";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", "sua-chave-anon");
  
  StaticJsonDocument<200> doc;
  doc["rfid_card"] = rfidCard;
  doc["tipo_acesso"] = "entry";
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    StaticJsonDocument<512> responseDoc;
    deserializeJson(responseDoc, response);
    
    bool access = responseDoc["access"];
    if (access) {
      // Liberar catraca
      digitalWrite(LOCK_PIN, HIGH);
    } else {
      // Negar acesso
      digitalWrite(BUZZER_PIN, HIGH);
    }
  }
  
  http.end();
}
```

## Configuração Inicial

1. **Cadastrar Usuários**: Adicione usuários e seus cartões RFID na tabela `users`
2. **Configurar sua Catraca**: Configure o endpoint e as credenciais no firmware da catraca
3. **Testar**: Realize testes de acesso para garantir o funcionamento

## Logs e Monitoramento

Todas as tentativas de acesso (permitidas ou negadas) são registradas automaticamente na tabela `registros_acesso` e podem ser visualizadas em tempo real no painel administrativo.

## Suporte

Para dúvidas ou problemas na integração, entre em contato com a equipe de TI.
