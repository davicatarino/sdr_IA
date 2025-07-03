import { z } from 'zod';
export const InputValidationSchema = z.object({
    message: z.string().min(1, 'Mensagem não pode estar vazia'),
    userId: z.string().min(1, 'ID do usuário é obrigatório'),
    messageType: z.enum(['text', 'audio']),
    timestamp: z.date().optional().nullable(),
});
//# sourceMappingURL=index.js.map