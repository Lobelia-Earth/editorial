'use client';

import { useAppSelector } from '@/lib/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [router, user]);

  if (isLoading || user) return null;

  return (
    <div className="flex w-full h-full">
      <div className="self-center space-y-8 w-72 mx-auto">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight leading-none">
            Editorial Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to login
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
