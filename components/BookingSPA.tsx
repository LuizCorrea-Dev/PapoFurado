'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Calendar, 
  User, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Menu,
  CalendarCheck,
  Star,
  Scissors,
  Clock,
  CreditCard,
  LogOut,
  X,
  Camera,
  Trash2,
  Save,
  Mail,
  Phone,
  Edit,
  UserCircle
} from 'lucide-react';
import { format, addMonths, subMonths, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SERVICES, BARBERS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import AdminLandingPage from '@/components/AdminLandingPage';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type View = 'agendar' | 'perfil' | 'admin';

function isPortugalHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthDayStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const fixedHolidays = [
    '01-01', // Ano Novo
    '04-25', // Dia da Liberdade
    '05-01', // Dia do Trabalhador
    '06-10', // Dia de Portugal
    '08-15', // Assunção de Nossa Senhora
    '10-05', // Implantação da República
    '11-01', // Dia de Todos os Santos
    '12-01', // Restauração da Independência
    '12-08', // Imaculada Conceição
    '12-25', // Natal
  ];

  if (fixedHolidays.includes(monthDayStr)) {
    return true;
  }

  // Cálculo da Páscoa (Algoritmo de Meeus/Jones/Butcher)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monthEaster = Math.floor((h + l - 7 * m + 114) / 31);
  const dayEaster = ((h + l - 7 * m + 114) % 31) + 1;

  const easter = new Date(year, monthEaster - 1, dayEaster);
  
  // Outer hours check requires exact dates without time issues
  const goodFriday = new Date(easter.getTime());
  goodFriday.setDate(easter.getDate() - 2);
  
  const corpusChristi = new Date(easter.getTime());
  corpusChristi.setDate(easter.getDate() + 60);

  const carnival = new Date(easter.getTime());
  carnival.setDate(easter.getDate() - 47);

  const checkSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  return checkSameDay(date, goodFriday) || 
         checkSameDay(date, easter) || 
         checkSameDay(date, corpusChristi) ||
         checkSameDay(date, carnival);
}

interface BookingSPAProps {
  onBackToHome?: () => void;
  initialView?: View;
}

export default function BookingSPA({ onBackToHome, initialView }: BookingSPAProps) {
  // Mocking auth since Google Auth was removed
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  
  const [activeView, setActiveView] = useState<View>(initialView || 'agendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedBarber, setSelectedBarber] = useState(BARBERS[0]);
  const [slots, setSlots] = useState<{ time: string; status: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [adminBookings, setAdminBookings] = useState<any[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [adminSubView, setAdminSubView] = useState<'agenda' | 'landing' | 'bloqueios' | 'servicos' | 'profissionais' | 'clientes'>('agenda');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerTags, setCustomerTags] = useState({ isFavorite: false, isVIP: false, isPremium: false });
  const [selectedAdminDate, setSelectedAdminDate] = useState<Date>(new Date());
  const [blockedPeriods, setBlockedPeriods] = useState<any[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<any>(null);

  // Serviços e Profissionais dinâmicos
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loadingServicesBarbers, setLoadingServicesBarbers] = useState(true);

  // Estados para CRUD de Serviços
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', duration: 30, price: 30, description: '' });
  const [isCreatingService, setIsCreatingService] = useState(false);

  // Estados para CRUD de Profissionais (Barbeiros)
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [barberForm, setBarberForm] = useState({ name: '', role: '' });
  const [isCreatingBarber, setIsCreatingBarber] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
        // Atualiza a seleção se for a padrão antiga
        if (data.length > 0) {
          setSelectedService(prev => (!prev || prev.id === SERVICES[0].id) ? data[0] : prev);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar serviços:', e);
    }
  }, []);

  const fetchBarbers = useCallback(async () => {
    try {
      const res = await fetch('/api/barbers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBarbers(data);
        // Atualiza a seleção se for a padrão antiga
        if (data.length > 0) {
          setSelectedBarber(prev => (!prev || prev.id === BARBERS[0].id) ? data[0] : prev);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar profissionais:', e);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data && !data.error) {
        setConfig(data);
      }
    } catch (e) {
      console.error('Erro ao buscar configurações de contato:', e);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoadingServicesBarbers(true);
      await Promise.all([fetchServices(), fetchBarbers(), fetchConfig()]);
      setLoadingServicesBarbers(false);
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const servicesList = services.length > 0 ? services : SERVICES;
  const barbersList = barbers.length > 0 ? barbers : BARBERS;

  const handleCreateService = async () => {
    if (!serviceForm.name.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      });
      if (res.ok) {
        toast.success('Serviço criado com sucesso!');
        setIsCreatingService(false);
        setServiceForm({ name: '', duration: 30, price: 30, description: '' });
        fetchServices();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao criar serviço');
      }
    } catch (e) {
      toast.error('Erro ao criar serviço');
    }
  };

  const handleUpdateService = async (id: string) => {
    if (!serviceForm.name.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }
    try {
      const res = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...serviceForm })
      });
      if (res.ok) {
        toast.success('Serviço atualizado com sucesso!');
        setEditingServiceId(null);
        fetchServices();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao atualizar serviço');
      }
    } catch (e) {
      toast.error('Erro ao atualizar serviço');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Serviço excluído com sucesso!');
        fetchServices();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao excluir serviço');
      }
    } catch (e) {
      toast.error('Erro ao excluir serviço');
    }
  };

  const handleCreateBarber = async () => {
    if (!barberForm.name.trim()) {
      toast.error('Nome do profissional é obrigatório');
      return;
    }
    if (!barberForm.role.trim()) {
      toast.error('Função é obrigatória');
      return;
    }
    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barberForm)
      });
      if (res.ok) {
        toast.success('Profissional criado com sucesso!');
        setIsCreatingBarber(false);
        setBarberForm({ name: '', role: '' });
        fetchBarbers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao criar profissional');
      }
    } catch (e) {
      toast.error('Erro ao criar profissional');
    }
  };

  const handleUpdateBarber = async (id: string) => {
    if (!barberForm.name.trim()) {
      toast.error('Nome do profissional é obrigatório');
      return;
    }
    if (!barberForm.role.trim()) {
      toast.error('Função é obrigatória');
      return;
    }
    try {
      const res = await fetch('/api/barbers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...barberForm })
      });
      if (res.ok) {
        toast.success('Profissional atualizado com sucesso!');
        setEditingBarberId(null);
        fetchBarbers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao atualizar profissional');
      }
    } catch (e) {
      toast.error('Erro ao atualizar profissional');
    }
  };

  const handleDeleteBarber = async (id: string) => {
    if (!confirm('Deseja realmente excluir este profissional?')) return;
    try {
      const res = await fetch(`/api/barbers?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Profissional excluído com sucesso!');
        fetchBarbers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao excluir profissional');
      }
    } catch (e) {
      toast.error('Erro ao excluir profissional');
    }
  };

  // Profile Management State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    photoUrl: ''
  });
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }

      const data = await res.json();
      if (data.url) {
        setProfileForm(prev => ({
          ...prev,
          photoUrl: data.url
        }));
        toast.success('Imagem carregada com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.displayName || user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        photoUrl: user.photoURL || user.photoUrl || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id && !user?.uid) {
       toast.error('Usuário não identificado');
       return;
    }

    setIsSavingProfile(true);
    try {
      const id = user.id || user.uid;
      
      // Bloqueia atualização se for o ID de teste antigo
      if (id === 'local-user-id') {
        toast.error('Sessão antiga detectada. Recarregando...');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('local_user');
          window.location.reload();
        }
        return;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...profileForm
        }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar perfil');

      setUser((prev: any) => ({
        ...prev,
        displayName: profileForm.name,
        name: profileForm.name,
        phone: profileForm.phone,
        email: profileForm.email,
        photoURL: profileForm.photoUrl,
        photoUrl: profileForm.photoUrl
      }));
      
      setIsEditingProfile(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user?.id && !user?.uid) return;

    try {
      const id = user.id || user.uid;
      const res = await fetch(`/api/profile?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao excluir perfil');

      toast.success('Conta excluída com sucesso');
      onBackToHome?.();
    } catch (error) {
       console.error(error);
       toast.error('Erro ao excluir perfil');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao cancelar agendamento');

      setUserBookings(prev => prev.filter(b => b.id !== id));
      toast.success('Agendamento cancelado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const handleUpdateBooking = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Erro ao atualizar agendamento');

      setUserBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
      setIsEditingBooking(false);
      setBookingToEdit(null);
      toast.success('Agendamento atualizado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar agendamento');
    }
  };
  const [newBlock, setNewBlock] = useState({
    barberId: 'all',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    reason: '',
    type: 'indisponivel'
  });

  const login = async () => {
    setAuthLoading(true);
    try {
      const email = 'luizcorrea.pt@gmail.com';
      const res = await fetch(`/api/profile?email=${email}`);
      const userData = await res.json();
      
      if (!res.ok) throw new Error(userData.error || 'Erro ao carregar perfil');

      const finalUser = {
        uid: userData.id,
        id: userData.id,
        displayName: userData.name,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoUrl || null,
        photoUrl: userData.photoUrl || null,
        phone: userData.phone || '',
        isVIP: !!userData.isVIP,
        isPremium: !!userData.isPremium,
        isFavorite: !!userData.isFavorite,
        role: userData.email === 'luizcorrea.pt@gmail.com' ? 'admin' : 'client'
      };
      
      setUser(finalUser);
      setUserRole(finalUser.role as any);
      localStorage.setItem('local_user', JSON.stringify(finalUser));
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao acessar sua conta');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('local_user');
    setActiveView('agendar');
  };

  // Check for local session
  useEffect(() => {
    const saved = localStorage.getItem('local_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          setUser(parsed);
          setUserRole(parsed.email === 'luizcorrea.pt@gmail.com' ? 'admin' : (parsed.role || 'client'));
        }, 0);
      } catch (e) {}
    }
  }, []);

  // Fetch blocked periods
  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch('/api/blocks');
      const data = await res.json();
      setBlockedPeriods(data);
    } catch (error) {
      console.error('Erro ao buscar bloqueios:', error);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const fetchCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  const handleUpdateCustomerTags = async (customerId: string, tags: { isFavorite: boolean; isVIP: boolean; isPremium: boolean }) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customerId, ...tags })
      });
      if (res.ok) {
        toast.success('Ficha do cliente atualizada com sucesso!');
        fetchCustomers();
        if (selectedCustomer && selectedCustomer.email === user?.email) {
          const updatedUser = { ...user, ...tags };
          setUser(updatedUser);
          localStorage.setItem('local_user', JSON.stringify(updatedUser));
        }
        setIsCustomerModalOpen(false);
        setSelectedCustomer(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao atualizar cliente');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar cliente');
    }
  };

  useEffect(() => {
    if (activeView === 'admin' && adminSubView === 'clientes') {
      fetchCustomers();
    }
  }, [activeView, adminSubView, fetchCustomers]);

  // Fetch slots based on bookings
  const fetchSlots = useCallback(async () => {
    if (!user) return;
    setIsLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/bookings?date=${dateStr}`);
      const data = await res.json();
      
      const bookingsForDay = Array.isArray(data) ? data : [];
      
      const occupiedSlots = bookingsForDay
        .filter((b: any) => b.professional === selectedBarber.id)
        .map((b: any) => b.time);

      // Extrair limites de horários da config
      let startHour = 9;
      let startMin = 0;
      let endHour = 20;
      let endMin = 0;
      let isClosedOnSundays = true;

      const openingHoursStr = config?.footer?.openingHours || "Segunda - Sábado: 09:00 - 20:00 (Fechado aos Domingos)";
      
      const timeMatch = openingHoursStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
      if (timeMatch) {
        startHour = parseInt(timeMatch[1], 10);
        startMin = parseInt(timeMatch[2], 10);
        endHour = parseInt(timeMatch[3], 10);
        endMin = parseInt(timeMatch[4], 10);
      }

      if (openingHoursStr.toLowerCase().includes("domingo") && 
          (openingHoursStr.toLowerCase().includes("fechado") || openingHoursStr.toLowerCase().includes("closed"))) {
        isClosedOnSundays = true;
      }

      const isSunday = selectedDate.getDay() === 0;
      const isSaturday = selectedDate.getDay() === 6;
      const isHoliday = isPortugalHoliday(selectedDate);

      // Procurar se existe alguma Abertura Especial configurada para este dia e barbeiro
      const openingSpecial = blockedPeriods.find(bp => 
        bp.date === dateStr && 
        bp.type === 'abertura_especial' &&
        (bp.barberId === 'all' || bp.barberId === selectedBarber.id)
      );

      // Se não houver abertura especial, respeita o bloqueio de fins de semana e feriados
      if (!openingSpecial) {
        if (isSunday || isSaturday || isHoliday) {
          setSlots([]);
          setIsLoadingSlots(false);
          return;
        }
      } else {
        // Se houver abertura especial, altera os limites se startTime e endTime estiverem preenchidos
        if (openingSpecial.startTime) {
          const [sH, sM] = openingSpecial.startTime.split(':').map(Number);
          startHour = sH;
          startMin = sM;
        }
        if (openingSpecial.endTime) {
          const [eH, eM] = openingSpecial.endTime.split(':').map(Number);
          endHour = eH;
          endMin = eM;
        }
      }

      // Gerar slots de 15 em 15 minutos
      const allSlots: string[] = [];
      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        // Evita agendar no horário exato de fechar ou depois
        if (currentHour === endHour && currentMin >= endMin) {
          break;
        }
        
        allSlots.push(timeStr);
        
        currentMin += 15;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }

      const relevantBlocks = blockedPeriods.filter(bp => 
        bp.date === dateStr && 
        bp.type !== 'abertura_especial' &&
        (bp.barberId === 'all' || bp.barberId === selectedBarber.id)
      );

      setSlots(allSlots.map(time => {
        const isOccupied = occupiedSlots.includes(time);
        const isBlocked = relevantBlocks.some(block => {
          if (!block.startTime || !block.endTime) return true;
          return time >= block.startTime && time < block.endTime;
        });

        return {
          time,
          status: isOccupied ? 'OCUPADO' : (isBlocked ? 'BLOQUEADO' : 'LIVRE')
        };
      }));
    } catch (error) {
      console.error('Erro ao buscar slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [user, selectedDate, selectedBarber, blockedPeriods, config]);

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedBarber, blockedPeriods, config, user]);

  // Fetch User Bookings
  const fetchUserBookings = useCallback(async () => {
    if (!user || activeView !== 'perfil') return;
    setIsLoadingProfile(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      // Em uma demo local, mostramos todos ou filtramos por nome/id simulado
      setUserBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos do perfil:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user, activeView]);

  useEffect(() => {
    fetchUserBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeView]);

  // Fetch All Bookings for Admin
  const fetchAdminBookings = useCallback(async () => {
    if (!user || activeView !== 'admin') return;
    setIsLoadingAdmin(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setAdminBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos admin:', error);
    } finally {
      setIsLoadingAdmin(false);
    }
  }, [user, activeView]);

  useEffect(() => {
    fetchAdminBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeView]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: newStatus.toLowerCase() })
      });
      fetchAdminBookings();
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
    }
  };

  const handleToggleHoliday = async (holidayKey: string, isEnabled: boolean) => {
    const updatedHolidays = {
      ...(config?.holidays || {}),
      [holidayKey]: isEnabled
    };
    const updatedConfig = {
      ...config,
      holidays: updatedHolidays
    };
    setConfig(updatedConfig);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      toast.success('Configuração de feriado atualizada com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar configuração do feriado');
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.date || !newBlock.type) return;

    try {
      const isEditing = !!editingBlockId;
      const url = '/api/blocks';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing ? { id: editingBlockId, ...newBlock } : newBlock;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEditing ? 'Bloqueio atualizado com sucesso!' : 'Bloqueio adicionado com sucesso!');
        setIsAddingBlock(false);
        setEditingBlockId(null);
        setNewBlock({
          barberId: 'all',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '',
          endTime: '',
          reason: '',
          type: 'indisponivel'
        });
        fetchBlocks();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao salvar bloqueio');
      }
    } catch (error) {
      console.error('Erro ao salvar bloqueio:', error);
      toast.error('Erro ao salvar bloqueio');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) return;
    try {
      await fetch(`/api/blocks?id=${blockId}`, { method: 'DELETE' });
      fetchBlocks();
    } catch (error) {
      console.error('Erro ao remover bloqueio:', error);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !user) return;

    setIsBooking(true);
    try {
      const bookingData = {
        name: user.displayName || user.name || 'Cliente',
        phone: user.phone || '920087962',
        email: user.email || '',
        service: selectedService.name,
        professional: selectedBarber.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedSlot
      };

      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      setSelectedSlot(null);
      setActiveView('perfil');
      alert('Agendamento realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const sortedBookings = [...userBookings].sort((a, b) => {
    const dateA = new Date(a.date + 'T' + (a.time || a.startTime));
    const dateB = new Date(b.date + 'T' + (b.time || b.startTime));
    return dateA.getTime() - dateB.getTime();
  });

  const nextBooking = sortedBookings.find(b => {
    const bookingDate = new Date(b.date + 'T' + (b.time || b.startTime));
    return bookingDate >= new Date();
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131313]">
        <div className="w-8 h-8 border-4 border-[#e9c176] border-t-transparent rounded-none animate-spin" />
      </div>
    );
  }

  if (!user && activeView !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#131313] p-6 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="font-headline text-4xl font-extrabold text-[#e9c176] uppercase tracking-tighter">
            Barbearia<br />Papo Furado
          </h1>
          <p className="text-[#9a8f80] text-sm font-bold tracking-widest uppercase">Premium Grooming Experience</p>
        </div>
        
        <div className="relative w-full max-w-sm aspect-square rounded-none overflow-hidden shadow-2xl border border-white/5">
          <Image 
            src="https://picsum.photos/seed/barber-shop/800/800" 
            alt="Barber Shop" 
            fill
            className="object-cover opacity-60"
            style={{ backgroundColor: '#2a2a2a' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent" />
        </div>

        <button 
          onClick={login}
          className="w-full max-w-sm py-5 bg-[#e9c176] text-[#261900] text-sm font-bold tracking-[0.2em] uppercase rounded-none shadow-2xl shadow-[#e9c176]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          Entrar no Sistema
        </button>

        <button 
          onClick={onBackToHome}
          className="text-[#9a8f80] hover:text-[#e9c176] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Voltar à Home
        </button>
      </div>
    );
  }

  const renderServicosCRUD = () => {
    return (
      <div className="crud-container">
        <style dangerouslySetInnerHTML={{__html: `
          .crud-container { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 5rem; }
          .crud-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
          .crud-form { background: #1c1b1b; border: 1px solid rgba(233, 193, 118, 0.2); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
          .crud-form-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
          @media (min-width: 768px) { .crud-form-row { grid-template-columns: 1fr 1fr; } }
          .crud-input-group { display: flex; flex-direction: column; gap: 0.5rem; }
          .crud-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #9a8f80; letter-spacing: 0.05em; }
          .crud-input { background: #131313; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.6rem 1rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
          .crud-input:focus { border-color: #e9c176; }
          .crud-button-group { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
          .crud-btn-primary { background: #e9c176; color: #261900; font-weight: bold; padding: 0.6rem 1.2rem; font-size: 0.875rem; border: none; cursor: pointer; transition: opacity 0.2s; }
          .crud-btn-primary:hover { opacity: 0.9; }
          .crud-btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.6rem 1.2rem; font-size: 0.875rem; cursor: pointer; }
          .crud-btn-secondary:hover { background: rgba(255,255,255,0.05); }
          .crud-btn-danger { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 0.6rem 1.2rem; font-size: 0.875rem; cursor: pointer; transition: background 0.2s; border-style: solid; border-width: 1px; }
          .crud-btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
          .crud-list { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
          @media (min-width: 768px) { .crud-list { grid-template-columns: repeat(2, 1fr); } }
          .crud-card { background: #1c1b1b; border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; transition: all 0.2s; }
          .crud-card:hover { border-color: rgba(233,193,118,0.2); background: #222121; }
          .crud-card-content { display: flex; flex-direction: column; gap: 0.25rem; }
          .crud-card-title { font-size: 1.125rem; font-weight: bold; color: #e5e2e1; }
          .crud-card-meta { font-size: 0.75rem; color: #e9c176; font-weight: 600; text-transform: uppercase; }
          .crud-card-desc { font-size: 0.75rem; color: #9a8f80; margin-top: 0.25rem; }
          .crud-card-actions { display: flex; gap: 0.5rem; }
        `}} />
        <div className="crud-header">
          <h3 className="font-headline text-xl font-bold text-[#e9c176]">Gerenciamento de Serviços</h3>
          {!isCreatingService && !editingServiceId && (
            <button 
              onClick={() => {
                setIsCreatingService(true);
                setServiceForm({ name: '', duration: 30, price: 30, description: '' });
              }}
              className="crud-btn-primary"
            >
              + Novo Serviço
            </button>
          )}
        </div>

        {/* Formulário de Criação/Edição */}
        {(isCreatingService || editingServiceId) && (
          <div className="crud-form">
            <h4 className="font-headline text-md font-bold text-white mb-2">
              {editingServiceId ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
            </h4>
            <div className="crud-form-row">
              <div className="crud-input-group">
                <label className="crud-label">Nome do Serviço</label>
                <input 
                  type="text" 
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="crud-input"
                  placeholder="Ex: Corte Degradê Premium"
                />
              </div>
              <div className="crud-input-group">
                <label className="crud-label">Preço (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                  className="crud-input"
                  placeholder="Preço em Euros"
                />
              </div>
            </div>
            <div className="crud-form-row">
              <div className="crud-input-group">
                <label className="crud-label">Duração Estimada</label>
                <select 
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                  className="crud-input"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora (60 min)</option>
                  <option value={75}>1h 15m (75 min)</option>
                  <option value={90}>1h 30m (90 min)</option>
                  <option value={105}>1h 45m (105 min)</option>
                  <option value={120}>2 horas (120 min)</option>
                </select>
              </div>
              <div className="crud-input-group">
                <label className="crud-label">Descrição (Opcional)</label>
                <input 
                  type="text" 
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="crud-input"
                  placeholder="Ex: Inclui lavagem e finalização"
                />
              </div>
            </div>
            <div className="crud-button-group">
              <button 
                onClick={() => editingServiceId ? handleUpdateService(editingServiceId) : handleCreateService()}
                className="crud-btn-primary"
              >
                Salvar
              </button>
              <button 
                onClick={() => {
                  setIsCreatingService(false);
                  setEditingServiceId(null);
                  setServiceForm({ name: '', duration: 30, price: 30, description: '' });
                }}
                className="crud-btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Listagem de Serviços */}
        <div className="crud-list">
          {servicesList.map((s) => (
            <div key={s.id} className="crud-card">
              <div className="crud-card-content">
                <div className="crud-card-title">{s.name}</div>
                <div className="crud-card-meta">
                  {s.duration} min • €{s.price}
                </div>
                {s.description && <div className="crud-card-desc">{s.description}</div>}
              </div>
              <div className="crud-card-actions">
                <button 
                  onClick={() => {
                    setEditingServiceId(s.id);
                    setIsCreatingService(false);
                    setServiceForm({
                      name: s.name,
                      duration: s.duration,
                      price: s.price,
                      description: s.description || ''
                    });
                  }}
                  className="crud-btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteService(s.id)}
                  className="crud-btn-danger"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfissionaisCRUD = () => {
    return (
      <div className="crud-container">
        <style dangerouslySetInnerHTML={{__html: `
          .crud-container { display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 5rem; }
          .crud-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
          .crud-form { background: #1c1b1b; border: 1px solid rgba(233, 193, 118, 0.2); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
          .crud-form-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
          @media (min-width: 768px) { .crud-form-row { grid-template-columns: 1fr 1fr; } }
          .crud-input-group { display: flex; flex-direction: column; gap: 0.5rem; }
          .crud-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #9a8f80; letter-spacing: 0.05em; }
          .crud-input { background: #131313; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.6rem 1rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
          .crud-input:focus { border-color: #e9c176; }
          .crud-button-group { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
          .crud-btn-primary { background: #e9c176; color: #261900; font-weight: bold; padding: 0.6rem 1.2rem; font-size: 0.875rem; border: none; cursor: pointer; transition: opacity 0.2s; }
          .crud-btn-primary:hover { opacity: 0.9; }
          .crud-btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.6rem 1.2rem; font-size: 0.875rem; cursor: pointer; }
          .crud-btn-secondary:hover { background: rgba(255,255,255,0.05); }
          .crud-btn-danger { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 0.6rem 1.2rem; font-size: 0.875rem; cursor: pointer; transition: background 0.2s; border-style: solid; border-width: 1px; }
          .crud-btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
          .crud-list { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
          @media (min-width: 768px) { .crud-list { grid-template-columns: repeat(2, 1fr); } }
          .crud-card { background: #1c1b1b; border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; transition: all 0.2s; }
          .crud-card:hover { border-color: rgba(233,193,118,0.2); background: #222121; }
          .crud-card-content { display: flex; flex-direction: column; gap: 0.25rem; }
          .crud-card-title { font-size: 1.125rem; font-weight: bold; color: #e5e2e1; }
          .crud-card-meta { font-size: 0.75rem; color: #e9c176; font-weight: 600; text-transform: uppercase; }
          .crud-card-actions { display: flex; gap: 0.5rem; }
        `}} />
        <div className="crud-header">
          <h3 className="font-headline text-xl font-bold text-[#e9c176]">Gerenciamento de Profissionais</h3>
          {!isCreatingBarber && !editingBarberId && (
            <button 
              onClick={() => {
                setIsCreatingBarber(true);
                setBarberForm({ name: '', role: '' });
              }}
              className="crud-btn-primary"
            >
              + Novo Profissional
            </button>
          )}
        </div>

        {/* Formulário de Criação/Edição */}
        {(isCreatingBarber || editingBarberId) && (
          <div className="crud-form">
            <h4 className="font-headline text-md font-bold text-white mb-2">
              {editingBarberId ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}
            </h4>
            <div className="crud-form-row">
              <div className="crud-input-group">
                <label className="crud-label">Nome Completo</label>
                <input 
                  type="text" 
                  value={barberForm.name}
                  onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                  className="crud-input"
                  placeholder="Ex: Carlos Silva"
                />
              </div>
              <div className="crud-input-group">
                <label className="crud-label">Função / Especialidade</label>
                <input 
                  type="text" 
                  value={barberForm.role}
                  onChange={(e) => setBarberForm({ ...barberForm, role: e.target.value })}
                  className="crud-input"
                  placeholder="Ex: Barba Clássica e Fade"
                />
              </div>
            </div>
            <div className="crud-button-group">
              <button 
                onClick={() => editingBarberId ? handleUpdateBarber(editingBarberId) : handleCreateBarber()}
                className="crud-btn-primary"
              >
                Salvar
              </button>
              <button 
                onClick={() => {
                  setIsCreatingBarber(false);
                  setEditingBarberId(null);
                  setBarberForm({ name: '', role: '' });
                }}
                className="crud-btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Listagem de Profissionais */}
        <div className="crud-list">
          {barbersList.map((b) => (
            <div key={b.id} className="crud-card">
              <div className="crud-card-content">
                <div className="crud-card-title">{b.name}</div>
                <div className="crud-card-meta">{b.role || b.specialty}</div>
              </div>
              <div className="crud-card-actions">
                <button 
                  onClick={() => {
                    setEditingBarberId(b.id);
                    setIsCreatingBarber(false);
                    setBarberForm({
                      name: b.name,
                      role: b.role || b.specialty || ''
                    });
                  }}
                  className="crud-btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteBarber(b.id)}
                  className="crud-btn-danger"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderClientesCRUD = () => {
    // Filtrar clientes com base na busca
    const filteredCustomers = customers.filter(c => {
      const search = customerSearch.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(search) ||
        (c.email || '').toLowerCase().includes(search) ||
        (c.phone || '').toLowerCase().includes(search)
      );
    });

    return (
      <div className="crud-container">
        <style dangerouslySetInnerHTML={{__html: `
          .customers-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
          @media (min-width: 768px) { .customers-grid { grid-template-columns: repeat(2, 1fr); } }
          .customer-card { background: #1c1b1b; border: 1px solid rgba(255,255,255,0.05); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s; position: relative; }
          .customer-card:hover { border-color: rgba(233,193,118,0.2); background: #222121; }
          .customer-badge-container { display: flex; gap: 0.25rem; margin-top: 0.5rem; }
          .customer-badge { font-size: 8px; font-weight: bold; padding: 2px 6px; text-transform: uppercase; border-radius: 0px; letter-spacing: 0.05em; }
          .badge-vip { background: rgba(233, 193, 118, 0.15); color: #e9c176; border: 1px solid rgba(233, 193, 118, 0.3); }
          .badge-premium { background: rgba(209, 197, 180, 0.15); color: #d1c5b4; border: 1px solid rgba(209, 197, 180, 0.3); }
          .customer-info-row { display: flex; justify-content: space-between; font-size: 11px; color: #9a8f80; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 0.5rem; margin-top: 0.5rem; }
          .customer-metric { text-align: center; }
          .customer-metric-val { font-size: 14px; font-weight: bold; color: #e5e2e1; }
          .search-input-group { display: flex; width: 100%; margin-bottom: 1rem; }
          .search-input { background: #1c1b1b; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.25rem; width: 100%; outline: none; transition: all 0.2s; }
          .search-input:focus { border-color: #e9c176; background: #222121; }
          .star-fav { color: #e9c176; fill: #e9c176; }
          .modal-checkbox-row { display: flex; align-items: center; justify-content: space-between; background: #131313; padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.03); margin-bottom: 0.5rem; }
        `}} />

        <div className="crud-header" style={{ marginBottom: '1rem' }}>
          <h3 className="font-headline text-xl font-bold text-[#e9c176]">Gestão de Clientes</h3>
          <span className="text-xs text-[#9a8f80]">{customers.length} Clientes Cadastrados</span>
        </div>

        <div className="search-input-group">
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou telefone..." 
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {isLoadingCustomers ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#e9c176] border-t-transparent rounded-none animate-spin" />
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="customers-grid">
            {filteredCustomers.map((c) => {
              const clientBookings = adminBookings.filter(b => b.email === c.email || (c.phone && b.phone === c.phone));
              const completedBookings = clientBookings.filter(b => b.status === 'concluido');
              
              // Fidelidade (pontos)
              let totalMin = 0;
              completedBookings.forEach(b => {
                const svc = servicesList.find(s => s.name === b.service);
                totalMin += svc ? svc.duration : 30;
              });
              const points = Math.floor(totalMin / 15);

              return (
                <div key={c.id} className="customer-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="crud-card-title">{c.name || 'Sem nome'}</span>
                        {c.isFavorite && <Star className="star-fav inline" size={14} />}
                      </div>
                      <span className="text-xs text-[#9a8f80] block">{c.email}</span>
                      {c.phone && <span className="text-xs text-[#9a8f80] block">{c.phone}</span>}
                    </div>
                    
                    <button 
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerTags({
                          isFavorite: !!c.isFavorite,
                          isVIP: !!c.isVIP,
                          isPremium: !!c.isPremium
                        });
                        setIsCustomerModalOpen(true);
                      }}
                      className="crud-btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      Ficha
                    </button>
                  </div>

                  <div className="customer-badge-container">
                    {c.isVIP && <span className="customer-badge badge-vip">VIP</span>}
                    {c.isPremium && <span className="customer-badge badge-premium">Premium</span>}
                  </div>

                  <div className="customer-info-row">
                    <div className="customer-metric">
                      <div className="customer-metric-val">{completedBookings.length}</div>
                      Cortes
                    </div>
                    <div className="customer-metric">
                      <div className="customer-metric-val">{points}</div>
                      Pontos
                    </div>
                    <div className="customer-metric" style={{ textAlign: 'right' }}>
                      <div className="customer-metric-val" style={{ fontSize: '10px', marginTop: '3px' }}>
                        {(() => {
                          const todayStr = format(new Date(), 'yyyy-MM-dd');
                          const future = clientBookings.filter(b => b.date >= todayStr && b.status !== 'cancelado' && b.status !== 'concluido');
                          future.sort((x, y) => x.date.localeCompare(y.date) || (x.time || '').localeCompare(y.time || ''));
                          return future[0] ? `${format(new Date(future[0].date + 'T00:00:00'), 'dd/MM')} às ${future[0].time}` : 'Nenhum';
                        })()}
                      </div>
                      Próx. Agendamento
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#1c1b1b] p-8 rounded-none border border-dashed border-white/10 text-center text-[#9a8f80]">
            Nenhum cliente encontrado com a busca digitada.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#131313]">
      <style dangerouslySetInnerHTML={{__html: `
        /* Contraste para os icones de calendários e relógios em inputs date e time */
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1) !important;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover,
        input[type="time"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}} />
      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[280px] bg-[#1c1b1b] z-[70] shadow-2xl border-l border-white/5 p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="font-headline font-bold text-[#e9c176]">Menu</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-none transition-colors text-[#9a8f80]"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {[
                  { label: 'Voltar à Home', icon: ShieldCheck, action: onBackToHome, show: true },
                  { label: 'Minha Agenda', icon: CalendarCheck, action: () => { setActiveView('perfil'); setIsMenuOpen(false); }, show: userRole !== 'admin' },
                  { label: 'Novo Agendamento', icon: Scissors, action: () => { setActiveView('agendar'); setIsMenuOpen(false); }, show: userRole !== 'admin' },
                ]
                .filter(item => item.show)
                .map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center gap-4 p-4 rounded-none hover:bg-white/5 transition-all text-[#d1c5b4] hover:text-[#e9c176] group text-left"
                  >
                    <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-none hover:bg-red-500/10 transition-all text-[#9a8f80] hover:text-red-500 group text-left"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sair da Conta</span>
                </button>
                <p className="text-[10px] text-center text-[#9a8f80] mt-6 uppercase tracking-widest opacity-50">
                  © 2024 Papo Furado
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <button 
          onClick={onBackToHome}
          className="text-xl font-headline font-extrabold tracking-tighter text-[#e9c176] uppercase hover:opacity-80 transition-all"
        >
          Barbearia Papo Furado
        </button>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-[#e5e2e1] hover:text-[#e9c176] transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-32 px-4 max-w-4xl mx-auto w-full space-y-8">
        <AnimatePresence mode="wait">
          {activeView === 'agendar' && (
            <motion.div
              key="agendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero */}
              <section className="relative h-48 rounded-none overflow-hidden shadow-2xl">
                <Image 
                  src="https://picsum.photos/seed/barber/1200/600?blur=2" 
                  alt="Barbearia" 
                  fill
                  className="object-cover opacity-40"
                  referrerPolicy="no-referrer"
                  style={{ backgroundColor: '#2a2a2a' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <h1 className="font-headline text-3xl font-extrabold tracking-tight text-[#e9c176]">Agende seu Estilo</h1>
                  <p className="text-[#9a8f80] text-xs font-bold tracking-widest uppercase">Precisão em cada corte</p>
                </div>
              </section>

              {/* Service & Barber Selection */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Serviço</label>
                  <select 
                    value={selectedService?.id || ''}
                    onChange={(e) => setSelectedService(servicesList.find(s => s.id === e.target.value)!)}
                    className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm focus:border-[#e9c176] outline-none transition-all"
                  >
                    {servicesList.map(s => <option key={s.id} value={s.id} className="bg-[#131313]">{s.name} - €{s.price}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Barbeiro</label>
                  <select 
                    value={selectedBarber?.id || ''}
                    onChange={(e) => setSelectedBarber(barbersList.find(b => b.id === e.target.value)!)}
                    className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm focus:border-[#e9c176] outline-none transition-all"
                  >
                    {barbersList.map(b => <option key={b.id} value={b.id} className="bg-[#131313]">{b.name}</option>)}
                  </select>
                </div>
              </section>

              {/* Calendar */}
              <section className="space-y-4 bg-white/5 p-6 rounded-none border border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline text-lg font-bold text-[#e5e2e1] capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-none bg-white/5 text-[#9a8f80] hover:text-[#e9c176] transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-none bg-white/5 text-[#9a8f80] hover:text-[#e9c176] transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest pb-2">
                      {day}
                    </div>
                  ))}
                  {/* Empty slots for the first week */}
                  {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {daysInMonth.map((day, idx) => (
                    <button
                      key={idx}
                      disabled={isPast(day) && !isToday(day)}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-sm rounded-lg transition-all",
                        isSameDay(day, selectedDate) 
                          ? "bg-[#e9c176] text-[#261900] font-bold shadow-lg shadow-[#e9c176]/20 scale-110 z-10" 
                          : "bg-white/5 text-[#e5e2e1] hover:bg-white/10",
                        isPast(day) && !isToday(day) && "opacity-20 cursor-not-allowed"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  ))}
                </div>
              </section>

              {/* Slots */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="font-headline text-lg font-bold text-[#e5e2e1]">Horários Disponíveis</h3>
                  <span className="text-[10px] text-[#9a8f80] font-bold tracking-widest uppercase">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>

                <div className="space-y-3">
                  {isLoadingSlots ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#e9c176] border-t-transparent rounded-none animate-spin" />
                    </div>
                  ) : slots.length > 0 ? (
                    slots.map((slot, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-none transition-all duration-300",
                          slot.status === 'OCUPADO' || slot.status === 'BLOQUEADO' ? "bg-white/2 opacity-40 cursor-not-allowed" : "bg-white/5 hover:bg-white/10",
                          selectedSlot === slot.time && "border-l-4 border-[#e9c176] bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("text-xl font-headline font-extrabold", slot.status === 'OCUPADO' || slot.status === 'BLOQUEADO' ? "text-[#9a8f80]" : "text-[#e9c176]")}>
                            {slot.time}
                          </div>
                          <span className={cn("text-[10px] font-bold tracking-widest uppercase", slot.status === 'OCUPADO' || slot.status === 'BLOQUEADO' ? "text-[#9a8f80]" : "text-[#e9c176]")}>
                            {selectedSlot === slot.time ? 'SELECIONADO' : slot.status === 'BLOQUEADO' ? 'INDISPONÍVEL' : slot.status}
                          </span>
                        </div>
                        {slot.status === 'LIVRE' && (
                          <button 
                            onClick={() => setSelectedSlot(slot.time)}
                            className={cn(
                              "px-5 py-2 rounded-sm text-xs font-bold tracking-widest uppercase transition-all active:scale-95",
                              selectedSlot === slot.time 
                                ? "bg-[#e9c176] text-[#261900] shadow-lg shadow-[#e9c176]/20" 
                                : "border border-white/20 text-[#e9c176] hover:bg-[#e9c176]/10 hover:border-[#e9c176]"
                            )}
                          >
                            {selectedSlot === slot.time ? 'CHECK' : 'AGENDAR'}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (selectedDate.getDay() === 0 || selectedDate.getDay() === 6 || isPortugalHoliday(selectedDate)) ? (
                    <div className="text-center py-10 px-4 bg-[#1c1b1b] border border-[#e9c176]/20 rounded-none space-y-2">
                      <p className="text-[#e9c176] font-headline font-bold text-lg">Sem Expediente</p>
                      <p className="text-[#9a8f80] text-sm italic">
                        {isPortugalHoliday(selectedDate) 
                          ? "Estamos fechados devido ao feriado nacional em Portugal. Por favor, selecione outro dia útil!" 
                          : "Estamos fechados aos fins de semana (sábados e domingos). Por favor, selecione um dia de segunda a sexta-feira!"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-[#9a8f80] text-sm italic">Nenhum horário disponível para esta data.</p>
                  )}
                </div>
              </section>

              {/* CTA */}
              <div className="pt-8">
                <button 
                  disabled={!selectedSlot || isBooking}
                  onClick={handleConfirmBooking}
                  className="w-full py-5 bg-gradient-to-br from-[#e9c176] to-[#c5a059] text-[#261900] text-sm font-bold tracking-[0.2em] uppercase rounded-xl shadow-2xl shadow-[#e9c176]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBooking ? (
                    <div className="w-5 h-5 border-2 border-[#261900] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Confirmar Agendamento
                      <CalendarCheck size={20} />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-[#9a8f80] mt-4 tracking-widest uppercase">Sujeito a confirmação via WhatsApp</p>
              </div>
            </motion.div>
          )}

          {activeView === 'perfil' && (
            <motion.div
              key="perfil"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-20"
            >
              {/* User Header Section */}
              <section className="flex flex-col md:flex-row items-center gap-6 p-6 bg-[#1c1b1b] rounded-none border border-white/5">
                <div 
                  onClick={() => {
                    if (isEditingProfile) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="relative group/avatar-container"
                  style={{ cursor: isEditingProfile ? 'pointer' : 'default' }}
                >
                  <Avatar className="w-32 h-32 rounded-none border-2 border-[#e9c176]/20 shadow-xl overflow-hidden">
                    <AvatarImage src={(isUploadingImage ? '' : (isEditingProfile ? profileForm.photoUrl : (user?.photoURL || user?.photoUrl))) || ''} className="object-cover" />
                    <AvatarFallback className="bg-[#2a2a2a] text-[#e9c176] rounded-none">
                      {isUploadingImage ? null : <User size={48} />}
                    </AvatarFallback>
                  </Avatar>
                  {isEditingProfile && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none group-hover/avatar-container:bg-black/60 transition-all">
                      {!isUploadingImage && <Camera className="text-white" size={24} />}
                    </div>
                  )}
                  {!isEditingProfile && user?.isFavorite && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#e9c176] to-[#c5a059] p-2 rounded-none shadow-lg">
                      <Star size={18} fill="#131313" className="text-[#131313]" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
                
                <div className="flex-grow text-center md:text-left space-y-1">
                  {isEditingProfile ? (
                    <div className="space-y-3 max-w-md">
                      <div>
                        <Label htmlFor="name" className="text-xs uppercase text-[#9a8f80] mb-1 block">Nome Completo</Label>
                        <Input 
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-[#2a2a2a] border-white/10 text-white rounded-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="phone" className="text-xs uppercase text-[#9a8f80] mb-1 block">WhatsApp</Label>
                          <Input 
                            id="phone"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="bg-[#2a2a2a] border-white/10 text-white rounded-none"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-xs uppercase text-[#9a8f80] mb-1 block">Email</Label>
                          <Input 
                            id="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-[#2a2a2a] border-white/10 text-white rounded-none"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="photo" className="text-xs uppercase text-[#9a8f80] mb-1 block">URL da Foto</Label>
                        <Input 
                          id="photo"
                          value={profileForm.photoUrl}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                          className="bg-[#2a2a2a] border-white/10 text-white rounded-none placeholder:text-neutral-600"
                          placeholder="https://exemplo.com/foto.jpg"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-headline font-extrabold tracking-tight text-[#e5e2e1]">{user?.displayName || user?.name || 'Cliente'}</h1>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#9a8f80]">
                         <span className="flex items-center gap-1.5"><Mail size={14} className="text-[#e9c176]"/> {user?.email || 'N/A'}</span>
                         <span className="flex items-center gap-1.5"><Phone size={14} className="text-[#e9c176]"/> {user?.phone || 'WhatsApp não cadastrado'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 pt-1">
                        {userRole === 'admin' && (
                          <p className="text-[#e9c176] font-medium tracking-wide text-sm uppercase">Administrador</p>
                        )}
                        {user?.isVIP && (
                          <p className="text-[#e9c176] font-medium tracking-wide text-sm uppercase">CLIENTE VIP</p>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2 justify-center md:justify-start">
                        {user?.isPremium && (
                          <span className="px-3 py-1 bg-[#353534] rounded-none text-xs font-semibold text-[#d1c5b4] tracking-wider uppercase">PREMIUM</span>
                        )}
                        <span className="px-3 py-1 bg-[#353534] rounded-none text-xs font-semibold text-[#d1c5b4] tracking-wider uppercase">FIDELIDADE</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  {isEditingProfile ? (
                    <>
                      <Button 
                        disabled={isSavingProfile}
                        onClick={() => handleUpdateProfile()} 
                        className="bg-green-600 hover:bg-green-700 text-white rounded-none font-bold"
                      >
                        {isSavingProfile ? 'Salvando...' : <span className="flex items-center gap-2"><Save size={16}/> Salvar</span>}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingProfile(false)} 
                        className="border-white/20 text-white hover:bg-white/10 rounded-none"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={() => setIsEditingProfile(true)}
                        className="bg-[#e9c176] hover:bg-[#c5a059] text-[#131313] rounded-none font-bold"
                      >
                        <Edit size={16} className="mr-2" /> Editar Perfil
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => setIsDeletingProfile(true)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-none"
                      >
                        <Trash2 size={16} className="mr-2" /> Excluir Perfil
                      </Button>
                    </>
                  )}
                </div>
              </section>

              {/* Stats/Summary Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1c1b1b] p-6 rounded-none flex items-center justify-between group hover:bg-[#2a2a2a] transition-colors border border-white/5">
                  <div>
                    <p className="text-[#9a8f80] text-xs uppercase tracking-[0.1em] mb-1">Total de Cortes</p>
                    <p className="text-4xl font-headline font-bold text-[#e5e2e1]">{userBookings.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-none bg-[#e9c176]/10 flex items-center justify-center">
                    <Scissors className="text-[#e9c176]" size={24} />
                  </div>
                </div>
                <div className="bg-[#1c1b1b] p-6 rounded-none flex items-center justify-between group hover:bg-[#2a2a2a] transition-colors border border-white/5">
                  <div>
                    <p className="text-[#9a8f80] text-xs uppercase tracking-[0.1em] mb-1">Próximo Agendamento</p>
                    <p className="text-2xl font-headline font-bold text-[#e5e2e1]">
                      {nextBooking ? format(new Date(nextBooking.date + 'T00:00:00'), "dd 'de' MMM", { locale: ptBR }) : '--'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-none bg-[#e9c176]/10 flex items-center justify-center">
                    <Calendar className="text-[#e9c176]" size={24} />
                  </div>
                </div>
              </div>

              {/* Upcoming Appointment */}
              <section className="space-y-4">
                <h2 className="text-xl font-headline font-bold text-[#e9c176] tracking-tight pl-1">Próximo Compromisso</h2>
                {nextBooking ? (
                  <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1c1b1b] p-6 rounded-none border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#e9c176]/5 rounded-none -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-[#e9c176]/10"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-[#353534] rounded-none flex items-center justify-center shrink-0 border border-white/5">
                          <Scissors className="text-[#e9c176]" size={28} />
                        </div>
                        <div>
                          <h3 className="text-lg font-headline font-bold text-[#e5e2e1]">
                            {nextBooking.service || 'Serviço'}
                          </h3>
                          <p className="text-[#d1c5b4] text-sm">
                            Com o Barbeiro <span className="text-[#e9c176]">
                              {barbersList.find(b => b.id === (nextBooking.professional || nextBooking.barberId))?.name || nextBooking.professional || nextBooking.barberId}
                            </span>
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5 text-[#d1c5b4] text-xs font-medium">
                              <Clock size={14} />
                              {nextBooking.time || nextBooking.startTime}
                            </div>
                            <div className="flex items-center gap-1.5 text-[#d1c5b4] text-xs font-medium">
                              <Calendar size={14} />
                              {format(new Date(nextBooking.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-none uppercase tracking-widest leading-none border border-white/5 bg-[#2a2a2a]/50",
                            nextBooking.status === 'concluido' ? "text-green-500" : 
                            nextBooking.status === 'cancelado' ? "text-red-500" :
                            nextBooking.status === 'confirmado' ? "text-blue-400" :
                            nextBooking.status === 'reagendado' ? "text-purple-400" :
                            "text-[#e9c176]"
                          )}>
                            {nextBooking.status === 'concluido' ? 'Concluído' :
                             nextBooking.status === 'confirmado' ? 'Confirmado' :
                             nextBooking.status === 'reagendado' ? 'Reagendado' :
                             nextBooking.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                          </span>
                          <div className="flex gap-2">
                             <Button 
                                variant="outline"
                                onClick={() => {
                                  setBookingToEdit(nextBooking);
                                  setIsEditingBooking(true);
                                }}
                                className="border-white/20 text-white hover:bg-[#353534] rounded-none px-4 py-1.5 h-auto text-xs font-bold"
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleDeleteBooking(nextBooking.id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-none px-4 py-1.5 h-auto text-xs font-bold"
                              >
                                Cancelar
                              </Button>
                          </div>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1c1b1b] p-8 rounded-none border border-dashed border-white/10 text-center">
                    <p className="text-[#9a8f80] text-sm">Você não possui agendamentos pendentes.</p>
                    <button 
                      onClick={() => setActiveView('agendar')}
                      className="mt-4 text-[#e9c176] text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      Agendar agora
                    </button>
                  </div>
                )}
              </section>

              {/* Appointment History */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xl font-headline font-bold text-[#e9c176] tracking-tight">Histórico de Serviços</h2>
                  <button className="text-xs font-bold text-[#9a8f80] hover:text-[#e9c176] transition-colors uppercase tracking-widest">Ver Tudo</button>
                </div>
                <div className="space-y-3">
                  {userBookings.length > 0 ? (
                    userBookings.map((booking, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-[#1c1b1b] hover:bg-[#2a2a2a] transition-all rounded-none group cursor-default border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="text-[#d1c5b4] font-headline font-bold text-sm w-12 text-center leading-tight">
                            {format(new Date(booking.date + 'T00:00:00'), 'dd')}<br/>
                            <span className="text-[10px] font-medium opacity-60 uppercase">{format(new Date(booking.date + 'T00:00:00'), 'MMM', { locale: ptBR })}</span>
                          </div>
                          <div>
                            <h4 className="text-[#e5e2e1] font-bold text-sm">
                              {booking.service || 'Serviço'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#e9c176] text-[10px] font-bold bg-[#e9c176]/10 px-1.5 py-0.5 rounded-none">
                                {booking.time || booking.startTime}
                              </span>
                              <p className="text-[#d1c5b4] text-[11px] uppercase tracking-wider">
                                Barbeiro: {barbersList.find(b => b.id === (booking.professional || booking.barberId))?.name || booking.professional || booking.barberId}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#e5e2e1] font-headline font-bold">€ {servicesList.find(s => s.name === booking.service)?.price || 45}</p>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            booking.status === 'concluido' ? "text-green-500" : 
                            booking.status === 'cancelado' ? "text-red-500" :
                            booking.status === 'confirmado' ? "text-blue-400" :
                            booking.status === 'reagendado' ? "text-purple-400" :
                            "text-[#e9c176]"
                          )}>
                            {booking.status === 'concluido' ? 'Concluído' :
                             booking.status === 'confirmado' ? 'Confirmado' :
                             booking.status === 'reagendado' ? 'Reagendado' :
                             booking.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-[#9a8f80] text-sm italic">Nenhum histórico encontrado.</p>
                  )}
                </div>
              </section>

              {/* Quick Actions Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-5 bg-[#1c1b1b] rounded-none hover:bg-[#2a2a2a] transition-all group active:scale-[0.98] border border-white/5">
                  <div className="w-10 h-10 rounded-none bg-[#353534] flex items-center justify-center text-[#e9c176]">
                    <Star size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[#e5e2e1] font-bold text-sm">Pontos de Fidelidade</h4>
                    <p className="text-[#d1c5b4] text-xs">Total adquirido: {userBookings.filter(b => b.status === 'concluido').length * 10} pontos</p>
                  </div>
                  <div className="flex-grow"></div>
                </button>
                <button 
                  onClick={logout}
                  className="flex items-center gap-4 p-5 bg-[#1c1b1b] rounded-none hover:bg-[#2a2a2a] transition-all group active:scale-[0.98] border border-white/5"
                >
                  <div className="w-10 h-10 rounded-none bg-red-500/10 flex items-center justify-center text-red-500">
                    <LogOut size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[#e5e2e1] font-bold text-sm">Sair da Conta</h4>
                    <p className="text-[#d1c5b4] text-xs">Encerrar sessão no dispositivo</p>
                  </div>
                  <div className="flex-grow"></div>
                  <ChevronRight className="text-[#9a8f80] group-hover:text-red-500 transition-colors" size={20} />
                </button>
              </section>

              {/* Deletion Dialog */}
              <Dialog open={isDeletingProfile} onOpenChange={setIsDeletingProfile}>
                <DialogContent className="bg-[#1c1b1b] border-white/10 text-white rounded-none">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-headline font-bold text-red-500">Excluir Conta Permanentemente?</DialogTitle>
                    <DialogDescription className="text-[#9a8f80]">
                      Esta ação não pode ser desfeita. Todos os seus dados de perfil e histórico serão removidos do nosso sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-3">
                    <Button variant="outline" onClick={() => setIsDeletingProfile(false)} className="rounded-none border-white/10 text-white bg-transparent hover:bg-white/5">
                      Manter Conta
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteProfile()} className="rounded-none bg-red-600 hover:bg-red-700 font-bold">
                      Excluir Definitivamente
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {activeView === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="font-headline text-3xl font-extrabold text-[#e9c176]">Painel Admin</h2>
                </div>
                <div className="flex flex-wrap bg-white/5 p-1 rounded-none border border-white/10 gap-1 md:gap-0">
                  <button 
                    onClick={() => setAdminSubView('agenda')}
                    className={cn(
                      "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all",
                      adminSubView === 'agenda' ? "bg-[#e9c176] text-[#261900]" : "text-[#9a8f80] hover:text-[#e5e2e1]"
                    )}
                  >
                    Agenda
                  </button>
                  <button 
                    onClick={() => setAdminSubView('servicos')}
                    className={cn(
                      "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all",
                      adminSubView === 'servicos' ? "bg-[#e9c176] text-[#261900]" : "text-[#9a8f80] hover:text-[#e5e2e1]"
                    )}
                  >
                    Serviços
                  </button>
                  <button 
                    onClick={() => setAdminSubView('profissionais')}
                    className={cn(
                      "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all",
                      adminSubView === 'profissionais' ? "bg-[#e9c176] text-[#261900]" : "text-[#9a8f80] hover:text-[#e5e2e1]"
                    )}
                  >
                    Profissionais
                  </button>
                  <button 
                    onClick={() => setAdminSubView('landing')}
                    className={cn(
                      "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all",
                      adminSubView === 'landing' ? "bg-[#e9c176] text-[#261900]" : "text-[#9a8f80] hover:text-[#e5e2e1]"
                    )}
                  >
                    Landing Page
                  </button>
                  <button 
                    onClick={() => setAdminSubView('bloqueios')}
                    className={cn(
                      "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all",
                      adminSubView === 'bloqueios' ? "bg-[#e9c176] text-[#261900]" : "text-[#9a8f80] hover:text-[#e5e2e1]"
                    )}
                  >
                    Bloqueios
                  </button>
                  <button 
                    onClick={() => setAdminSubView('clientes')}
                    className={cn(
                      "px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all",
                      adminSubView === 'clientes' ? "bg-[#e9c176] text-[#261900]" : "text-[#9a8f80] hover:text-[#e5e2e1]"
                    )}
                  >
                    Clientes
                  </button>
                </div>
              </div>

              {adminSubView === 'agenda' ? (
                <>
                  {/* Date Selector Header */}
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-none border border-white/5">
                    <button 
                      onClick={() => setSelectedAdminDate(subDays(selectedAdminDate, 1))}
                      className="p-2 text-[#9a8f80] hover:text-[#e9c176] transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="text-center relative group bg-white/5 hover:bg-white/10 px-6 py-2 rounded-none border border-white/10 hover:border-[#e9c176]/50 transition-all cursor-pointer">
                      <input 
                        type="date"
                        value={format(selectedAdminDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [year, month, day] = e.target.value.split('-').map(Number);
                            setSelectedAdminDate(new Date(year, month - 1, day));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest mb-1 group-hover:text-[#e9c176] transition-colors flex items-center gap-2">
                          <Calendar size={12} className="text-[#e9c176]" />
                          {isToday(selectedAdminDate) ? 'Hoje' : format(selectedAdminDate, "eeee", { locale: ptBR })}
                        </p>
                        <h3 className="font-headline text-lg font-bold text-[#e5e2e1] group-hover:text-[#e9c176] transition-colors">
                          {format(selectedAdminDate, "dd 'de' MMMM", { locale: ptBR })}
                        </h3>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedAdminDate(addDays(selectedAdminDate, 1))}
                      className="p-2 text-[#9a8f80] hover:text-[#e9c176] transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-none border border-white/5">
                      <h3 className="text-sm font-bold text-[#9a8f80] uppercase tracking-widest mb-4">Resumo do Dia</h3>
                      <div className="text-4xl font-headline font-extrabold text-[#e9c176]">
                        {adminBookings.filter(b => b.date === format(selectedAdminDate, 'yyyy-MM-dd')).length}
                      </div>
                      <p className="text-xs text-[#9a8f80] mt-1">Agendamentos para este dia</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-none border border-white/5">
                      <h3 className="text-sm font-bold text-[#9a8f80] uppercase tracking-widest mb-4">Faturamento</h3>
                      <div className="text-4xl font-headline font-extrabold text-[#e9c176]">
                        € {adminBookings.filter(b => b.date === format(selectedAdminDate, 'yyyy-MM-dd')).reduce((acc, b) => {
                          const service = servicesList.find(s => s.name === b.service);
                          return acc + (service?.price || 45);
                        }, 0)}
                      </div>
                      <p className="text-xs text-[#9a8f80] mt-1">Estimado para este dia</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-none border border-white/5">
                    <h3 className="text-sm font-bold text-[#9a8f80] uppercase tracking-widest mb-4">Agenda do Dia</h3>
                    <div className="space-y-4">
                      {isLoadingAdmin ? (
                        <div className="py-12 flex justify-center">
                          <div className="w-6 h-6 border-2 border-[#e9c176] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : adminBookings.filter(b => b.date === format(selectedAdminDate, 'yyyy-MM-dd')).length > 0 ? (
                        adminBookings
                          .filter(b => b.date === format(selectedAdminDate, 'yyyy-MM-dd'))
                          .sort((a, b) => (a.time || a.startTime || '').localeCompare(b.time || b.startTime || ''))
                          .map((item, idx) => (
                            <div key={idx} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all rounded-none">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1.5">
                                  <p className="font-headline font-bold text-[#e5e2e1] text-sm md:text-base tracking-tight leading-tight mb-1">{item.name}</p>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#9a8f80] uppercase tracking-wider font-medium">
                                      <Scissors size={10} className="text-[#e9c176]/60" />
                                      {item.service}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#9a8f80] uppercase tracking-wider font-medium">
                                      <User size={10} className="text-[#e9c176]/60" />
                                      {barbersList.find(b => b.id === item.professional)?.name || item.professional}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <div className="flex items-center gap-1.5 text-[#e9c176] font-bold text-sm">
                                    <Clock size={12} className="opacity-60" />
                                    {item.time}
                                  </div>
                                  <select 
                                    value={item.status || 'pendente'}
                                    onChange={(e) => updateBookingStatus(item.id, e.target.value)}
                                    className={cn(
                                      "text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest leading-none outline-none cursor-pointer border border-white/5 bg-[#2a2a2a] transition-colors appearance-none",
                                      item.status === 'concluido' ? "text-green-500 hover:bg-green-500/5" : 
                                      item.status === 'cancelado' ? "text-red-500 hover:bg-red-500/5" :
                                      item.status === 'confirmado' ? "text-blue-400 hover:bg-blue-400/5" :
                                      item.status === 'reagendado' ? "text-purple-400 hover:bg-purple-400/5" :
                                      "text-[#e9c176] hover:bg-[#e9c176]/5"
                                    )}
                                  >
                                    <option value="pendente">Pendente</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="concluido">Concluído</option>
                                    <option value="reagendado">Reagendado</option>
                                    <option value="cancelado">Cancelado</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-center py-8 text-[#9a8f80] text-sm italic">Nenhum agendamento para este dia.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : adminSubView === 'bloqueios' ? (
                <div className="space-y-6 pb-20">
                  {/* Seção Feriados Portugal com Flags Sim/Não */}
                  <div className="bg-[#1c1b1b] p-6 rounded-none border border-white/5 space-y-4">
                    <h3 className="font-headline text-xl font-bold text-[#e9c176]">Feriados de Portugal (Bloqueio Automático)</h3>
                    <p className="text-xs text-[#9a8f80]">Marque 'Sim' para bloquear agendamentos neste feriado ou 'Não' para permitir o expediente normalmente.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' }}>
                      <style dangerouslySetInnerHTML={{__html: `
                        .holiday-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
                        @media (min-width: 768px) { .holiday-grid { grid-template-columns: repeat(2, 1fr); } }
                        .holiday-row { display: flex; justify-content: space-between; align-items: center; background: #131313; padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.03); }
                        .holiday-name { font-size: 13px; font-weight: 500; color: #e5e2e1; }
                        .holiday-toggle-group { display: flex; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
                        .holiday-toggle-btn { background: transparent; border: none; color: #9a8f80; padding: 4px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
                        .holiday-toggle-btn.active-yes { background: #e9c176; color: #261900; }
                        .holiday-toggle-btn.active-no { background: #ef4444; color: #fff; }
                      `}} />
                      <div className="holiday-grid">
                        {[
                          { key: '01-01', name: 'Ano Novo (01/01)' },
                          { key: '04-25', name: 'Dia da Liberdade (25/04)' },
                          { key: '05-01', name: 'Dia do Trabalhador (01/05)' },
                          { key: '06-10', name: 'Dia de Portugal (10/06)' },
                          { key: '08-15', name: 'Assunção de N. Sra. (15/08)' },
                          { key: '10-05', name: 'Implantação da República (05/10)' },
                          { key: '11-01', name: 'Dia de Todos os Santos (01/11)' },
                          { key: '12-01', name: 'Restauração da Indep. (01/12)' },
                          { key: '12-08', name: 'Imaculada Conceição (08/12)' },
                          { key: '12-25', name: 'Natal (25/12)' }
                        ].map((hol) => {
                          const isEnabled = config?.holidays ? config.holidays[hol.key] !== false : true;
                          return (
                            <div key={hol.key} className="holiday-row">
                              <span className="holiday-name">{hol.name}</span>
                              <div className="holiday-toggle-group">
                                <button 
                                  onClick={() => handleToggleHoliday(hol.key, true)}
                                  className={cn("holiday-toggle-btn", isEnabled && "active-yes")}
                                >
                                  Sim
                                </button>
                                <button 
                                  onClick={() => handleToggleHoliday(hol.key, false)}
                                  className={cn("holiday-toggle-btn", !isEnabled && "active-no")}
                                >
                                  Não
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Add Block Form */}
                  <div className="bg-[#1c1b1b] p-6 rounded-none border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-headline text-xl font-bold text-[#e9c176]">
                        {editingBlockId ? 'Editar Dia Fechado / Bloqueio' : 'Configurar Dia Fechado / Bloqueio'}
                      </h3>
                      <button 
                        onClick={() => {
                          if (isAddingBlock) {
                            setIsAddingBlock(false);
                            setEditingBlockId(null);
                            setNewBlock({
                              barberId: 'all',
                              date: format(new Date(), 'yyyy-MM-dd'),
                              startTime: '',
                              endTime: '',
                              reason: '',
                              type: 'indisponivel'
                            });
                          } else {
                            setIsAddingBlock(true);
                          }
                        }}
                        className="text-xs font-bold text-[#e9c176] uppercase tracking-widest hover:underline"
                      >
                        {isAddingBlock ? 'Cancelar' : '+ Novo Bloqueio'}
                      </button>
                    </div>

                    {isAddingBlock && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Escopo</label>
                          <select 
                            value={newBlock.barberId}
                            onChange={(e) => setNewBlock({...newBlock, barberId: e.target.value})}
                            className="w-full bg-[#131313] border border-white/10 rounded-none px-4 py-2.5 text-sm outline-none focus:border-[#e9c176]"
                          >
                            <option value="all">Barbearia Toda</option>
                            {barbersList.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Data</label>
                          <input 
                            type="date"
                            value={newBlock.date}
                            onChange={(e) => setNewBlock({...newBlock, date: e.target.value})}
                            className="w-full bg-[#131313] border border-white/10 rounded-none px-4 py-2 text-sm outline-none focus:border-[#e9c176]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Tipo</label>
                          <select 
                            value={newBlock.type}
                            onChange={(e) => setNewBlock({...newBlock, type: e.target.value})}
                            className="w-full bg-[#131313] border border-white/10 rounded-none px-4 py-2.5 text-sm outline-none focus:border-[#e9c176]"
                          >
                            <option value="indisponivel">Indisponível</option>
                            <option value="feriado">Feriado / Fechado</option>
                            <option value="horario_especial">Horário Especial</option>
                            <option value="abertura_especial">Abertura Especial (Abrir Expediente)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Início (Opcional)</label>
                          <input 
                            type="time"
                            value={newBlock.startTime}
                            onChange={(e) => setNewBlock({...newBlock, startTime: e.target.value})}
                            className="w-full bg-[#131313] border border-white/10 rounded-none px-4 py-2 text-sm outline-none focus:border-[#e9c176]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Fim (Opcional)</label>
                          <input 
                            type="time"
                            value={newBlock.endTime}
                            onChange={(e) => setNewBlock({...newBlock, endTime: e.target.value})}
                            className="w-full bg-[#131313] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#e9c176]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest">Motivo</label>
                          <input 
                            type="text"
                            placeholder="Ex: Feriado Municipal"
                            value={newBlock.reason}
                            onChange={(e) => setNewBlock({...newBlock, reason: e.target.value})}
                            className="w-full bg-[#131313] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#e9c176]"
                          />
                        </div>
                        <div className="md:col-span-3 pt-2">
                          <button 
                            onClick={handleAddBlock}
                            className="w-full py-3 bg-[#e9c176] text-[#261900] font-bold text-sm uppercase rounded-xl hover:opacity-90 active:scale-[0.99] transition-all"
                          >
                            {editingBlockId ? 'Atualizar Configuração' : 'Salvar Configuração'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Block List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blockedPeriods.length > 0 ? (
                      [...blockedPeriods].sort((a,b) => b.date.localeCompare(a.date)).map((block) => (
                        <div key={block.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span 
                                className={cn(
                                  "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                  block.type === 'feriado' ? "bg-red-500/20 text-red-500" : 
                                  block.type === 'horario_especial' ? "bg-blue-500/20 text-blue-500" : 
                                  block.type === 'abertura_especial' ? "" : 
                                  "bg-white/10 text-white"
                                )}
                                style={block.type === 'abertura_especial' ? {
                                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                  color: 'rgb(34, 197, 94)'
                                } : undefined}
                              >
                                {block.type === 'feriado' ? 'FERIADO' :
                                 block.type === 'horario_especial' ? 'HORÁRIO ESPECIAL' :
                                 block.type === 'abertura_especial' ? 'ABERTURA ESPECIAL' :
                                 'INDISPONÍVEL'}
                              </span>
                              <span className="text-xs font-bold text-[#e5e2e1]">
                                {format(new Date(block.date + 'T00:00:00'), "dd/MM/yyyy")}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#e9c176] font-medium">
                              {block.barberId === 'all' ? 'BARBEARIA TODA' : `BARBEIRO: ${barbersList.find(b => b.id === block.barberId)?.name}`}
                            </p>
                            {block.startTime && block.endTime ? (
                              <p className="text-[10px] text-[#9a8f80]">{block.startTime} às {block.endTime}</p>
                            ) : (
                              <p className="text-[10px] text-[#9a8f80]">Dia Inteiro</p>
                            )}
                            {block.reason && <p className="text-[10px] text-[#9a8f80] italic">&quot;{block.reason}&quot;</p>}
                          </div>
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <button 
                              onClick={() => {
                                setEditingBlockId(block.id);
                                setIsAddingBlock(true);
                                setNewBlock({
                                  barberId: block.barberId || 'all',
                                  date: block.date || '',
                                  startTime: block.startTime || '',
                                  endTime: block.endTime || '',
                                  reason: block.reason || '',
                                  type: block.type || 'indisponivel'
                                });
                              }}
                              className="text-[10px] text-[#e9c176] hover:underline uppercase tracking-wider font-bold"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteBlock(block.id)}
                              className="text-[10px] text-red-500 hover:underline uppercase tracking-wider font-bold"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full bg-white/5 p-8 rounded-xl border border-dashed border-white/10 text-center">
                        <p className="text-[#9a8f80] text-sm italic">Nenhum bloqueio configurado.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : adminSubView === 'servicos' ? (
                renderServicosCRUD()
              ) : adminSubView === 'profissionais' ? (
                renderProfissionaisCRUD()
              ) : adminSubView === 'clientes' ? (
                renderClientesCRUD()
              ) : (
                <AdminLandingPage />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#131313]/80 backdrop-blur-xl border-t border-white/5 px-4 pb-8 pt-4 flex justify-around items-center">
        {userRole !== 'admin' && (
          <>
            <button 
              onClick={() => setActiveView('agendar')}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-none transition-all",
                activeView === 'agendar' ? "text-[#261900] bg-[#e9c176]" : "text-[#9a8f80] hover:text-[#e9c176]"
              )}
            >
              <Calendar size={20} fill={activeView === 'agendar' ? "currentColor" : "none"} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Agendar</span>
            </button>
            <button 
              onClick={() => setActiveView('perfil')}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-none transition-all",
                activeView === 'perfil' ? "text-[#261900] bg-[#e9c176]" : "text-[#9a8f80] hover:text-[#e9c176]"
              )}
            >
              <User size={20} fill={activeView === 'perfil' ? "currentColor" : "none"} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Perfil</span>
            </button>
          </>
        )}
        {(userRole === 'admin' || activeView === 'admin') && (
          <button 
            onClick={() => setActiveView('admin')}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-none transition-all",
              activeView === 'admin' ? "text-[#261900] bg-[#e9c176]" : "text-[#9a8f80] hover:text-[#e9c176]"
            )}
          >
            <ShieldCheck size={20} fill={activeView === 'admin' ? "currentColor" : "none"} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
          </button>
        )}
      </nav>

      <Toaster position="top-center" richColors />

      {/* Edit Booking Dialog */}
      <Dialog open={isEditingBooking} onOpenChange={setIsEditingBooking}>
        <DialogContent className="bg-[#1c1b1b] border-white/10 text-white rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-bold text-[#e9c176]">Editar Agendamento</DialogTitle>
            <DialogDescription className="text-[#9a8f80]">
              Altere os detalhes do seu serviço. Sujeito a disponibilidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-[#9a8f80]">Serviço</Label>
              <select 
                className="w-full bg-[#2a2a2a] border border-white/10 text-white rounded-none p-2 text-sm outline-none"
                value={bookingToEdit?.service || ''}
                onChange={(e) => setBookingToEdit((prev: any) => ({ ...prev, service: e.target.value }))}
              >
                {servicesList.map(s => <option key={s.id} value={s.name}>{s.name} - €{s.price}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-[#9a8f80]">Barbeiro</Label>
              <select 
                className="w-full bg-[#2a2a2a] border border-white/10 text-white rounded-none p-2 text-sm outline-none"
                value={bookingToEdit?.professional || bookingToEdit?.barberId || ''}
                onChange={(e) => setBookingToEdit((prev: any) => ({ ...prev, professional: e.target.value, barberId: e.target.value }))}
              >
                {barbersList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-xs uppercase text-[#9a8f80]">Data</Label>
                <Input 
                  type="date"
                  value={bookingToEdit?.date || ''}
                  onChange={(e) => setBookingToEdit((prev: any) => ({ ...prev, date: e.target.value }))}
                  className="bg-[#2a2a2a] border-white/10 text-white rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-[#9a8f80]">Hora</Label>
                <Input 
                  type="time"
                  value={bookingToEdit?.time || bookingToEdit?.startTime || ''}
                  onChange={(e) => setBookingToEdit((prev: any) => ({ ...prev, time: e.target.value, startTime: e.target.value }))}
                  className="bg-[#2a2a2a] border-white/10 text-white rounded-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingBooking(false)} className="rounded-none border-white/20 text-white bg-transparent">
              Cancelar
            </Button>
            <Button onClick={() => handleUpdateBooking(bookingToEdit.id, bookingToEdit)} className="bg-[#e9c176] text-[#131313] rounded-none hover:bg-[#c5a059] font-bold">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Profile & Fidelity Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={(open) => {
        setIsCustomerModalOpen(open);
        if (!open) setSelectedCustomer(null);
      }}>
        <DialogContent className="bg-[#1c1b1b] border-white/10 text-white rounded-none sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-bold text-[#e9c176] flex items-center gap-2">
              Ficha do Cliente: {selectedCustomer?.name}
              {customerTags.isFavorite && <Star size={18} fill="#e9c176" className="text-[#e9c176]" />}
            </DialogTitle>
            <DialogDescription className="text-[#9a8f80]">
              Gerencie a classificação e veja o histórico de fidelidade do cliente.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 py-4">
              {/* Informações Cadastrais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#131313] p-4 border border-white/5">
                <div>
                  <span className="text-[9px] font-bold text-[#9a8f80] uppercase tracking-wider block">ID do Cliente</span>
                  <span className="text-xs font-mono break-all text-[#e5e2e1]">{selectedCustomer.id}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#9a8f80] uppercase tracking-wider block">Email</span>
                  <span className="text-xs text-[#e5e2e1]">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#9a8f80] uppercase tracking-wider block">Telefone</span>
                  <span className="text-xs text-[#e5e2e1]">{selectedCustomer.phone || 'Não cadastrado'}</span>
                </div>
              </div>

              {/* Classificação Administrativa */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#e9c176] uppercase tracking-widest border-b border-white/5 pb-1">Classificação do Cliente</h4>
                
                <div className="modal-checkbox-row">
                  <div>
                    <span className="text-sm font-semibold text-white block">Cliente Favorito</span>
                    <span className="text-[10px] text-[#9a8f80]">Destaca o cliente com uma estrela dourada no painel administrativo.</span>
                  </div>
                  <button 
                    onClick={() => setCustomerTags(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
                    className="p-1 rounded-none border border-white/10 hover:border-[#e9c176] transition-colors"
                  >
                    <Star size={20} fill={customerTags.isFavorite ? "#e9c176" : "none"} className={customerTags.isFavorite ? "text-[#e9c176]" : "text-[#9a8f80]"} />
                  </button>
                </div>

                <div className="modal-checkbox-row">
                  <div>
                    <span className="text-sm font-semibold text-white block">Cliente VIP</span>
                    <span className="text-[10px] text-[#9a8f80]">Classifica como cliente de alta prioridade.</span>
                  </div>
                  <button 
                    onClick={() => setCustomerTags(prev => ({ ...prev, isVIP: !prev.isVIP }))}
                    className={cn(
                      "px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-all",
                      customerTags.isVIP ? "bg-[#e9c176] text-[#261900] border-[#e9c176]" : "border-white/10 text-[#9a8f80]"
                    )}
                  >
                    {customerTags.isVIP ? 'Sim' : 'Não'}
                  </button>
                </div>

                <div className="modal-checkbox-row">
                  <div>
                    <span className="text-sm font-semibold text-white block">Cliente Premium</span>
                    <span className="text-[10px] text-[#9a8f80]">Dá direito a benefícios exclusivos de fidelidade.</span>
                  </div>
                  <button 
                    onClick={() => setCustomerTags(prev => ({ ...prev, isPremium: !prev.isPremium }))}
                    className={cn(
                      "px-3 py-1 text-xs font-bold uppercase tracking-wider border transition-all",
                      customerTags.isPremium ? "bg-[#d1c5b4] text-[#261900] border-[#d1c5b4]" : "border-white/10 text-[#9a8f80]"
                    )}
                  >
                    {customerTags.isPremium ? 'Sim' : 'Não'}
                  </button>
                </div>
              </div>

              {/* Fidelidade */}
              <div className="bg-white/5 p-4 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-[#e9c176] uppercase tracking-widest">Pontuação de Fidelidade</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="text-3xl font-headline font-extrabold text-white">
                      {(() => {
                        const clientB = adminBookings.filter(b => b.email === selectedCustomer.email || (selectedCustomer.phone && b.phone === selectedCustomer.phone));
                        const completed = clientB.filter(b => b.status === 'concluido');
                        let min = 0;
                        completed.forEach(b => {
                          const svc = servicesList.find(s => s.name === b.service);
                          min += svc ? svc.duration : 30;
                        });
                        return Math.floor(min / 15);
                      })()}
                    </span>
                    <span className="text-xs text-[#9a8f80] ml-2">pontos acumulados</span>
                  </div>
                  <span className="text-[10px] text-[#9a8f80] italic">1 ponto a cada 15 min de serviços concluídos</span>
                </div>
              </div>

              {/* Histórico de Serviços */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#e9c176] uppercase tracking-widest border-b border-white/5 pb-1">Histórico de Serviços</h4>
                <div className="overflow-x-auto border border-white/5" style={{ maxHeight: '200px' }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#131313] text-[#9a8f80] border-b border-white/5 uppercase text-[9px] tracking-wider font-bold">
                        <th className="p-3">Data</th>
                        <th className="p-3">Hora</th>
                        <th className="p-3">Serviço</th>
                        <th className="p-3">Barbeiro</th>
                        <th className="p-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const clientB = adminBookings.filter(b => b.email === selectedCustomer.email || (selectedCustomer.phone && b.phone === selectedCustomer.phone));
                        
                        return clientB.length > 0 ? (
                          [...clientB]
                            .sort((x, y) => y.date.localeCompare(x.date) || (y.time || '').localeCompare(x.time || ''))
                            .map((b, idx) => {
                              const svc = servicesList.find(s => s.name === b.service);
                              const price = svc ? svc.price : 45;
                              return (
                                <tr key={idx} className="border-b border-white/5 hover:bg-white/2">
                                  <td className="p-3 font-semibold text-[#e5e2e1]">
                                    {format(new Date(b.date + 'T00:00:00'), 'dd/MM/yyyy')}
                                  </td>
                                  <td className="p-3 text-[#d1c5b4]">{b.time}</td>
                                  <td className="p-3 text-[#e5e2e1]">{b.service}</td>
                                  <td className="p-3 text-[#d1c5b4]">
                                    {barbersList.find(barb => barb.id === b.professional)?.name || b.professional}
                                  </td>
                                  <td className="p-3 text-right text-[#e9c176] font-bold">€ {price}</td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-[#9a8f80] italic">
                              Nenhum histórico encontrado.
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ações */}
              <DialogFooter className="gap-3 border-t border-white/5 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    setSelectedCustomer(null);
                  }} 
                  className="rounded-none border-white/10 text-white bg-transparent hover:bg-white/5"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleUpdateCustomerTags(selectedCustomer.id, customerTags)} 
                  className="rounded-none bg-[#e9c176] hover:bg-[#c5a059] text-[#261900] font-bold"
                >
                  Salvar Classificação
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
