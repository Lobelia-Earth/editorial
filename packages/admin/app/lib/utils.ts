import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const FileSizeSuffixes = [
  "bytes",
  "KB",
  "MB",
  "GB",
  "TB",
  "PB",
  "EB",
  "ZB",
  "YB",
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 bytes";

  const k = 1024;

  // Get the power of 1024 that's closest to but not larger than the size
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Convert to the appropriate unit
  const value = bytes / Math.pow(k, i);

  // Format with the specified number of decimal places
  return `${parseFloat(value.toFixed(decimals))} ${FileSizeSuffixes[i]}`;
}

const msPerMinute = 60 * 1000;
const msPerHour = msPerMinute * 60;
const msPerDay = msPerHour * 24;
const msPerMonth = msPerDay * 30;
const msPerYear = msPerDay * 365;

export function formatTime(date: Date, currentDate = new Date()) {
  const elapsed = currentDate.getTime() - date.getTime();

  if (elapsed < msPerMinute) {
    const seconds = Math.round(elapsed / 1000);
    return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
  } else if (elapsed < msPerHour) {
    const minutes = Math.round(elapsed / msPerMinute);
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else if (elapsed < msPerDay) {
    const hours = Math.round(elapsed / msPerHour);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else if (elapsed < msPerMonth) {
    const days = Math.round(elapsed / msPerDay);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  } else if (elapsed < msPerYear) {
    const months = Math.round(elapsed / msPerMonth);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  } else {
    const years = Math.round(elapsed / msPerYear);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
}
