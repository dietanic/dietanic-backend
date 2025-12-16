
import { KnowledgeArticle } from '../types';
import { DB } from './storage';

const INITIAL: KnowledgeArticle[] = [
    { id: 'kb_1', title: 'Refund Policy', content: 'Refunds within 24h of delivery.', tags: ['refund'], status: 'approved', lastUpdated: new Date().toISOString() }
];

export const KnowledgeService = {
    getArticles: () => DB.getAll<KnowledgeArticle>('dietanic_kb', INITIAL),
    saveArticle: (a: KnowledgeArticle) => DB.upsert('dietanic_kb', a, INITIAL),
    deleteArticle: (id: string) => DB.delete('dietanic_kb', id, INITIAL),
    getApprovedContent: async () => (await DB.getAll<KnowledgeArticle>('dietanic_kb', INITIAL))
        .filter(a => a.status === 'approved').map(a => `Q: ${a.title}\nA: ${a.content}`).join('\n\n')
};
