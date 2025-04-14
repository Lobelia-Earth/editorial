import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 bytes';

  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  // Get the power of 1024 that's closest to but not larger than the size
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Convert to the appropriate unit
  const value = bytes / Math.pow(k, i);

  // Format with the specified number of decimal places
  return `${parseFloat(value.toFixed(decimals))} ${sizes[i]}`;
}
