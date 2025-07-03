import { ResponseTemplate } from '../types/index.js';
export declare const responseTemplates: ResponseTemplate[];
export declare function getResponseTemplate(type: string, intent?: string, timeOfDay?: string): ResponseTemplate | null;
export declare function renderTemplate(template: ResponseTemplate, variables: Record<string, string>): string;
export declare function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night';
export declare function formatMeetingsList(meetings: any[]): string;
export declare function formatAvailability(availability: any): string;
//# sourceMappingURL=response-templates.d.ts.map