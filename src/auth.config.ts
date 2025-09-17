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

        console.log('Credentials received:', { 
          phoneNumber, 
          mode, 
          modeType: typeof mode,
          modeValue: mode,
          hasSmsCode: !!smsCode, 
          hasPassword: !!password 
        });

        // Clean phone number
        const cleanPhone = phoneNumber?.toString().replace(/\D/g, '');
        if (!cleanPhone) return null;

        // Initialize PrismaClient only when needed (server-side)
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // Import SMS verification service
        const { getVerificationService } = await import('@/lib/sms/verificationService');

        // Handle SMS code verification
        if (smsCode) {
          console.log('Verifying SMS code for phone:', cleanPhone);

          // Verify the SMS code using new verification service
          const verificationService = getVerificationService();
          const verificationResult = verificationService.verifyCode(cleanPhone, smsCode);
          if (!verificationResult.success) {
            console.log('Invalid SMS code:', verificationResult.message);
            return null;
          }

          // Clear the verification after successful use
          verificationService.clearVerification(cleanPhone);

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
                // Note: phoneVerified field doesn't exist in the schema
              },
            });
          }

          if (user) {
            // Note: phoneVerified field doesn't exist in the schema
            // In production, you might want to track verification in a separate table

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
          console.log('Password authentication for phone:', cleanPhone, 'Mode:', mode);
          
          const user = await prisma.user.findUnique({
            where: { phoneNumber: cleanPhone },
          });

          if (mode === 'register') {
            // Registration with password requires SMS verification
            console.log('Registration attempt for phone:', cleanPhone);
            if (user) {
              console.log('Phone number already registered:', user.id);
              return null; // Phone already exists
            }

            // Verify SMS code is required for registration
            if (!smsCode) {
              console.log('SMS code required for registration');
              return null;
            }

            // Verify the SMS code using verification service
            const { getVerificationService } = await import('@/lib/sms/verificationService');
            const verificationService = getVerificationService();
            const verificationResult = verificationService.verifyCode(cleanPhone, smsCode);
            if (!verificationResult.success) {
              console.log('Invalid SMS code for registration:', verificationResult.message);
              return null;
            }

            // Clear the verification after successful use
            verificationService.clearVerification(cleanPhone);

            console.log('Creating new user for phone:', cleanPhone);
            try {
              const hashedPassword = await bcrypt.hash(password, 12);
              const newUser = await prisma.user.create({
                data: {
                  phoneNumber: cleanPhone,
                  passwordHash: hashedPassword,
                  username: cleanPhone, // Use phone as default username
                },
              });
              console.log('New user created successfully:', newUser.id, newUser.phoneNumber);
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
            console.log('Login attempt for phone:', cleanPhone);
            if (!user) {
              console.log('User not found for login');
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
