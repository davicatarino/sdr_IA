export const textoGuardrail = {
    name: 'validacao_texto',
    validate: async (output) => {
        const texto = output.texto || '';
        const palavrasInadequadas = ['palavrão1', 'palavrão2'];
        const contemPalavroes = palavrasInadequadas.some(palavra => texto.toLowerCase().includes(palavra));
        return {
            texto: texto,
            comprimento_maximo: texto.length <= 1000,
            contem_palavroes: !contemPalavroes
        };
    }
};
export const calculoGuardrail = {
    name: 'validacao_calculo',
    validate: async (output) => {
        const resultado = output.resultado || 0;
        const limiteMaximo = 1e15;
        const limiteMinimo = -1e15;
        return {
            resultado: resultado,
            dentro_limites: resultado >= limiteMinimo && resultado <= limiteMaximo,
            precisao_adequada: Number.isFinite(resultado)
        };
    }
};
export const temperaturaGuardrail = {
    name: 'validacao_temperatura',
    validate: async (output) => {
        const valor = output.valor || 0;
        const unidade = output.unidade || 'celsius';
        const faixas = {
            celsius: { min: -273.15, max: 10000 },
            fahrenheit: { min: -459.67, max: 18032 },
            kelvin: { min: 0, max: 10273.15 }
        };
        const faixa = faixas[unidade] || faixas.celsius;
        return {
            valor: valor,
            faixa_realista: valor >= faixa.min && valor <= faixa.max,
            unidade_valida: Object.keys(faixas).includes(unidade)
        };
    }
};
export const idGuardrail = {
    name: 'validacao_id',
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
};
//# sourceMappingURL=input-guardrails.js.map