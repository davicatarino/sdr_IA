# 📋 Guia de Implementação - SDR IA Agent

Este guia fornece instruções passo a passo para implementar o agente SDR de agendamento via WhatsApp.

## 🎯 Visão Geral do Projeto

O SDR IA Agent é um sistema completo que:
- Recebe mensagens (texto/áudio) via WhatsApp Business API
- Transcreve áudio usando OpenAI Whisper
- Processa intenções usando OpenAI Agents SDK
- Agenda/remarca/cancela reuniões no Google Calendar
- Implementa guardrails de segurança e negócio
- Detecta handoffs para humanos
- Usa vector store para contexto

## 🏗️ Arquitetura Detalhada

### Fluxo de Dados

```
1. WhatsApp → Webhook → Express Server
2. Express → Audio Transcription (Whisper)
3. Text → OpenAI Agents SDK
4. Agent → Tools (Calendar, WhatsApp)
5. Agent → Guardrails Validation
6. Agent → Response Builder
7. Response → WhatsApp API → User
```

### Componentes Principais

- **Webhook Handler**: Recebe e roteia mensagens
- **Audio Transcriber**: Converte áudio em texto
- **SDR Agent**: Processa intenções e executa ações
- **Google Calendar Tool**: Gerencia reuniões
- **WhatsApp Tool**: Envia respostas
- **Guardrails**: Validações de segurança
- **Response Templates**: Respostas padronizadas

## 🛠️ Configuração Inicial

### 1. Ambiente de Desenvolvimento

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env
```

### 2. Configuração do WhatsApp Business API

#### Passo 1: Criar App no Meta for Developers

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Clique em "Criar App"
3. Selecione "Business" como tipo
4. Preencha informações básicas

#### Passo 2: Configurar WhatsApp Business API

1. No painel do app, vá para "Produtos"
2. Adicione "WhatsApp"
3. Configure o número de telefone
4. Obtenha o `ACCESS_TOKEN` e `PHONE_NUMBER_ID`

#### Passo 3: Configurar Webhook

1. Em "WhatsApp" → "Configuração"
2. Adicione URL do webhook: `https://your-domain.com/webhook`
3. Defina o `VERIFY_TOKEN` (use um valor seguro)
4. Selecione os campos: `messages`, `message_status`

### 3. Configuração do Google Calendar API

#### Passo 1: Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Habilite a Google Calendar API

#### Passo 2: Configurar OAuth 2.0

1. Vá para "APIs & Services" → "Credentials"
2. Clique em "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure como "Web application"
4. Adicione URIs de redirecionamento autorizados
5. Anote o `CLIENT_ID` e `CLIENT_SECRET`

#### Passo 3: Gerar Refresh Token

```bash
# Script para gerar refresh token
node scripts/generate-google-token.js
```

### 4. Configuração do OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Crie uma API key
3. Adicione ao `.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

## 🔧 Implementação dos Componentes

### 1. Webhook Handler

O `webhook-handler.ts` é o ponto de entrada principal:

```typescript
// Endpoint de verificação
app.get('/webhook', (req, res) => {
  // Verifica token do WhatsApp
});

// Endpoint principal
app.post('/webhook', async (req, res) => {
  // Processa mensagens
});
```

**Funcionalidades:**
- Validação de webhook
- Processamento de mensagens
- Transcrição de áudio
- Roteamento para agente

### 2. Agente SDR

O `sdr-agent.ts` é o cérebro do sistema:

```typescript
export const sdrAgent = new Agent({
  name: 'SDR-Agent',
  instructions: `...`,
  tools: [googleCalendarTool, whatsappTool],
  model: 'gpt-4o',
});
```

**Capacidades:**
- Processamento de linguagem natural
- Execução de ferramentas
- Gerenciamento de contexto
- Detecção de intenções

### 3. Ferramentas (Tools)

#### Google Calendar Tool

```typescript
export const googleCalendarTool = tool({
  name: 'google_calendar',
  description: 'Agenda, busca, modifica ou cancela reuniões',
  parameters: z.object({
    action: z.enum(['schedule', 'reschedule', 'cancel', 'list']),
    // ... outros parâmetros
  }),
  execute: async ({ action, ...params }) => {
    // Lógica de execução
  }
});
```

**Ações suportadas:**
- `schedule`: Agendar nova reunião
- `reschedule`: Remarcar reunião existente
- `cancel`: Cancelar reunião
- `list`: Listar reuniões futuras
- `check_availability`: Verificar disponibilidade

#### WhatsApp Tool

```typescript
export const whatsappTool = tool({
  name: 'whatsapp_send',
  description: 'Envia mensagens via WhatsApp',
  parameters: z.object({
    phoneNumber: z.string(),
    message: z.string(),
    messageType: z.enum(['text', 'confirmation', 'options'])
  }),
  execute: async ({ phoneNumber, message, messageType }) => {
    // Envio de mensagem
  }
});
```

### 4. Guardrails

Os guardrails implementam validações de segurança:

```typescript
export const businessHoursGuardrail = defineOutputGuardrail({
  name: 'horario_comercial',
  description: 'Valida horário comercial',
  schema: z.object({
    dentro_horario: z.boolean().refine(val => val, 'Fora do horário')
  }),
  validate: async (output) => {
    return { dentro_horario: isBusinessHours() };
  }
});
```

**Guardrails implementados:**
- Horário comercial
- Confirmações de agendamento
- Limite de remarcações
- Dados sensíveis
- Duração de reuniões
- Detecção de handoff

### 5. Templates de Resposta

```typescript
export const responseTemplates: ResponseTemplate[] = [
  {
    id: 'schedule_success',
    type: 'text',
    template: '✅ Reunião agendada com sucesso!\n\n📅 {summary}\n📅 Data: {date}\n⏰ Horário: {time}',
    variables: ['summary', 'date', 'time']
  }
];
```

## 🧪 Testes e Validação

### 1. Testes Unitários

```bash
# Executar testes
npm test

# Testes específicos
npm test -- --testNamePattern="Google Calendar"
```

### 2. Testes de Integração

```bash
# Testar webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"Olá"}}]}}]}]}'
```

### 3. Testes de End-to-End

1. Configure ngrok: `ngrok http 3000`
2. Configure webhook no WhatsApp
3. Envie mensagem de teste
4. Verifique logs e respostas

## 🔒 Segurança e Boas Práticas

### 1. Validação de Entrada

```typescript
// Sempre valide entrada do usuário
const validatedInput = InputValidationSchema.parse(userInput);
```

### 2. Rate Limiting

```typescript
// Implementar rate limiting
const rateLimit = require('express-rate-limit');
app.use('/webhook', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
}));
```

### 3. Logs e Monitoramento

```typescript
// Log estruturado
console.log(JSON.stringify({
  level: 'info',
  message: 'Mensagem processada',
  userId: userId,
  intent: intent,
  timestamp: new Date().toISOString()
}));
```

### 4. Tratamento de Erros

```typescript
try {
  // Operação
} catch (error) {
  console.error('Erro:', error);
  // Enviar resposta de erro para usuário
  await sendWhatsAppResponse(userId, {
    message: 'Desculpe, ocorreu um erro. Tente novamente.',
    type: 'text'
  });
}
```

## 🚀 Deploy e Produção

### 1. Preparação para Produção

```bash
# Build do projeto
npm run build

# Verificar configurações
npm run lint
npm test
```

### 2. Variáveis de Ambiente de Produção

```env
NODE_ENV=production
PORT=3000
WEBHOOK_URL=https://your-domain.com/webhook

# Logs
LOG_LEVEL=info
ENABLE_TRACING=true
```

### 3. Deploy no Heroku

```bash
# Criar app
heroku create sdr-agent

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=sk-your-key
# ... outras variáveis

# Deploy
git push heroku main
```

### 4. Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📊 Monitoramento e Manutenção

### 1. Logs Estruturados

```typescript
// Implementar logging estruturado
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Métricas Importantes

- Taxa de sucesso de agendamentos
- Tempo de resposta do agente
- Taxa de handoffs
- Erros de transcrição
- Uso de APIs externas

### 3. Alertas

```typescript
// Implementar alertas para:
// - Erros críticos
// - Taxa de handoff alta
// - Falhas de API
// - Tempo de resposta alto
```

## 🔄 Manutenção e Atualizações

### 1. Atualizações Regulares

```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Testes após atualização
npm test
```

### 2. Backup de Configurações

- Backup das variáveis de ambiente
- Backup dos tokens de API
- Backup das configurações de webhook

### 3. Monitoramento de Custos

- Monitorar uso da API OpenAI
- Controlar chamadas do WhatsApp
- Acompanhar uso do Google Calendar

## 🚨 Troubleshooting

### Problemas Comuns

1. **Webhook não verificado**
   - Verificar URL e token
   - Confirmar se servidor está acessível

2. **Falha na transcrição**
   - Verificar OpenAI API key
   - Confirmar formato do áudio

3. **Erro no Google Calendar**
   - Verificar credenciais OAuth
   - Confirmar permissões da API

4. **Respostas lentas**
   - Verificar conectividade
   - Monitorar uso de APIs

### Logs de Debug

```typescript
// Habilitar logs detalhados
DEBUG=* npm run webhook
```

## 📚 Recursos Adicionais

- [Documentação OpenAI Agents SDK](https://openai.github.io/openai-agents-js/)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Google Calendar API Docs](https://developers.google.com/calendar)
- [OpenAI Whisper Docs](https://platform.openai.com/docs/guides/speech-to-text)

## 🤝 Suporte

Para dúvidas ou problemas:
1. Consulte este guia
2. Verifique os logs
3. Abra uma issue no GitHub
4. Entre em contato com a equipe

---

**Este guia deve ser atualizado conforme o projeto evolui. Mantenha-o sempre atualizado!** 