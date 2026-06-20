declare module 'chrono-node' {
  export interface ParsedResult {
    start: {
      date(): Date;
    };
    end?: {
      date(): Date;
    };
    text: string;
  }

  export function parse(text: string, ref?: Date): ParsedResult[];
  export function parseDate(text: string, ref?: Date): Date | null;
}
