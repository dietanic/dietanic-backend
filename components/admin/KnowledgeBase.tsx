
import React, { useState, useEffect } from 'react';
import { KnowledgeService } from '../../services/storeService';
import { KnowledgeArticle } from '../../types';
import { Book, Edit3, Trash2, Plus, CheckCircle, Clock, Save, X } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<KnowledgeArticle>>({});

    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        const data = await KnowledgeService.getArticles();
        setArticles(data);
    };

    const handleEdit = (article: KnowledgeArticle) => {
        setEditingId(article.id);
        setFormData(article);
    };

    const handleNew = () => {
        setEditingId('new');
        setFormData({
            title: '',
            content: '',
            tags: [],
            status: 'draft'
        });
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) return;

        const article: KnowledgeArticle = {
            id: editingId === 'new' ? `kb_${Date.now()}` : editingId!,
            title: formData.title,
            content: formData.content,
            tags: typeof formData.tags === 'string' ? (formData.tags as string).split(',').map((t: string) => t.trim()) : (formData.tags || []),
            status: formData.status || 'draft',
            lastUpdated: new Date().toISOString()
        };

        await KnowledgeService.saveArticle(article);
        setEditingId(null);
        loadArticles();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this article?')) {
            await KnowledgeService.deleteArticle(id);
            loadArticles();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Book className="text-brand-600" size={20} /> Knowledge Base
                    </h2>
                    <p className="text-sm text-gray-500">Manage the business information used by the AI Assistant.</p>
                </div>
                <button onClick={handleNew} className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
                    <Plus size={16} /> New Article
                </button>
            </div>

            {/* Editor Modal / Inline */}
            {editingId && (
                <div className="bg-white p-6 rounded-lg border border-brand-200 shadow-lg ring-4 ring-brand-50 mb-6">
                    <div className="flex justify-between mb-4">
                        <h3 className="font-bold text-gray-800">{editingId === 'new' ? 'Create Article' : 'Edit Article'}</h3>
                        <button onClick={() => setEditingId(null)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic Title</label>
                            <input 
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g., Refund Policy"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content (AI Context)</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-md p-2 h-32 focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                                placeholder="Enter the exact information the AI should know..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Be clear and concise. The AI reads this to answer customer queries.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                <input 
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                                    onChange={e => setFormData({...formData, tags: e.target.value})}
                                    placeholder="refund, payment, money"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                                >
                                    <option value="draft">Draft (AI ignores)</option>
                                    <option value="approved">Approved (AI uses)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-md font-bold hover:bg-green-700 flex items-center gap-2">
                                <Save size={18}/> Save Article
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {articles.map(article => (
                    <div key={article.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{article.title}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 ${
                                    article.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {article.status === 'approved' ? <CheckCircle size={10}/> : <Clock size={10}/>}
                                    {article.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{article.content}</p>
                            <div className="flex gap-2">
                                {article.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">#{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(article)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded"><Edit3 size={18}/></button>
                            <button onClick={() => handleDelete(article.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
