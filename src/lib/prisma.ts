// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Exportamos una única instancia de PrismaClient para toda la aplicación.
// El "declare global" es para evitar advertencias de "hot reload" en desarrollo.
declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma