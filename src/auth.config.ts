import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// PrismaClient will be initialized in authorize function when needed

export default {
  providers: [
    GitHub,
    Facebook,
    Google,
    Credentials({
      name: 'credentials',
      credentials: {
        phoneNumber: { label: 'Phone Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
        smsCode: { label: 'SMS Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { phoneNumber, password, smsCode } = credentials;

        // Only run on server-side
        if (typeof window !== 'undefined') return null;

        console.log('Credentials received:', { phoneNumber, password, smsCode });

        // Initialize PrismaClient only when needed (server-side)
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        if (phoneNumber && password) {
          // Phone + password authentication (for registration/login)
          console.log('Looking for user with phone:', phoneNumber);
          const user = await prisma.user.findFirst({
            where: { phoneNumber },
          });

          console.log('User found:', user);

          if (!user) {
            // Create new user if not found (registration)
            console.log('Creating new user with phone:', phoneNumber);

            try {
              const hashedPassword = await bcrypt.hash(password, 12);
              const newUser = await prisma.user.create({
                data: {
                  phoneNumber,
                  passwordHash: hashedPassword,
                  username: phoneNumber, // Use phone number as default username
                },
              });
              console.log('New user created successfully:', newUser.id);
              return newUser;
            } catch (error) {
              console.error('Error creating user in database:', error);

              // Check for duplicate constraint violation
              if (String(error).includes('unique') || String(error).includes('duplicate')) {
                console.log('Duplicate phone number detected');
                return null;
              }

              return null;
            }
          }

          // Verify password for existing user (login)
          if (user.passwordHash) {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            console.log('Password validation result:', isValid);
            if (isValid) return user;
          }
          console.log('Password validation failed or no password hash');
          return null;
        }

        if (phoneNumber && smsCode) {
          // SMS verification (for login)
          // Implement SMS code verification logic
          const user = await prisma.user.findUnique({
            where: { phoneNumber },
          });
          return user;
        }

        console.log('No valid credentials provided');
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname, search } = nextUrl;
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

      const unProtectedPages = ['/terms', '/privacy-policy']; // Add more here if needed
      const isOnUnprotectedPage =
        pathname === '/' || // The root page '/' is also an unprotected page
        pathname === '/feed' || // Feed page is now public
        unProtectedPages.some((page) => pathname.startsWith(page));
      const isProtectedPage = !isOnUnprotectedPage;

      if (isOnAuthPage) {
        // Redirect to /feed, if logged in and is on an auth page
        if (isLoggedIn) return NextResponse.redirect(new URL('/feed', nextUrl));
      } else if (isProtectedPage) {
        // Redirect to /login, if not logged in but is on a protected page
        if (!isLoggedIn) {
          const from = encodeURIComponent(pathname + search); // The /login page shall then use this `from` param as a `callbackUrl` upon successful sign in
          return NextResponse.redirect(new URL(`/login?from=${from}`, nextUrl));
        }
      }

      // Don't redirect if on an unprotected page, or if logged in and is on a protected page
      return true;
    },
  },
} satisfies NextAuthConfig;
