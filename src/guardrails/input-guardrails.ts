import { z } from 'zod';

/**
 * Guardrail para validar entrada de texto
 */
export const textoGuardrail = {
  name: 'validacao_texto',
  validate: async (output: any) => {
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
};

/**
 * Guardrail para validação de cálculos
 */
export const calculoGuardrail = {
  name: 'validacao_calculo',
  validate: async (output: any) => {
    const resultado = output.resultado || 0;
    const limiteMaximo = 1e15; // 1 quatrilhão
    const limiteMinimo = -1e15;
    
    return {
      resultado: resultado,
      dentro_limites: resultado >= limiteMinimo && resultado <= limiteMaximo,
      precisao_adequada: Number.isFinite(resultado)
    };
  }
};

/**
 * Guardrail para validação de temperatura
 */
export const temperaturaGuardrail = {
  name: 'validacao_temperatura',
  validate: async (output: any) => {
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
};

/**
 * Guardrail para validação de IDs
 */
export const idGuardrail = {
  name: 'validacao_id',
  validate: async (output: any) => {
    const id = output.id || '';
    const formatoValido = /^[A-Za-z0-9_-]+$/.test(id);
    const comprimentoAdequado = id.length >= 4 && id.length <= 32;
    
    return {
      id: id,
      formato_valido: formatoValido,
      comprimento_adequado: comprimentoAdequado
    };
  }
}; 