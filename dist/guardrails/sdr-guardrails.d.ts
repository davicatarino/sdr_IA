import { SDRContext } from '../types/index.js';
export declare const businessHoursGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        dentro_horario: boolean;
        horario_atual: string;
        horario_permitido: string;
    }>;
};
export declare const confirmationGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        confirmado: boolean;
        detalhes_completos: boolean;
        horario_valido: any;
    }>;
};
export declare const rescheduleLimitGuardrail: {
    name: string;
    validate: (output: any, context: SDRContext) => Promise<{
        dentro_limite: boolean;
        tentativas_atual: number;
        limite_maximo: number;
    }>;
};
export declare const sensitiveDataGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        sem_dados_sensiveis: boolean;
        tipo_conteudo: string;
        nivel_seguranca: string;
    }>;
};
export declare const meetingDurationGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        duracao_valida: boolean;
        duracao_minutos: number;
        duracao_maxima: number;
    }>;
};
export declare const attendeesGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        participantes_validos: boolean;
        quantidade_participantes: any;
        limite_maximo: number;
    }>;
};
export declare const handoffDetectionGuardrail: {
    name: string;
    validate: (output: any, context: SDRContext) => Promise<{
        precisa_handoff: boolean;
        motivo: string;
        urgencia: "baixa" | "media" | "alta" | "critica";
    }>;
};
//# sourceMappingURL=sdr-guardrails.d.ts.map