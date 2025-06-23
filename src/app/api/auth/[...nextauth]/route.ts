// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: { /*...*/ },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { 
            role: { include: { permissions: true } },
            store: true,
            // Incluimos las tiendas supervisadas desde el inicio
            supervisedStores: { include: { store: true } }
          }
        });

        if (!user || !user.role || !user.isActive) return null;
        
        const passwordsMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordsMatch) return null;
        
        return {
          id: user.id, name: user.name, email: user.email, image: null,
          role: user.role.name,
          permissions: user.role.permissions.map(p => p.action),
          homeRoute: user.role.homeRoute,
          storeId: user.storeId,
          storeName: user.store?.name || null,
          // Pasamos la lista de tiendas supervisadas
          supervisedStores: user.supervisedStores.map(s => s.store),
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.homeRoute = user.homeRoute;
        token.storeId = user.storeId;
        token.storeName = user.storeName;
        // CORRECCIÓN: Añadimos las tiendas al token
        if (user.role === 'SUPERVISOR') {
            token.supervisedStores = user.supervisedStores;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.homeRoute = token.homeRoute;
        session.user.storeId = token.storeId;
        session.user.storeName = token.storeName;
        // CORRECCIÓN: Pasamos las tiendas a la sesión
        if (token.supervisedStores) {
            session.user.supervisedStores = token.supervisedStores;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login', error: '/login' }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };