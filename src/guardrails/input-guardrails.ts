import { defineOutputGuardrail } from '@openai/agents';
import { z } from 'zod';

/**
 * Guardrail para validar entrada de texto
 */
export const textoGuardrail = defineOutputGuardrail({
  name: 'validacao_texto',
  description: 'Valida se o texto de saída é apropriado e bem formatado',
  schema: z.object({
    texto: z.string().min(1, 'Texto não pode estar vazio'),
    comprimento_maximo: z.number().max(1000, 'Texto muito longo'),
    contem_palavroes: z.boolean().refine(val => !val, 'Texto contém linguagem inadequada')
  }),
  validate: async (output) => {
    const texto = output.texto || '';
    const palavrasInadequadas = ['palavrão1', 'palavrão2']; // Lista simplificada
    
    const contemPalavroes = palavrasInadequadas.some(palavra => 
      texto.toLowerCase().includes(palavra)
    );
    
    return {
      texto: texto,
      comprimento_maximo: texto.length <= 1000,
      contem_palavroes: !contemPalavroes
    };
  }
});

/**
 * Guardrail para validação de cálculos
 */
export const calculoGuardrail = defineOutputGuardrail({
  name: 'validacao_calculo',
  description: 'Valida se o resultado de cálculos está dentro de limites razoáveis',
  schema: z.object({
    resultado: z.number().finite('Resultado deve ser um número finito'),
    dentro_limites: z.boolean().refine(val => val, 'Resultado fora dos limites aceitáveis'),
    precisao_adequada: z.boolean().refine(val => val, 'Precisão inadequada')
  }),
  validate: async (output) => {
    const resultado = output.resultado || 0;
    const limiteMaximo = 1e15; // 1 quatrilhão
    const limiteMinimo = -1e15;
    
    return {
      resultado: resultado,
      dentro_limites: resultado >= limiteMinimo && resultado <= limiteMaximo,
      precisao_adequada: Number.isFinite(resultado)
    };
  }
});

/**
 * Guardrail para validação de temperatura
 */
export const temperaturaGuardrail = defineOutputGuardrail({
  name: 'validacao_temperatura',
  description: 'Valida se valores de temperatura estão em faixas realistas',
  schema: z.object({
    valor: z.number().finite('Valor deve ser um número finito'),
    faixa_realista: z.boolean().refine(val => val, 'Temperatura fora da faixa realista'),
    unidade_valida: z.boolean().refine(val => val, 'Unidade de temperatura inválida')
  }),
  validate: async (output) => {
    const valor = output.valor || 0;
    const unidade = output.unidade || 'celsius';
    
    // Faixas realistas por unidade
    const faixas = {
      celsius: { min: -273.15, max: 10000 }, // Zero absoluto até temperatura do Sol
      fahrenheit: { min: -459.67, max: 18032 },
      kelvin: { min: 0, max: 10273.15 }
    };
    
    const faixa = faixas[unidade as keyof typeof faixas] || faixas.celsius;
    
    return {
      valor: valor,
      faixa_realista: valor >= faixa.min && valor <= faixa.max,
      unidade_valida: Object.keys(faixas).includes(unidade)
    };
  }
});

/**
 * Guardrail para validação de IDs
 */
export const idGuardrail = defineOutputGuardrail({
  name: 'validacao_id',
  description: 'Valida se IDs gerados seguem padrões adequados',
  schema: z.object({
    id: z.string().min(1, 'ID não pode estar vazio'),
    formato_valido: z.boolean().refine(val => val, 'Formato de ID inválido'),
    comprimento_adequado: z.boolean().refine(val => val, 'Comprimento de ID inadequado')
  }),
  validate: async (output) => {
    const id = output.id || '';
    const formatoValido = /^[A-Za-z0-9_-]+$/.test(id);
    const comprimentoAdequado = id.length >= 4 && id.length <= 32;
    
    return {
      id: id,
      formato_valido: formatoValido,
      comprimento_adequado: comprimentoAdequado
    };
  }
}); 