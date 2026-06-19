'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Scissors, 
  User, 
  Star, 
  ArrowRight, 
  ExternalLink, 
  MessageCircle, 
  MapPin, 
  Phone, 
  Mail,
  Instagram,
  Facebook,
  Lock,
  X,
  Shield,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LANDING_PAGE_DEFAULTS } from '@/lib/landing-page-defaults';

interface LandingPageProps {
  onStartBooking: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
}

export default function LandingPage({ onStartBooking, onOpenProfile, onOpenAdmin }: LandingPageProps) {
  const [config, setConfig] = useState<any>(LANDING_PAGE_DEFAULTS);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ ll: string } | null>(null);
  const [isWaChatOpen, setIsWaChatOpen] = useState(false);
  const [selectedWaService, setSelectedWaService] = useState("Corte de Cabelo");
  const [services, setServices] = useState<any[]>([]);

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activePhotoIndex === null) return;
    setIsZoomed(false);
    const total = config.gallery?.items?.length || 0;
    if (total === 0) return;
    setActivePhotoIndex((activePhotoIndex - 1 + total) % total);
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activePhotoIndex === null) return;
    setIsZoomed(false);
    const total = config.gallery?.items?.length || 0;
    if (total === 0) return;
    setActivePhotoIndex((activePhotoIndex + 1) % total);
  };

  const handleClosePhoto = () => {
    setActivePhotoIndex(null);
    setIsZoomed(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('local_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => setUser(parsed), 0);
      } catch (e) {}
    }

    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data && !data.error) {
          setConfig(data);
        }
      } catch (error) {
        console.error('Erro ao buscar configuração:', error);
      }
    };
    
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setServices(data);
          setSelectedWaService(data[0].name);
        }
      } catch (error) {
        console.error('Erro ao buscar serviços para o WhatsApp:', error);
      }
    };

    fetchConfig();
    fetchServices();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'Escape') {
        handleClosePhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, config.gallery?.items?.length]);

  useEffect(() => {
    const address = config?.footer?.address;
    if (!address) return;

    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          {
            headers: {
              'Accept-Language': 'pt-PT,pt;q=0.9'
            }
          }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          // Yandex Maps usa a ordem longitude,latitude (ll=lon,lat)
          setMapCoords({ ll: `${lon},${lat}` });
        }
      } catch (error) {
        console.error('Erro ao geocodificar endereço do rodapé:', error);
      }
    };

    geocodeAddress();
  }, [config?.footer?.address]);

  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'scissors': return <Scissors className="text-[#e9c176] w-10 h-10" />;
      case 'user': return <User className="text-[#e9c176] w-10 h-10" />;
      case 'star': return <Star className="text-[#e9c176] w-10 h-10" />;
      default: return <Scissors className="text-[#e9c176] w-10 h-10" />;
    }
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] font-sans overflow-x-hidden">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="text-xl font-headline font-extrabold tracking-tighter text-[#e9c176] uppercase">
            Papo Furado
          </div>
          <div className="hidden md:flex gap-8 items-center font-headline tracking-wider uppercase text-xs font-bold">
            <a className="text-[#e5e2e1] hover:text-[#e9c176] transition-colors" href="#services">Serviços</a>
            <a className="text-[#e5e2e1] hover:text-[#e9c176] transition-colors" href="#history">Sobre</a>
            <a className="text-[#e5e2e1] hover:text-[#e9c176] transition-colors" href="#gallery">Galeria</a>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={user ? onOpenProfile : onStartBooking}
              className="hidden sm:flex items-center gap-2 text-[#e5e2e1] hover:text-[#e9c176] transition-colors font-headline font-bold text-[10px] uppercase tracking-widest px-4 py-2"
            >
              <User size={14} />
              {user ? 'Minha Conta' : 'Login'}
            </button>
            <button 
              onClick={onStartBooking}
              className="bg-gradient-to-br from-[#e9c176] to-[#c5a059] px-6 py-2 rounded-none text-[#261900] font-headline font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              Agendar Agora
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={config.hero.bgImage} 
              alt="dramatic interior of a luxury barbershop" 
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40 grayscale-[0.5]"
              referrerPolicy="no-referrer"
              style={{ backgroundColor: '#2a2a2a' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-[#131313]/50" />
          </div>
          <div className="relative z-10 text-center px-6 max-w-4xl">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-headline text-[#e9c176] tracking-[0.3em] uppercase text-[10px] font-bold mb-6 block"
            >
              {config.hero.badge}
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-headline text-5xl md:text-7xl font-extrabold text-[#e5e2e1] mb-6 leading-tight tracking-tighter"
            >
              {config.hero.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#9a8f80] text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              {config.hero.subtitle}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button 
                onClick={onStartBooking}
                className="bg-gradient-to-br from-[#e9c176] to-[#c5a059] px-10 py-5 rounded-none text-[#261900] font-headline font-extrabold uppercase tracking-widest text-xs shadow-xl shadow-[#e9c176]/10 hover:brightness-110 transition-all"
              >
                Agende seu Horário
              </button>
            </motion.div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="text-[#e9c176]" />
          </div>
        </section>

        {/* History Section */}
        <section className="py-24 px-6 bg-[#1c1b1b]" id="history">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-[#e9c176]/30 z-10" />
              <div className="overflow-hidden rounded-none aspect-[4/5] relative skeleton-loader">
                {config.history.image && (
                  <Image 
                    src={config.history.image} 
                    alt="História Barbearia" 
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    style={{ backgroundColor: '#2a2a2a', zIndex: 2 }}
                  />
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 p-8 bg-[#353534] border border-white/5 shadow-2xl max-w-xs">
                <p className="font-headline text-[#e9c176] font-bold text-3xl italic">{config.history.year}</p>
                <p className="text-[#e5e2e1] text-[10px] mt-2 tracking-wide font-bold uppercase">{config.history.yearLabel}</p>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-[#e5e2e1] leading-tight">
                {config.history.title}
              </h2>
              <div className="space-y-6 text-[#9a8f80] leading-relaxed text-lg font-light">
                <p>{config.history.text1}</p>
                <p>{config.history.text2}</p>
              </div>
              <div className="pt-8 grid grid-cols-2 gap-8 border-t border-white/10">
                <div>
                  <span className="block text-[#e9c176] font-headline text-4xl font-bold">{config.history.stat1Value}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#9a8f80] font-bold">{config.history.stat1Label}</span>
                </div>
                <div>
                  <span className="block text-[#e9c176] font-headline text-4xl font-bold">{config.history.stat2Value}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#9a8f80] font-bold">{config.history.stat2Label}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 px-6 bg-[#131313]" id="services">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline text-4xl font-bold text-[#e5e2e1] uppercase tracking-tighter mb-4">{config.services.title}</h2>
              <p className="text-[#9a8f80] uppercase tracking-[0.4em] text-[10px] font-bold">{config.services.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {config.services.items.map((item: any) => (
                <div key={item.id} className="bg-[#2a2a2a] p-10 rounded-none group hover:bg-[#353534] transition-all duration-300 relative overflow-hidden">
                  <div className="mb-8">
                    {getIcon(item.icon)}
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-[#e5e2e1] mb-4">{item.title}</h3>
                  <p className="text-[#9a8f80] leading-relaxed">{item.description}</p>
                  <div className="mt-8 text-[#e9c176] font-bold font-headline text-xs tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    SABER MAIS <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-24 px-6 bg-[#1c1b1b]" id="gallery">
          <style dangerouslySetInnerHTML={{ __html: `
            .lightbox-backdrop {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(10, 10, 10, 0.95);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              z-index: 1000;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              user-select: none;
            }
            .lightbox-container {
              position: relative;
              max-width: 90vw;
              max-height: 75vh;
              border: 1px solid rgba(233, 193, 118, 0.2);
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #131313;
              transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              overflow: hidden;
            }
            .lightbox-container.zoomed {
              width: 90vw;
              max-width: 90vw;
              height: 85vh;
              max-height: 85vh;
              overflow: hidden;
            }
            .lightbox-container::-webkit-scrollbar,
            .lightbox-backdrop::-webkit-scrollbar {
              display: none !important;
            }
            .lightbox-container,
            .lightbox-backdrop {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
              overflow: hidden !important;
            }
            .lightbox-image {
              max-width: 100%;
              max-height: 75vh;
              object-fit: contain;
              display: block;
              cursor: zoom-in;
              margin: 0 auto;
              transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .lightbox-image.zoomed {
              width: 90vw;
              max-width: 90vw;
              height: 85vh;
              max-height: 85vh;
              object-fit: contain;
              cursor: zoom-out;
            }
            .lightbox-toolbar {
              position: absolute;
              top: 24px;
              right: 24px;
              display: flex;
              gap: 12px;
              z-index: 1010;
            }
            .lightbox-btn {
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: #e5e2e1;
              width: 44px;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease-in-out;
            }
            .lightbox-btn:hover {
              background: #e9c176;
              color: #131313;
              border-color: #e9c176;
            }
            .lightbox-nav {
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              background: rgba(19, 19, 19, 0.6);
              border: 1px solid rgba(233, 193, 118, 0.2);
              color: #e9c176;
              width: 50px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease-in-out;
              z-index: 1005;
            }
            .lightbox-nav:hover {
              background: #e9c176;
              color: #131313;
              border-color: #e9c176;
            }
            .lightbox-prev {
              left: 24px;
            }
            .lightbox-next {
              right: 24px;
            }
            .lightbox-info {
              margin-top: 20px;
              text-align: center;
              color: #e5e2e1;
              z-index: 1001;
            }
            .lightbox-title {
              color: #e9c176;
              font-family: var(--font-headline);
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .lightbox-counter {
              color: #9a8f80;
              font-size: 11px;
              letter-spacing: 0.05em;
            }
            .gallery-item-clickable {
              cursor: pointer;
              transition: transform 0.3s ease, border-color 0.3s ease;
            }
            .gallery-item-clickable:hover {
              border-color: rgba(233, 193, 118, 0.4);
            }
            @keyframes shimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
            .skeleton-loader {
              background: linear-gradient(90deg, #1c1b1b 25%, #2a2a2a 50%, #1c1b1b 75%);
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite linear;
            }
            /* Estilos do Widget de Chat do WhatsApp */
            .wa-chat-container {
              position: fixed;
              bottom: 20px;
              right: 20px;
              z-index: 999;
              font-family: var(--font-sans), Arial, sans-serif;
            }
            .wa-chat-box {
              display: none;
              width: 320px;
              background: #e5ddd5;
              border-radius: 10px;
              box-shadow: 0 5px 25px rgba(0,0,0,0.3);
              margin-bottom: 15px;
              overflow: hidden;
              animation: waFadeIn 0.3s ease-out forwards;
            }
            .wa-chat-box.open {
              display: block;
            }
            @keyframes waFadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .wa-chat-header {
              background: #075e54;
              color: white;
              padding: 12px;
              display: flex;
              align-items: center;
              position: relative;
            }
            .wa-avatar {
              position: relative;
              margin-right: 10px;
              width: 40px;
              height: 40px;
            }
            .wa-avatar img {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
            }
            .wa-online-status {
              width: 10px;
              height: 10px;
              background: #4ef037;
              border-radius: 50%;
              position: absolute;
              bottom: 2px;
              right: 2px;
              border: 2px solid #075e54;
            }
            .wa-chat-info {
              display: flex;
              flex-direction: column;
            }
            .wa-name { 
              font-weight: bold; 
              font-size: 14px; 
              color: white;
              font-family: var(--font-headline);
            }
            .wa-status { 
              font-size: 11px; 
              opacity: 0.8; 
              color: #a5ebd9;
            }
            .wa-close-btn {
              position: absolute;
              right: 12px;
              top: 12px;
              background: none;
              border: none;
              color: white;
              font-size: 24px;
              line-height: 1;
              cursor: pointer;
              transition: opacity 0.2s;
            }
            .wa-close-btn:hover {
              opacity: 0.7;
            }
            .wa-chat-body {
              padding: 20px;
              height: 150px;
              overflow-y: auto;
            }
            .wa-msg {
              background: white;
              color: #1a1a1a;
              padding: 10px 14px;
              border-radius: 0 10px 10px 10px;
              font-size: 14px;
              max-width: 85%;
              box-shadow: 0 1px 2px rgba(0,0,0,0.15);
              line-height: 1.4;
            }
            .wa-chat-footer {
              background: #f0f0f0;
              padding: 10px;
              display: flex;
              gap: 8px;
              align-items: center;
              border-top: 1px solid rgba(0,0,0,0.05);
            }
            .wa-select {
              flex: 1;
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 20px;
              outline: none;
              font-size: 13px;
              background: white;
              color: #1a1a1a;
              cursor: pointer;
            }
            .wa-send-btn {
              background: #128c7e;
              border: none;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              justify-content: center;
              align-items: center;
              transition: background-color 0.2s;
            }
            .wa-send-btn:hover {
              background: #075e54;
            }
            .wa-trigger-btn {
              background: #25d366;
              border: none;
              width: 60px;
              height: 60px;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              justify-content: center;
              align-items: center;
              float: right;
              transition: transform 0.2s, background-color 0.2s;
            }
            .wa-trigger-btn:hover { 
              transform: scale(1.05); 
              background-color: #20ba5a;
            }
          ` }} />
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline text-4xl font-bold text-[#e5e2e1] uppercase tracking-tighter mb-4">{config.gallery.title}</h2>
              <p className="text-[#9a8f80] uppercase tracking-[0.4em] text-[10px] font-bold">{config.gallery.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[250px]">
              {config.gallery.items.map((item: any, idx: number) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "overflow-hidden rounded-none group relative border border-white/5 gallery-item-clickable skeleton-loader",
                    idx === 0 ? "lg:col-span-2 lg:row-span-2 shadow-lg" : "",
                    idx === 2 ? "lg:row-span-2 shadow-md" : "",
                    idx === 4 ? "lg:col-span-2 shadow-lg" : ""
                  )}
                  onClick={() => item.image && setActivePhotoIndex(idx)}
                  role="button"
                  tabIndex={item.image ? 0 : -1}
                  onKeyDown={(e) => {
                    if (item.image && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setActivePhotoIndex(idx);
                    }
                  }}
                >
                  {item.image && (
                    <>
                      <Image 
                        src={item.image} 
                        alt={item.title || "Galeria"} 
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        style={{ backgroundColor: '#2a2a2a' }}
                      />
                      {item.title && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                          <p className="text-[#c5a059] font-headline font-bold tracking-widest uppercase text-xs">{item.title}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-6 bg-[#131313]" id="testimonials">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline text-4xl font-bold text-[#e5e2e1] uppercase tracking-tighter mb-4">{config.testimonials.title}</h2>
              <p className="text-[#9a8f80] uppercase tracking-[0.4em] text-[10px] font-bold">{config.testimonials.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {config.testimonials.items.map((t: any, i: number) => (
                <div key={t.id} className="bg-[#2a2a2a] p-8 rounded-none border border-white/5 flex flex-col h-full hover:border-[#e9c176]/30 transition-colors duration-300">
                  <div className="flex gap-1 mb-6">
                    {[...Array(t.stars)].map((_, j) => <Star key={j} size={16} fill="#e9c176" className="text-[#e9c176]" />)}
                  </div>
                  <p className="text-[#9a8f80] italic mb-8 flex-grow">&quot;{t.text}&quot;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-none bg-[#353534] border border-white/10 overflow-hidden relative">
                      <Image 
                        src={t.image} 
                        alt={t.name} 
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        style={{ backgroundColor: '#2a2a2a' }}
                      />
                    </div>
                    <div>
                      <p className="font-headline font-bold text-[#e5e2e1] text-sm">{t.name}</p>
                      <p className="text-[#e9c176] text-[10px] uppercase tracking-widest font-bold">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-[#353534] rounded-none p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 border border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e9c176]/5 rounded-none blur-3xl -mr-32 -mt-32" />
            <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 relative skeleton-loader">
              {config.cta.image && (
                <>
                  <Image 
                    src={config.cta.image} 
                    alt="Mascote Barbearia" 
                    fill
                    className="object-contain grayscale brightness-125"
                    referrerPolicy="no-referrer"
                    style={{ backgroundColor: '#2a2a2a', zIndex: 2 }}
                  />
                  <div className="absolute inset-0 bg-[#e9c176]/10 mix-blend-color" style={{ zIndex: 3 }} />
                </>
              )}
            </div>
            <div className="flex-1 text-center md:text-left space-y-6">
              <h2 className="font-headline text-4xl font-extrabold text-[#e5e2e1]">{config.cta.title}</h2>
              <p className="text-[#9a8f80] text-lg">{config.cta.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-6 pt-4 items-center justify-center md:justify-start">
                <button 
                  onClick={onStartBooking}
                  className="bg-gradient-to-br from-[#e9c176] to-[#c5a059] px-8 py-4 rounded-none text-[#261900] font-headline font-bold uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95 transition-all"
                >
                  <MessageCircle size={18} />
                  Agendar Agora
                </button>
                <div className="flex items-center gap-4 text-[#9a8f80]">
                  <div className="w-3 h-3 bg-green-500 rounded-none animate-pulse" />
                  <span className="text-sm font-medium">Online Agora</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0e0e0e] border-t border-white/5 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
            <div className="space-y-6">
              <div className="text-2xl font-bold tracking-tighter text-[#e9c176] uppercase font-headline">
                Papo Furado
              </div>
              <p className="text-[#9a8f80] leading-relaxed text-sm">
                {config.footer.description}
              </p>
              <div className="flex gap-4">
                <a href={config.footer.instagram} className="w-10 h-10 rounded-none bg-[#2a2a2a] border border-white/5 flex items-center justify-center text-[#e9c176] hover:bg-[#e9c176] hover:text-[#261900] transition-all">
                  <Instagram size={18} />
                </a>
                <a href={config.footer.facebook} className="w-10 h-10 rounded-none bg-[#2a2a2a] border border-white/5 flex items-center justify-center text-[#e9c176] hover:bg-[#e9c176] hover:text-[#261900] transition-all">
                  <Facebook size={18} />
                </a>
              </div>
            </div>
            <div className="space-y-6 lg:ml-8">
              <h4 className="font-headline font-bold text-[#e5e2e1] uppercase tracking-widest text-xs border-l-2 border-[#e9c176] pl-4">Contato</h4>
              <ul className="space-y-4 text-sm text-[#9a8f80]">
                <li className="flex items-start gap-3">
                  <MapPin className="text-[#e9c176] w-5 h-5 flex-shrink-0" />
                  <span>{config.footer.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="text-[#e9c176] w-5 h-5 flex-shrink-0" />
                  <a href={`tel:${config.footer.phone.replace(/\s/g, '')}`} className="hover:text-[#e9c176] transition-colors">{config.footer.phone}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="text-[#e9c176] w-5 h-5 flex-shrink-0" />
                  <a href={`mailto:${config.footer.email}`} className="hover:text-[#e9c176] transition-colors">{config.footer.email}</a>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-8 lg:gap-4">
              <div className="space-y-6">
                <h4 className="font-headline font-bold text-[#e5e2e1] uppercase tracking-widest text-xs border-l-2 border-[#e9c176] pl-4">Links</h4>
                <ul className="space-y-3 text-sm text-[#9a8f80]">
                  <li><a href="#services" className="hover:text-[#e9c176] transition-colors">Serviços</a></li>
                  <li><a href="#history" className="hover:text-[#e9c176] transition-colors">Sobre Nós</a></li>
                  <li><a href="#gallery" className="hover:text-[#e9c176] transition-colors">Galeria</a></li>
                  <li><a href="#testimonials" className="hover:text-[#e9c176] transition-colors">Depoimentos</a></li>
                  <li>
                    <button 
                      onClick={() => setIsAdminModalOpen(true)}
                      className="hover:text-[#e9c176] transition-colors flex items-center gap-2"
                    >
                      <Lock size={12} />
                      Gestão
                    </button>
                  </li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="font-headline font-bold text-[#e5e2e1] uppercase tracking-widest text-xs border-l-2 border-[#e9c176] pl-4">Horário</h4>
                <div className="space-y-2 text-sm text-[#9a8f80]">
                  <p className="font-bold text-[#e5e2e1]">{config.footer.openingHours.split(':')[0]}</p>
                  <p>{config.footer.openingHours.split(':').slice(1).join(':')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="font-headline font-bold text-[#e5e2e1] uppercase tracking-widest text-xs border-l-2 border-[#e9c176] pl-4">Localização</h4>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.footer.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-40 bg-[#2a2a2a] rounded-none overflow-hidden border border-white/5 relative group grayscale hover:grayscale-0 transition-all duration-500"
              >
                <iframe 
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(config.footer.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  title="Mapa Localização" 
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ border: 0 }}
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors pointer-events-none">
                  <div className="bg-[#e9c176] text-[#261900] p-2 rounded-none shadow-lg">
                    <MapPin size={20} />
                  </div>
                </div>
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/10 pt-10">
            <div className="text-[10px] tracking-widest text-[#9a8f80] text-center md:text-left font-bold uppercase">
              © {new Date().getFullYear()} BARBEARIA PAPO FURADO. TODOS OS DIREITOS RESERVADOS.
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] tracking-widest text-[#9a8f80] hover:text-[#e9c176] transition-colors font-bold uppercase">PRIVACY POLICY</a>
              <a href="#" className="text-[10px] tracking-widest text-[#9a8f80] hover:text-[#e9c176] transition-colors font-bold uppercase">TERMS OF SERVICE</a>
              <span className="text-[10px] text-[#9a8f80] hidden md:block">BRASIL → PORTUGAL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAdminModalOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[#1c1b1b] border border-white/10 p-8 rounded-none w-full max-w-md shadow-2xl"
          >
            <button 
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-4 right-4 text-[#9a8f80] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-[#e9c176]/10 rounded-none flex items-center justify-center text-[#e9c176]">
                <Shield size={32} />
              </div>
              <div>
                <h3 className="text-xl font-headline font-bold text-[#e5e2e1]">Acesso Restrito</h3>
                <p className="text-sm text-[#9a8f80]">Área de gestão da Barbearia Papo Furado</p>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                // Simulação de login admin para demonstração
                if (adminEmail === 'barbeariapapofurado@gmail.com' && adminPassword === 'admin123') {
                  onOpenAdmin();
                  setIsAdminModalOpen(false);
                } else {
                  setError('Credenciais inválidas. Por favor, tente novamente.');
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e9c176] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Senha</label>
                <input 
                  type="password" 
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-[#e9c176] transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium text-center">{error}</p>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-gradient-to-br from-[#e9c176] to-[#c5a059] text-[#131313] font-bold rounded-none shadow-lg shadow-[#e9c176]/10 active:scale-[0.98] transition-all mt-4"
              >
                Acessar Painel
              </button>

              <button 
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="w-full py-2 text-[#9a8f80] hover:text-[#e9c176] text-xs font-bold uppercase tracking-widest transition-colors mt-2"
              >
                Cancelar e Voltar
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && config.gallery?.items?.[activePhotoIndex] && (
        <div className="lightbox-backdrop" onClick={handleClosePhoto}>
          <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
            <button 
              className="lightbox-btn" 
              onClick={() => setIsZoomed(!isZoomed)}
              aria-label={isZoomed ? "Diminuir zoom" : "Aumentar zoom"}
              title={isZoomed ? "Zoom Out" : "Zoom In"}
            >
              {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>
            <button 
              className="lightbox-btn" 
              onClick={handleClosePhoto}
              aria-label="Fechar visualização"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
          
          <button 
            className="lightbox-nav lightbox-prev" 
            onClick={handlePrevPhoto}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={28} />
          </button>

          <div 
            className={cn("lightbox-container skeleton-loader", isZoomed ? "zoomed" : "")} 
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative' }}
          >
            <img 
              src={config.gallery.items[activePhotoIndex].image} 
              alt={config.gallery.items[activePhotoIndex].title || "Foto da Galeria"} 
              className={cn("lightbox-image", isZoomed ? "zoomed" : "")}
              onClick={() => setIsZoomed(!isZoomed)}
              style={{ transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            />
          </div>

          <button 
            className="lightbox-nav lightbox-next" 
            onClick={handleNextPhoto}
            aria-label="Próxima foto"
          >
            <ChevronRight size={28} />
          </button>

          <div className="lightbox-info" onClick={(e) => e.stopPropagation()}>
            {config.gallery.items[activePhotoIndex].title && (
              <div className="lightbox-title">
                {config.gallery.items[activePhotoIndex].title}
              </div>
            )}
            <div className="lightbox-counter">
              {activePhotoIndex + 1} de {config.gallery.items.length}
            </div>
          </div>
        </div>
      )}

      {/* Widget de Chat Simulador de WhatsApp */}
      {config?.footer?.phone && (
        <div className="wa-chat-container">
          {/* Caixa de chat */}
          <div className={cn("wa-chat-box", isWaChatOpen ? "open" : "")}>
            <div className="wa-chat-header">
              <div className="wa-avatar">
                <img 
                  src={config.cta.image || "https://picsum.photos/seed/barber-avatar/100/100?grayscale"} 
                  alt="Barbeiro" 
                />
                <span className="wa-online-status"></span>
              </div>
              <div className="wa-chat-info">
                <span className="wa-name">Atendimento Barbearia</span>
                <span className="wa-status">Online</span>
              </div>
              <button className="wa-close-btn" onClick={() => setIsWaChatOpen(false)}>×</button>
            </div>
            
            <div className="wa-chat-body">
              <div className="wa-msg">
                Olá! Escolha o seu serviço para fazermos a marcação:
              </div>
            </div>

            <div className="wa-chat-footer">
              <select 
                id="waService" 
                className="wa-select"
                value={selectedWaService}
                onChange={(e) => setSelectedWaService(e.target.value)}
              >
                {services.length > 0 ? (
                  services.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Corte de Cabelo">Corte de Cabelo</option>
                    <option value="Barba">Apenas Barba</option>
                    <option value="Corte e Barba">Ambos (Corte e Barba)</option>
                  </>
                )}
              </select>
              <button 
                className="wa-send-btn" 
                onClick={() => {
                  const num = config.footer.phone.replace(/\D/g, '');
                  const text = `Olá! Gostaria de fazer uma marcação para: ${selectedWaService}`;
                  window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                title="Enviar Mensagem"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Botão Flutuante */}
          <button 
            className="wa-trigger-btn" 
            onClick={() => setIsWaChatOpen(!isWaChatOpen)}
            title="Abrir Chat do WhatsApp"
          >
            <svg viewBox="0 0 32 32" width="30" height="30" fill="white">
              <path d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.737 5.607 2.137 8.048l-2.137 7.952 8.133-2.083c2.41 1.317 5.143 2.083 7.867 2.083 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.333c-2.482 0-4.908-0.655-7.037-1.9l-0.505-0.298-4.813 1.233 1.257-4.678-0.328-0.523c-1.353-2.16-2.072-4.662-2.072-7.17 0-7.352 5.981-13.333 13.333-13.333s13.333 5.981 13.333 13.333c0 7.352-5.981 13.333-13.333 13.333zM22.842 18.622c-0.375-0.188-2.217-1.093-2.56-1.218-0.343-0.125-0.593-0.188-0.843 0.188s-0.968 1.218-1.187 1.468c-0.219 0.25-0.438 0.281-0.813 0.094-1.523-0.76-2.984-1.406-4.14-2.401-0.893-0.767-1.484-1.701-1.659-2.013-0.175-0.313-0.019-0.481 0.138-0.638 0.141-0.141 0.313-0.363 0.469-0.544 0.156-0.181 0.209-0.307 0.313-0.513 0.104-0.206 0.052-0.388-0.026-0.544-0.078-0.156-0.688-1.656-0.943-2.272-0.248-0.597-0.501-0.516-0.688-0.526-0.178-0.009-0.381-0.010-0.584-0.010-0.203 0-0.534 0.076-0.816 0.384-0.281 0.307-1.075 1.050-1.075 2.56s1.1 2.969 1.253 3.178c0.153 0.209 2.166 3.307 5.247 4.634 0.733 0.316 1.305 0.505 1.75 0.647 0.736 0.234 1.406 0.201 1.936 0.122 0.591-0.088 1.816-0.742 2.072-1.459 0.256-0.717 0.256-1.331 0.179-1.459-0.075-0.128-0.278-0.203-0.653-0.391z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
