import { tool } from '@openai/agents';
import { z } from 'zod';
import axios from 'axios';
import { config } from '../utils/config.js';

/**
 * Ferramenta para enviar mensagens via WhatsApp
 */
const WhatsAppParams = z.object({
  phoneNumber: z.string(),
  message: z.string(),
  messageType: z.union([z.enum(['text', 'confirmation', 'options']), z.null()]).optional(),
  options: z.union([z.array(z.string()), z.null()]).optional(),
});

export const whatsappTool = tool({
  name: 'whatsapp_send',
  description: 'Envia mensagens de texto, confirmações ou opções via WhatsApp',
  parameters: WhatsAppParams,
  async execute(args: z.infer<typeof WhatsAppParams>) {
    const { phoneNumber, message, messageType = 'text', options } = args;
    
    try {
      const response = await sendWhatsAppMessage(phoneNumber, message, messageType, options);
      return {
        success: true,
        messageId: response.id,
        status: response.status,
        message: 'Mensagem enviada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
});

/**
 * Envia mensagem via WhatsApp Business API
 */
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  messageType: 'text' | 'confirmation' | 'options' | null = 'text',
  options?: string[] | null
) {
  const url = `https://graph.facebook.com/v17.0/${config.whatsappPhoneNumberId}/messages`;
  
  let requestBody: any = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
  };

  // Se messageType for null, usa 'text' como padrão
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

/**
 * Baixa arquivo de mídia do WhatsApp
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer> {
  try {
    // Primeiro, obtém a URL do arquivo
    const url = `https://graph.facebook.com/v17.0/${mediaId}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${config.whatsappAccessToken}`
      }
    });

    const mediaUrl = response.data.url;
    
    // Depois, baixa o arquivo
    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${config.whatsappAccessToken}`
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(mediaResponse.data);
  } catch (error) {
    console.error('Erro ao baixar mídia do WhatsApp:', error);
    throw new Error('Falha ao baixar arquivo de mídia');
  }
}

/**
 * Verifica se o número está no formato correto
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Remove caracteres especiais e verifica se tem 13 dígitos (55 + DDD + número)
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return cleanNumber.length === 13 && cleanNumber.startsWith('55');
}

/**
 * Formata número de telefone para o formato do WhatsApp
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Se não tem código do país, adiciona 55 (Brasil)
  if (cleanNumber.length === 11) {
    return `55${cleanNumber}`;
  }
  
  return cleanNumber;
} 