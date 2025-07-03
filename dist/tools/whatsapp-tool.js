import { tool } from '@openai/agents';
import { z } from 'zod';
import axios from 'axios';
import { config } from '../utils/config.js';
const WhatsAppParams = z.object({
    phoneNumber: z.string(),
    message: z.string(),
    messageType: z.enum(['text', 'confirmation', 'options']).optional().nullable(),
    options: z.array(z.string()).optional().nullable(),
});
export const whatsappTool = tool({
    name: 'whatsapp_send',
    description: 'Envia mensagens de texto, confirmações ou opções via WhatsApp',
    parameters: WhatsAppParams,
    async execute(args) {
        const { phoneNumber, message, messageType = 'text', options } = args;
        try {
            const response = await sendWhatsAppMessage(phoneNumber, message, messageType, options);
            return {
                success: true,
                messageId: response.id,
                status: response.status,
                message: 'Mensagem enviada com sucesso'
            };
        }
        catch (error) {
            console.error('Erro ao enviar mensagem WhatsApp:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
});
async function sendWhatsAppMessage(phoneNumber, message, messageType = 'text', options) {
    const url = `https://graph.facebook.com/v17.0/${config.whatsappPhoneNumberId}/messages`;
    let requestBody = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
    };
    const type = messageType || 'text';
    switch (type) {
        case 'text':
            requestBody.type = 'text';
            requestBody.text = { body: message };
            break;
        case 'confirmation':
            requestBody.type = 'interactive';
            requestBody.interactive = {
                type: 'button',
                body: { text: message },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: { id: 'confirm', title: '✅ Confirmar' }
                        },
                        {
                            type: 'reply',
                            reply: { id: 'cancel', title: '❌ Cancelar' }
                        }
                    ]
                }
            };
            break;
        case 'options':
            if (!options || options.length === 0) {
                throw new Error('Opções são obrigatórias para messageType options');
            }
            requestBody.type = 'interactive';
            requestBody.interactive = {
                type: 'list',
                body: { text: message },
                action: {
                    button: 'Ver opções',
                    sections: [
                        {
                            title: 'Opções disponíveis',
                            rows: options.map((option, index) => ({
                                id: `option_${index}`,
                                title: option,
                                description: `Selecione esta opção`
                            }))
                        }
                    ]
                }
            };
            break;
    }
    const response = await axios.post(url, requestBody, {
        headers: {
            'Authorization': `Bearer ${config.whatsappAccessToken}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
}
export async function downloadWhatsAppMedia(mediaId) {
    try {
        const url = `https://graph.facebook.com/v17.0/${mediaId}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${config.whatsappAccessToken}`
            }
        });
        const mediaUrl = response.data.url;
        const mediaResponse = await axios.get(mediaUrl, {
            headers: {
                'Authorization': `Bearer ${config.whatsappAccessToken}`
            },
            responseType: 'arraybuffer'
        });
        return Buffer.from(mediaResponse.data);
    }
    catch (error) {
        console.error('Erro ao baixar mídia do WhatsApp:', error);
        throw new Error('Falha ao baixar arquivo de mídia');
    }
}
export function validatePhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length === 13 && cleanNumber.startsWith('55');
}
export function formatPhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length === 11) {
        return `55${cleanNumber}`;
    }
    return cleanNumber;
}
//# sourceMappingURL=whatsapp-tool.js.map