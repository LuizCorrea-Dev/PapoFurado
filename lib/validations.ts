import { z } from 'zod';

export const bookingSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(50, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone inválido'),
  serviceId: z.string().uuid('Serviço inválido'),
  barberId: z.string().uuid('Barbeiro inválido'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido'),
});

export type BookingInput = z.infer<typeof bookingSchema>;
