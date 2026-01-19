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

export function formatTime(date: Date, smartFormat = false) {
  const currentDate = new Date();
  const elapsed = currentDate.getTime() - date.getTime();
  const isInFuture = elapsed < 0;
  const absElapsed = Math.abs(elapsed);

  let timeValue: number;
  let unit: string;

  if (absElapsed < msPerMinute) {
    timeValue = Math.round(absElapsed / 1000);
    unit = timeValue === 1 ? "second" : "seconds";
  } else if (absElapsed < msPerHour) {
    timeValue = Math.round(absElapsed / msPerMinute);
    unit = timeValue === 1 ? "minute" : "minutes";
  } else if (absElapsed < msPerDay) {
    timeValue = Math.round(absElapsed / msPerHour);
    unit = timeValue === 1 ? "hour" : "hours";
  } else if (absElapsed < msPerMonth && smartFormat) {
    timeValue = Math.round(absElapsed / msPerDay);
    unit = timeValue === 1 ? "day" : "days";
  } else if (absElapsed < msPerYear && smartFormat) {
    timeValue = Math.round(absElapsed / msPerMonth);
    unit = timeValue === 1 ? "month" : "months";
  } else if (smartFormat) {
    timeValue = Math.round(absElapsed / msPerYear);
    unit = timeValue === 1 ? "year" : "years";
  } else {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  if (isInFuture) {
    return `in ${timeValue} ${unit}`;
  } else {
    return `${timeValue} ${unit} ago`;
  }
}
