import express from 'express';
import axios from 'axios';
import { config, validateConfig, setupOpenAI } from './utils/config';
import { processUserMessage } from './agents/sdr-agent';
import { downloadWhatsAppMedia } from './tools/whatsapp-tool';
import { WhatsAppWebhookPayload, WhatsAppMessage } from './types';

const app = express();
app.use(express.json());

// Configuração inicial
setupOpenAI();

/**
 * Endpoint de verificação do webhook do WhatsApp
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
    console.log('✅ Webhook verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Falha na verificação do webhook');
    res.sendStatus(403);
  }
});

/**
 * Endpoint principal do webhook para receber mensagens
 */
app.post('/webhook', async (req, res) => {
  try {
    // 1. Envie os dados recebidos para o endpoint de decrypt
    const decryptResponse = await axios.post('https://sofia.212industria.com/decrypt', req.body);

    // 2. Use a resposta descriptografada como o novo body
    const decryptedBody = decryptResponse.data;

    // 3. Continue o processamento normal, mas usando o decryptedBody
    if (decryptedBody.object !== 'whatsapp_business_account') {
      return res.sendStatus(200);
    }

    const entry = decryptedBody.entry?.[0];
    if (!entry) {
      return res.sendStatus(200);
    }

    const change = entry.changes?.[0];
    if (!change || change.field !== 'messages') {
      return res.sendStatus(200);
    }

    const value = change.value;
    const messages = value.messages;

    if (!messages || messages.length === 0) {
      return res.sendStatus(200);
    }

    // Processa cada mensagem
    for (const message of messages) {
      await processWhatsAppMessage(message, value.contacts?.[0]);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.sendStatus(500);
  }
});

/**
 * Processa uma mensagem individual do WhatsApp
 */
async function processWhatsAppMessage(message: WhatsAppMessage, contact?: any) {
  try {
    const userId = message.from;
    let userInput = '';
    let messageType: 'text' | 'audio' = 'text';

    console.log(`📱 Mensagem recebida de ${userId}:`, message.type);

    // Processa diferentes tipos de mensagem
    switch (message.type) {
      case 'text':
        userInput = message.text?.body || '';
        break;

      case 'audio':
        messageType = 'audio';
        userInput = await transcribeAudio(message.audio?.id || '');
        break;

      case 'document':
        // Para documentos, podemos processar como texto se for um arquivo de texto
        userInput = `Documento recebido: ${message.document?.filename}`;
        break;

      default:
        userInput = `Mensagem de tipo ${message.type} recebida`;
        break;
    }

    if (!userInput.trim()) {
      console.log('Mensagem vazia, ignorando');
      return;
    }

    // Processa a mensagem com o agente SDR
    const response = await processUserMessage(userId, userInput, messageType);

    // Envia resposta de volta para o WhatsApp
    await sendWhatsAppResponse(userId, response);

  } catch (error) {
    console.error('Erro ao processar mensagem WhatsApp:', error);
    
    // Envia mensagem de erro para o usuário
    try {
      await sendWhatsAppResponse(message.from, {
        message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        type: 'text'
      });
    } catch (sendError) {
      console.error('Erro ao enviar mensagem de erro:', sendError);
    }
  }
}

/**
 * Transcreve áudio usando OpenAI Whisper
 */
async function transcribeAudio(mediaId: string): Promise<string> {
  try {
    console.log('🎵 Transcrevendo áudio...');
    
    // Baixa o arquivo de áudio do WhatsApp
    const audioBuffer = await downloadWhatsAppMedia(mediaId);
    
    // Cria FormData para enviar para OpenAI
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: 'audio.ogg',
      contentType: 'audio/ogg'
    });
    form.append('model', 'whisper-1');
    form.append('language', 'pt');

    // Envia para OpenAI Whisper API
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        ...form.getHeaders()
      }
    });

    const transcription = response.data.text;
    console.log('✅ Transcrição:', transcription);
    
    return transcription;
  } catch (error) {
    console.error('❌ Erro na transcrição:', error);
    throw new Error('Falha na transcrição do áudio');
  }
}

/**
 * Envia resposta para o WhatsApp
 */
async function sendWhatsAppResponse(phoneNumber: string, response: any) {
  try {
    const url = `https://graph.facebook.com/v17.0/${config.whatsappPhoneNumberId}/messages`;
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: response.message
      }
    };

    const apiResponse = await axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${config.whatsappAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta enviada:', response.message.substring(0, 50) + '...');
    return apiResponse.data;
  } catch (error) {
    console.error('❌ Erro ao enviar resposta WhatsApp:', error);
    throw error;
  }
}

/**
 * Endpoint de status da aplicação
 */
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    businessHours: config.businessHours
  });
});

/**
 * Inicia o servidor
 */
function startServer() {
  try {
    validateConfig();
    
    const port = config.port;
    app.listen(port, () => {
      console.log(`🚀 Servidor SDR Agent iniciado na porta ${port}`);
      console.log(`📱 Webhook URL: http://localhost:${port}/webhook`);
      console.log(`📊 Status: http://localhost:${port}/status`);
      console.log(`⏰ Horário comercial: ${config.businessHours.start} às ${config.businessHours.end}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export { app, startServer }; 