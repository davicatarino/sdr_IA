export declare const textoGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        texto: any;
        comprimento_maximo: boolean;
        contem_palavroes: boolean;
    }>;
};
export declare const calculoGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        resultado: any;
        dentro_limites: boolean;
        precisao_adequada: boolean;
    }>;
};
export declare const temperaturaGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        valor: any;
        faixa_realista: boolean;
        unidade_valida: boolean;
    }>;
};
export declare const idGuardrail: {
    name: string;
    validate: (output: any) => Promise<{
        id: any;
        formato_valido: boolean;
        comprimento_adequado: boolean;
    }>;
};
//# sourceMappingURL=input-guardrails.d.ts.map