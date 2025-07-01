# 🤖 SDR IA Agent - Agente de Agendamento via WhatsApp

Um agente SDR (Sales Development Representative) inteligente que agenda reuniões no Google Calendar através de conversas naturais no WhatsApp, com suporte a áudio e texto.

## 🚀 Características Principais

- **🤖 Agente IA Inteligente** - Usando OpenAI Agents SDK
- **📱 Integração WhatsApp** - API oficial do WhatsApp Business
- **🎵 Suporte a Áudio** - Transcrição automática com Whisper
- **📅 Google Calendar** - Agendamento, remarcação e cancelamento
- **🔒 Guardrails Avançados** - Validações de segurança e negócio
- **🔄 Handoffs Inteligentes** - Transição para humanos quando necessário
- **💾 Vector Store** - Memória de contexto usando OpenAI
- **📝 Respostas Modulares** - Templates personalizáveis
- **⚡ TypeScript** - Código tipado e robusto

## 🏗️ Arquitetura

```
WhatsApp Business API
        ↓
   Webhook Handler
        ↓
   Transcrição de Áudio (Whisper)
        ↓
   OpenAI Agents SDK
        ↓
    ├─ Vector Store (Contexto)
    ├─ Google Calendar Tools
    ├─ WhatsApp Tools
    ├─ Guardrails
    └─ Handoff Detection
        ↓
   Response Builder
        ↓
   WhatsApp Business API
```

## 📋 Pré-requisitos

- Node.js 18+
- Conta WhatsApp Business API
- Conta Google Cloud com Calendar API
- Chave da API OpenAI

## 🛠️ Instalação

### 1. Clone e Instale

```bash
git clone <seu-repositorio>
cd SDR_IA
npm install
```

### 2. Configure as Variáveis de Ambiente

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token

# Google Calendar API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REFRESH_TOKEN=your-google-refresh-token

# Configurações
NODE_ENV=development
PORT=3000
WEBHOOK_URL=https://your-domain.com/webhook

# Regras de Negócio
BUSINESS_HOURS_START=08:00
BUSINESS_HOURS_END=18:00
BUSINESS_DAYS=1,2,3,4,5
MAX_RESCHEDULE_ATTEMPTS=3
```

### 3. Configure o WhatsApp Business API

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um app e configure o WhatsApp Business API
3. Obtenha o `ACCESS_TOKEN` e `PHONE_NUMBER_ID`
4. Configure o webhook URL: `https://your-domain.com/webhook`

### 4. Configure o Google Calendar API

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto e habilite a Calendar API
3. Configure OAuth 2.0 e obtenha as credenciais
4. Gere um refresh token para autenticação server-to-server

## 🚀 Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

### Webhook (Recomendado)

```bash
npm run webhook
```

## 📱 Configuração do Webhook

### 1. Exponha seu servidor

Use ngrok para desenvolvimento:

```bash
ngrok http 3000
```

### 2. Configure o webhook no WhatsApp

URL: `https://your-ngrok-url.ngrok.io/webhook`
Verify Token: O valor definido em `WHATSAPP_VERIFY_TOKEN`

### 3. Teste a conexão

Acesse: `https://your-domain.com/status`

## 🎯 Funcionalidades

### ✅ Agendamento de Reuniões

```
Usuário: "Quero agendar uma reunião amanhã às 14h"
Bot: "Perfeito! Vou agendar sua reunião para amanhã às 14:00. Qual o assunto?"
Usuário: "Reunião de vendas"
Bot: "✅ Reunião agendada com sucesso!"
```

### 🔄 Remarcação

```
Usuário: "Preciso remarcar a reunião de amanhã"
Bot: "Claro! Para qual horário você gostaria de remarcar?"
Usuário: "Para 16h"
Bot: "✅ Reunião remarcada com sucesso!"
```

### ❌ Cancelamento

```
Usuário: "Quero cancelar a reunião de amanhã"
Bot: "Tem certeza que deseja cancelar a reunião?"
Usuário: "Sim"
Bot: "✅ Reunião cancelada com sucesso!"
```

### 📋 Listagem

```
Usuário: "Mostre minhas reuniões"
Bot: "📋 Suas próximas reuniões:
1. Reunião de vendas
   📅 15/12/2024 às 14:00"
```

## 🔒 Guardrails Implementados

### Horário Comercial
- Valida se ações estão dentro do horário permitido
- Responde adequadamente fora do horário

### Confirmações
- Sempre pede confirmação antes de agendar/remarcar
- Valida detalhes completos da reunião

### Limites de Remarcação
- Controla número máximo de tentativas
- Previne abuso do sistema

### Dados Sensíveis
- Detecta e protege informações pessoais
- Valida formato de emails e telefones

### Duração de Reuniões
- Valida duração mínima e máxima
- Previne agendamentos inválidos

## 🤝 Handoffs Inteligentes

O sistema detecta automaticamente quando transferir para humano:

- **Solicitação explícita**: "Quero falar com humano"
- **Reclamações**: Palavras-chave de insatisfação
- **Limite de tentativas**: Muitas remarcações
- **Casos complexos**: Fora do escopo do bot

## 🛠️ Estrutura do Projeto

```
src/
├── agents/
│   └── sdr-agent.ts          # Agente principal
├── tools/
│   ├── google-calendar-tool.ts  # Integração Google Calendar
│   └── whatsapp-tool.ts         # Integração WhatsApp
├── guardrails/
│   └── sdr-guardrails.ts     # Validações e regras
├── responses/
│   └── response-templates.ts # Templates de resposta
├── types/
│   └── index.ts              # Tipos TypeScript
├── utils/
│   └── config.ts             # Configurações
└── webhook-handler.ts        # Handler principal
```

## 🔧 Customização

### Adicionar Novas Ferramentas

```typescript
// src/tools/nova-ferramenta.ts
import { tool } from '@openai/agents';
import { z } from 'zod';

export const novaFerramenta = tool({
  name: 'nova_ferramenta',
  description: 'Descrição da ferramenta',
  parameters: z.object({
    parametro: z.string().describe('Descrição do parâmetro')
  }),
  execute: async ({ parametro }) => {
    // Lógica da ferramenta
    return { resultado: 'sucesso' };
  }
});
```

### Adicionar Novos Guardrails

```typescript
// src/guardrails/novo-guardrail.ts
import { defineOutputGuardrail } from '@openai/agents';
import { z } from 'zod';

export const novoGuardrail = defineOutputGuardrail({
  name: 'novo_guardrail',
  description: 'Descrição do guardrail',
  schema: z.object({
    valido: z.boolean().refine(val => val, 'Validação falhou')
  }),
  validate: async (output) => {
    return { valido: true };
  }
});
```

### Personalizar Respostas

```typescript
// src/responses/response-templates.ts
export const responseTemplates: ResponseTemplate[] = [
  {
    id: 'minha_resposta',
    type: 'text',
    template: 'Sua mensagem personalizada {variavel}',
    variables: ['variavel'],
    conditions: {
      intent: ['meu_intent']
    }
  }
];
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm test -- --coverage

# Testes específicos
npm test -- sdr-agent.test.ts
```

## 📊 Monitoramento

### Endpoints de Status

- `GET /status` - Status da aplicação
- `GET /health` - Health check

### Logs

O sistema registra:
- Mensagens recebidas/enviadas
- Erros e exceções
- Ações do agente
- Handoffs detectados

## 🚨 Solução de Problemas

### Erro: "Webhook não verificado"

1. Verifique se o `WHATSAPP_VERIFY_TOKEN` está correto
2. Confirme se a URL do webhook está acessível
3. Verifique os logs do servidor

### Erro: "Falha na transcrição"

1. Verifique se a `OPENAI_API_KEY` está válida
2. Confirme se o áudio está no formato correto
3. Verifique a conectividade com a API OpenAI

### Erro: "Falha no Google Calendar"

1. Verifique as credenciais do Google
2. Confirme se o refresh token está válido
3. Verifique as permissões da API

## 🔄 Deploy

### Heroku

```bash
heroku create sdr-agent
heroku config:set NODE_ENV=production
git push heroku main
```

### Vercel

```bash
vercel --prod
```

### Docker

```bash
docker build -t sdr-agent .
docker run -p 3000:3000 sdr-agent
```

## 📚 Recursos Adicionais

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Google Calendar API](https://developers.google.com/calendar)
- [OpenAI Whisper](https://openai.com/research/whisper)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação
- Entre em contato com a equipe

---

**Desenvolvido com ❤️ para automatizar agendamentos de forma inteligente e eficiente.** 