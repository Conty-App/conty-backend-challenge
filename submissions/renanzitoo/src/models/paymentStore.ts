import { Payment } from '../generated/prisma';
import {prisma} from './db';

export async function getAllPayments(): Promise<Payment[]> {
  return prisma.payment.findMany({
    orderBy: { created_at: 'desc' },
  });
}

export async function getPaymentById(external_id: string): Promise<Payment | null> {
  return prisma.payment.findUnique({
    where: { external_id },
  });
}