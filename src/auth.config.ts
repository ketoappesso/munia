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
        mode: { label: 'Mode', type: 'text' }, // 'login' or 'register'
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { phoneNumber, password, smsCode, mode } = credentials;

        // Only run on server-side
        if (typeof window !== 'undefined') return null;

        console.log('Credentials received:', { phoneNumber, mode, hasSmsCode: !!smsCode, hasPassword: !!password });

        // Clean phone number
        const cleanPhone = phoneNumber?.toString().replace(/\D/g, '');
        if (!cleanPhone) return null;

        // Initialize PrismaClient only when needed (server-side)
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // Import SMS verification helper
        const { verifySmsCode } = await import('@/lib/auth/smsVerification');

        // Handle SMS code verification
        if (smsCode) {
          console.log('Verifying SMS code for phone:', cleanPhone);
          
          // Verify the SMS code
          const isValidCode = verifySmsCode(cleanPhone, smsCode);
          if (!isValidCode) {
            console.log('Invalid SMS code');
            return null;
          }

          // Get or create user
          let user = await prisma.user.findUnique({
            where: { phoneNumber: cleanPhone },
          });

          if (!user && mode === 'register') {
            // Create new user with SMS verification
            console.log('Creating new user via SMS verification');
            user = await prisma.user.create({
              data: {
                phoneNumber: cleanPhone,
                username: cleanPhone, // Use phone as default username
                phoneVerified: true,
              },
            });
          }

          if (user) {
            // Update phone verification status
            if (!user.phoneVerified) {
              await prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
              });
            }

            return {
              id: user.id,
              name: user.name || user.username || user.phoneNumber,
              username: user.username,
              phoneNumber: user.phoneNumber,
            };
          }

          return null;
        }

        // Handle password authentication
        if (password) {
          console.log('Password authentication for phone:', cleanPhone);
          
          const user = await prisma.user.findUnique({
            where: { phoneNumber: cleanPhone },
          });

          if (mode === 'register') {
            // Registration with password
            if (user) {
              console.log('Phone number already registered');
              return null; // Phone already exists
            }

            try {
              const hashedPassword = await bcrypt.hash(password, 12);
              const newUser = await prisma.user.create({
                data: {
                  phoneNumber: cleanPhone,
                  passwordHash: hashedPassword,
                  username: cleanPhone, // Use phone as default username
                  phoneVerified: false, // Will be verified via SMS in registration flow
                },
              });
              console.log('New user created successfully:', newUser.id);
              return {
                id: newUser.id,
                name: newUser.name || newUser.username || newUser.phoneNumber,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
              };
            } catch (error) {
              console.error('Error creating user:', error);
              return null;
            }
          } else {
            // Login with password
            if (!user) {
              console.log('User not found');
              return null;
            }

            if (user.passwordHash) {
              const isValid = await bcrypt.compare(password, user.passwordHash);
              console.log('Password validation result:', isValid);
              if (isValid) {
                return {
                  id: user.id,
                  name: user.name || user.username || user.phoneNumber,
                  username: user.username,
                  phoneNumber: user.phoneNumber,
                };
              }
            }
            console.log('Invalid password');
            return null;
          }
        }

        console.log('No valid authentication method provided');
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
        pathname.match(/^\/[^\/]+$/) || // User profiles like /username are public
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
