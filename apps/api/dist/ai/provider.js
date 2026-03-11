export class DisabledAIProvider {
    async suggestColumnMapping() { return {}; }
    async suggestItemMatch() { return []; }
}
export class OllamaProvider {
    endpoint;
    constructor(endpoint = 'http://localhost:11434') {
        this.endpoint = endpoint;
    }
    async suggestColumnMapping(headers) {
        void headers;
        void this.endpoint;
        return {};
    }
    async suggestItemMatch(description) {
        void description;
        return [];
    }
}
