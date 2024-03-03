import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'SecurityError';
  }
}
