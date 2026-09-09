import { z } from "zod";

export const AgeRange = z
  .object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
  })
  .refine((v) => v.min <= v.max, {
    message: "Age min must be <= max",
  });
export type AgeRange = z.infer<typeof AgeRange>;

export const Age = z.union([AgeRange, z.literal("Unknown")]);
export type Age = z.infer<typeof Age>;

export function isValidAge(age: Age): boolean {
  if (age === "Unknown") return true;
  return age.min <= age.max && age.min >= 0;
}
