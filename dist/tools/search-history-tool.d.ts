import { z } from 'zod';
export declare const searchHistoryTool: import("@openai/agents").FunctionTool<unknown, z.ZodObject<{
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
}, {
    query: string;
}>, string>;
//# sourceMappingURL=search-history-tool.d.ts.map