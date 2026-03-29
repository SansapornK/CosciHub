// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: 'student' | 'alumni' | 'teacher';
      firstName?: string;
      lastName?: string;
      emailVerified?: boolean;
      verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_required';
      profileImageUrl?: string | null;
      galleryImages?: string[];
      skills?: string[]; // Added skills property
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'student' | 'alumni' | 'teacher';
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_required';
    profileImageUrl?: string;
    galleryImages?: string[];
    skills?: string[]; // Added skills property
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'alumni' | 'teacher';
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    verificationStatus?: 'pending' | 'approved' | 'rejected' | 'not_required';
    profileImageUrl?: string;
    galleryImages?: string[];
    skills?: string[]; // Added skills property
  }
}

// Add global augmentation for mongoose caching
declare global {
  var mongoose: {
    conn: any | null;
    promise: Promise<any> | null;
  };
  var mongoClient: {
    conn: any | null;
    promise: Promise<any> | null;
  };
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'not_required';
