'use client';

import React, { useState } from 'react';
import LandingPage from '@/components/LandingPage';
import BookingSPA from '@/components/BookingSPA';

export default function Home() {
  const [showBooking, setShowBooking] = useState(false);
  const [initialView, setInitialView] = useState<'agendar' | 'perfil' | 'admin'>('agendar');

  const startBooking = (view: 'agendar' | 'perfil' | 'admin' = 'agendar') => {
    setInitialView(view);
    setShowBooking(true);
  };

  if (showBooking) {
    return (
      <main>
        <BookingSPA 
          initialView={initialView}
          onBackToHome={() => setShowBooking(false)} 
        />
      </main>
    );
  }

  return (
    <main>
      <LandingPage 
        onStartBooking={() => startBooking('agendar')} 
        onOpenProfile={() => startBooking('perfil')}
        onOpenAdmin={() => startBooking('admin')}
      />
    </main>
  );
}
