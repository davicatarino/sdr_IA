import express from 'express';
import axios from 'axios';
import { config, validateConfig, setupOpenAI } from './utils/config.js';
import { processUserMessage } from './agents/sdr-agent.js';
import { downloadWhatsAppMedia } from './tools/whatsapp-tool.js';
import FormData from 'form-data';
const app = express();
app.use(express.json());
setupOpenAI();
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
        console.log('✅ Webhook verificado com sucesso');
        res.status(200).send(challenge);
    }
    else {
        console.log('❌ Falha na verificação do webhook');
        res.sendStatus(403);
    }
});
app.post('/webhook', async (req, res) => {
    try {
        const decryptResponse = await axios.post('https://sofia.212industria.com/decrypt', req.body);
        const decryptedBody = decryptResponse.data;
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
        for (const message of messages) {
            await processWhatsAppMessage(message, value.contacts?.[0]);
        }
        return res.sendStatus(200);
    }
    catch (error) {
        console.error('Erro no webhook:', error);
        return res.sendStatus(500);
    }
});
async function processWhatsAppMessage(message, contact) {
    try {
        const userId = message.from;
        let userInput = '';
        let messageType = 'text';
        console.log(`📱 Mensagem recebida de ${userId}:`, message.type);
        switch (message.type) {
            case 'text':
                userInput = message.text?.body || '';
                break;
            case 'audio':
                messageType = 'audio';
                userInput = await transcribeAudio(message.audio?.id || '');
                break;
            case 'document':
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
        const response = await processUserMessage(userId, userInput, messageType);
        await sendWhatsAppResponse(userId, response);
    }
    catch (error) {
        console.error('Erro ao processar mensagem WhatsApp:', error);
        try {
            await sendWhatsAppResponse(message.from, {
                message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
                type: 'text'
            });
        }
        catch (sendError) {
            console.error('Erro ao enviar mensagem de erro:', sendError);
        }
    }
}
async function transcribeAudio(mediaId) {
    try {
        console.log('🎵 Transcrevendo áudio...');
        const audioBuffer = await downloadWhatsAppMedia(mediaId);
        const form = new FormData();
        form.append('file', audioBuffer, {
            filename: 'audio.ogg',
            contentType: 'audio/ogg'
        });
        form.append('model', 'whisper-1');
        form.append('language', 'pt');
        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
            headers: {
                'Authorization': `Bearer ${config.openaiApiKey}`,
                ...form.getHeaders()
            }
        });
        const transcription = response.data.text;
        console.log('✅ Transcrição:', transcription);
        return transcription;
    }
    catch (error) {
        console.error('❌ Erro na transcrição:', error);
        throw new Error('Falha na transcrição do áudio');
    }
}
async function sendWhatsAppResponse(phoneNumber, response) {
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
    }
    catch (error) {
        console.error('❌ Erro ao enviar resposta WhatsApp:', error);
        throw error;
    }
}
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        environment: config.environment,
        businessHours: config.businessHours
    });
});
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
    }
    catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
    startServer();
}
export { app, startServer };
//# sourceMappingURL=webhook-handler.js.map