'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  Star, 
  Scissors, 
  User, 
  MessageSquare, 
  Info,
  MapPin,
  Clock,
  Share2,
  Upload,
  Loader2,
  Shield,
  X,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export default function AdminLandingPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('hero');
  const [corsError, setCorsError] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Erro ao buscar configuração:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        alert('Configurações salvas com sucesso!');
      } else {
        throw new Error('Falha ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addItem = (section: string, defaultItem: any) => {
    const newItem = { ...defaultItem, id: uuidv4() };
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: [...prev[section].items, newItem]
      }
    }));
  };

  const removeItem = (section: string, id: string) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.filter((item: any) => item.id !== id)
      }
    }));
  };

  const updateItemField = (section: string, id: string, field: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.map((item: any) => 
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string, itemId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB for safety
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem é muito grande. O limite é 2MB.");
      return;
    }

    const uploadId = itemId ? `${section}-${itemId}-${field}` : `${section}-${field}`;
    setUploading(uploadId);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no servidor durante upload');
      }

      const { url: downloadURL } = await response.json();

      if (itemId) {
        updateItemField(section, itemId, field, downloadURL);
      } else {
        updateField(section, field, downloadURL);
      }
      
      setCorsError(false);
    } catch (error: any) {
      console.error("Upload error details:", error);
      alert(`Erro no upload: ${error.message || 'Erro desconhecido'}.`);
    } finally {
      setUploading(null);
      if (e.target) e.target.value = '';
    }
  };

  const ImageInput = ({ label, value, onChange, onUpload, uploadId }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">{label}</label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="flex-grow bg-white/5 border border-white/10 rounded-none px-4 py-2 text-sm focus:border-[#e9c176] outline-none"
            placeholder="URL da imagem"
          />
          {value && (
            <div className="w-10 h-10 rounded-none border border-white/10 overflow-hidden bg-black flex-shrink-0">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <label className="cursor-pointer bg-[#e9c176]/10 border border-[#e9c176]/20 rounded-none px-4 py-2 hover:bg-[#e9c176]/20 transition-all flex items-center justify-center gap-2 text-[#e9c176] text-xs font-bold uppercase tracking-widest">
          {uploading === uploadId ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Fazer Upload de Imagem</span>
            </>
          )}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={onUpload}
            disabled={!!uploading}
          />
        </label>
      </div>
    </div>
  );

  if (loading) return <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-[#e9c176] border-t-transparent rounded-none animate-spin" /></div>;
  if (!config) return null;

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: any }) => (
    <button 
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-none transition-all",
        expandedSection === id ? "bg-[#e9c176] text-[#261900]" : "bg-white/5 text-[#e5e2e1] hover:bg-white/10"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-headline font-bold uppercase tracking-widest text-xs">{title}</span>
      </div>
      {expandedSection === id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-none border border-white/5 sticky top-20 z-40 backdrop-blur-xl">
        <h2 className="font-headline text-xl font-bold text-[#e9c176]">Gerenciar Landing Page</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#e9c176] text-[#261900] px-6 py-2 rounded-none font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-[#261900] border-t-transparent rounded-none animate-spin" /> : <Save size={16} />}
          Salvar Alterações
        </button>
      </div>

      {/* Hero Section */}
      <div className="space-y-4">
        <SectionHeader id="hero" title="Hero Section" icon={Layout} />
        {expandedSection === 'hero' && (
          <div className="p-6 bg-white/5 rounded-none border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Badge (Texto Pequeno)</label>
                <input 
                  type="text" 
                  value={config.hero.badge} 
                  onChange={(e) => updateField('hero', 'badge', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none"
                />
              </div>
              <ImageInput 
                label="Imagem de Fundo"
                value={config.hero.bgImage}
                onChange={(val: string) => updateField('hero', 'bgImage', val)}
                onUpload={(e: any) => handleFileUpload(e, 'hero', 'bgImage')}
                uploadId="hero-bgImage"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título Principal</label>
              <input 
                type="text" 
                value={config.hero.title} 
                onChange={(e) => updateField('hero', 'title', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Subtítulo</label>
              <textarea 
                value={config.hero.subtitle} 
                onChange={(e) => updateField('hero', 'subtitle', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none h-20"
              />
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <SectionHeader id="history" title="History Section" icon={Info} />
        {expandedSection === 'history' && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título</label>
                <input 
                  type="text" 
                  value={config.history.title} 
                  onChange={(e) => updateField('history', 'title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none"
                />
              </div>
              <ImageInput 
                label="Imagem da História"
                value={config.history.image}
                onChange={(val: string) => updateField('history', 'image', val)}
                onUpload={(e: any) => handleFileUpload(e, 'history', 'image')}
                uploadId="history-image"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Texto Parágrafo 1</label>
              <textarea 
                value={config.history.text1} 
                onChange={(e) => updateField('history', 'text1', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none h-24"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Texto Parágrafo 2</label>
              <textarea 
                value={config.history.text2} 
                onChange={(e) => updateField('history', 'text2', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none h-24"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Stat 1 Valor</label>
                <input type="text" value={config.history.stat1Value} onChange={(e) => updateField('history', 'stat1Value', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Stat 1 Label</label>
                <input type="text" value={config.history.stat1Label} onChange={(e) => updateField('history', 'stat1Label', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Stat 2 Valor</label>
                <input type="text" value={config.history.stat2Value} onChange={(e) => updateField('history', 'stat2Value', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Stat 2 Label</label>
                <input type="text" value={config.history.stat2Label} onChange={(e) => updateField('history', 'stat2Label', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Ano Destaque</label>
                <input type="text" value={config.history.year} onChange={(e) => updateField('history', 'year', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Label do Ano</label>
                <input type="text" value={config.history.yearLabel} onChange={(e) => updateField('history', 'yearLabel', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Services Section */}
      <div className="space-y-4">
        <SectionHeader id="services" title="Services Section" icon={Scissors} />
        {expandedSection === 'services' && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título da Seção</label>
                <input type="text" value={config.services.title} onChange={(e) => updateField('services', 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Subtítulo da Seção</label>
                <input type="text" value={config.services.subtitle} onChange={(e) => updateField('services', 'subtitle', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#e9c176] uppercase tracking-widest">Cards de Serviço</h4>
                <button 
                  onClick={() => addItem('services', { icon: 'scissors', title: 'Novo Serviço', description: 'Descrição do serviço' })}
                  className="p-2 bg-[#e9c176] text-[#261900] rounded-none hover:brightness-110 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {config.services.items.map((item: any) => (
                  <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 relative group">
                    <button 
                      onClick={() => removeItem('services', item.id)}
                      className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Ícone (scissors, user, star)</label>
                        <input type="text" value={item.icon} onChange={(e) => updateItemField('services', item.id, 'icon', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título</label>
                        <input type="text" value={item.title} onChange={(e) => updateItemField('services', item.id, 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Descrição Curta</label>
                      <textarea value={item.description} onChange={(e) => updateItemField('services', item.id, 'description', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none h-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Section */}
      <div className="space-y-4">
        <SectionHeader id="gallery" title="Gallery Section" icon={ImageIcon} />
        {expandedSection === 'gallery' && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título da Seção</label>
                <input type="text" value={config.gallery.title} onChange={(e) => updateField('gallery', 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Subtítulo da Seção</label>
                <input type="text" value={config.gallery.subtitle} onChange={(e) => updateField('gallery', 'subtitle', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#e9c176] uppercase tracking-widest">Imagens da Galeria</h4>
                <button 
                  onClick={() => addItem('gallery', { image: 'https://picsum.photos/seed/new/800/800', title: 'Nova Imagem' })}
                  className="p-2 bg-[#e9c176] text-[#261900] rounded-lg hover:brightness-110 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.gallery.items.map((item: any) => (
                  <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 relative group">
                    <button 
                      onClick={() => removeItem('gallery', item.id)}
                      className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ImageInput 
                      label="Imagem da Galeria"
                      value={item.image}
                      onChange={(val: string) => updateItemField('gallery', item.id, 'image', val)}
                      onUpload={(e: any) => handleFileUpload(e, 'gallery', 'image', item.id)}
                      uploadId={`gallery-${item.id}-image`}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título/Legenda (Opcional)</label>
                      <input type="text" value={item.title} onChange={(e) => updateItemField('gallery', item.id, 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Testimonials Section */}
      <div className="space-y-4">
        <SectionHeader id="testimonials" title="Testimonials Section" icon={MessageSquare} />
        {expandedSection === 'testimonials' && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título da Seção</label>
                <input type="text" value={config.testimonials.title} onChange={(e) => updateField('testimonials', 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Subtítulo da Seção</label>
                <input type="text" value={config.testimonials.subtitle} onChange={(e) => updateField('testimonials', 'subtitle', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#e9c176] uppercase tracking-widest">Depoimentos</h4>
                <button 
                  onClick={() => addItem('testimonials', { name: 'Novo Cliente', role: 'Cliente', text: 'Depoimento aqui', stars: 5, image: 'https://picsum.photos/seed/user/100/100' })}
                  className="p-2 bg-[#e9c176] text-[#261900] rounded-lg hover:brightness-110 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {config.testimonials.items.map((item: any) => (
                  <div key={item.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 relative group">
                    <button 
                      onClick={() => removeItem('testimonials', item.id)}
                      className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Nome</label>
                        <input type="text" value={item.name} onChange={(e) => updateItemField('testimonials', item.id, 'name', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Tag/Role</label>
                        <input type="text" value={item.role} onChange={(e) => updateItemField('testimonials', item.id, 'role', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Estrelas (1-5)</label>
                        <input type="number" min="1" max="5" value={item.stars} onChange={(e) => updateItemField('testimonials', item.id, 'stars', parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
                      </div>
                    </div>
                    <ImageInput 
                      label="Foto do Cliente"
                      value={item.image}
                      onChange={(val: string) => updateItemField('testimonials', item.id, 'image', val)}
                      onUpload={(e: any) => handleFileUpload(e, 'testimonials', 'image', item.id)}
                      uploadId={`testimonials-${item.id}-image`}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Texto do Depoimento</label>
                      <textarea value={item.text} onChange={(e) => updateItemField('testimonials', item.id, 'text', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none h-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="space-y-4">
        <SectionHeader id="cta" title="CTA Section" icon={Star} />
        {expandedSection === 'cta' && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Título</label>
                <input type="text" value={config.cta.title} onChange={(e) => updateField('cta', 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <ImageInput 
                label="Imagem CTA"
                value={config.cta.image}
                onChange={(val: string) => updateField('cta', 'image', val)}
                onUpload={(e: any) => handleFileUpload(e, 'cta', 'image')}
                uploadId="cta-image"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Subtítulo</label>
              <textarea value={config.cta.subtitle} onChange={(e) => updateField('cta', 'subtitle', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none h-20" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="space-y-4">
        <SectionHeader id="footer" title="Footer & Contatos" icon={Share2} />
        {expandedSection === 'footer' && (
          <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Descrição da Marca</label>
              <textarea value={config.footer.description} onChange={(e) => updateField('footer', 'description', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none h-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Endereço (Usado no Mapa)</label>
                <input type="text" value={config.footer.address} onChange={(e) => updateField('footer', 'address', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Telefone</label>
                <input type="text" value={config.footer.phone} onChange={(e) => updateField('footer', 'phone', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Email</label>
                <input type="text" value={config.footer.email} onChange={(e) => updateField('footer', 'email', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Horário de Funcionamento</label>
                <input type="text" value={config.footer.openingHours} onChange={(e) => updateField('footer', 'openingHours', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Instagram (Link)</label>
                <input type="text" value={config.footer.instagram} onChange={(e) => updateField('footer', 'instagram', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Facebook (Link)</label>
                <input type="text" value={config.footer.facebook} onChange={(e) => updateField('footer', 'facebook', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#e9c176] outline-none" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
