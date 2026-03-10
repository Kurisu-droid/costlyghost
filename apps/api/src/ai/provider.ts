export interface AIProvider {
  suggestColumnMapping(headers: string[]): Promise<Record<string, string>>;
  suggestItemMatch(description: string): Promise<string[]>;
}

export class DisabledAIProvider implements AIProvider {
  async suggestColumnMapping(): Promise<Record<string, string>> { return {}; }
  async suggestItemMatch(): Promise<string[]> { return []; }
}

export class OllamaProvider implements AIProvider {
  constructor(private readonly endpoint = 'http://localhost:11434') {}

  async suggestColumnMapping(headers: string[]): Promise<Record<string, string>> {
    void headers;
    void this.endpoint;
    return {};
  }

  async suggestItemMatch(description: string): Promise<string[]> {
    void description;
    return [];
  }
}
