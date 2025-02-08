import { ClientEnv } from '@/lib/env';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ClientEnv {}
  }
}

export {};
