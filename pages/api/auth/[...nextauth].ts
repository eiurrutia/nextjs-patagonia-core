import NextAuth, { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcryptjs from 'bcryptjs';
import { User } from '@/app/lib/definitions';
import { incrementRateLimit, resetRateLimit, isRateLimited, getClientIp } from '@/app/lib/auth/rate-limit-db';

async function getUser(email: string): Promise<User | null> {
  try {
    const result = await sql<User>`SELECT * FROM users WHERE email = ${email}`;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Error fetching user');
  }
}

export const authOptions: NextAuthOptions = {
  events: {
    signIn: ({ user }) => {
      console.log('Usuario inició sesión:', user.email);
    },
    signOut: () => {
      console.log('Usuario cerró sesión');
    }
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        
        if (!credentials) {
          console.log('❌ No credentials provided');
          return null;
        }
        
        // Get Client IP
        const ipAddress = getClientIp(req);
        
        // Check limit of attempts based on email and IP
        const emailIdentifier = `email:${credentials.email}`;
        const ipIdentifier = `ip:${ipAddress}`;
        
        // Check if email is blocked due to too many failed attempts
        if (await isRateLimited(emailIdentifier)) {
          console.log(`Acceso bloqueado para email: ${credentials.email}`);
          throw new Error('Demasiados intentos fallidos. Por favor intente más tarde.');
        }
        
        // Check if IP is blocked due to too many failed attempts
        if (await isRateLimited(ipIdentifier)) {
          console.log(`Acceso bloqueado para IP: ${ipAddress}`);
          throw new Error('Demasiados intentos fallidos desde esta ubicación. Por favor intente más tarde.');
        }

        const user = await getUser(credentials.email);
        if (!user) {
          console.log('User not found');
          // Increment counter of failed attempts (email e IP)
          await incrementRateLimit(emailIdentifier);
          await incrementRateLimit(ipIdentifier);
          return null;
        }

        const isValidPassword = await bcryptjs.compare(credentials.password, user.password);
        if (!isValidPassword) {
          console.log('Invalid password');
          await incrementRateLimit(emailIdentifier);
          await incrementRateLimit(ipIdentifier);
          return null;
        }

        await resetRateLimit(emailIdentifier);
        await resetRateLimit(ipIdentifier);
        console.log('User authenticated:', user);
        return user;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      } else {
        session.user = {
          id: token.sub as string,
          role: token.role as string,
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    }
  },
};

export default NextAuth(authOptions);
