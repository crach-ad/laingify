import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn/Aceternity class merge helper.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
