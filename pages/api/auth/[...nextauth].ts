import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcryptjs from 'bcryptjs';
import { User } from '@/app/lib/definitions';

async function getUser(email: string): Promise<User | null> {
  try {
    const result = await sql<User>`SELECT * FROM users WHERE email = ${email}`;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Error fetching user');
  }
}

export default NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const user = await getUser(credentials.email);

        if (!user) {
          console.log('User not found');
          return null;
        }

        const isValidPassword = await bcryptjs.compare(credentials.password, user.password);

        if (!isValidPassword) {
          console.log('Invalid password');
          return null;
        }

        console.log('User authenticated:', user);
        return user;
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/api/auth/error',
  },
  session: {
    strategy: 'jwt',
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
});
