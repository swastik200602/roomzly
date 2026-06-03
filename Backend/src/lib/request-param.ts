import { badRequest } from "@/lib/app-error.js";

export function param(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw badRequest(`Missing route parameter: ${name}`);
  }
  return value;
}
