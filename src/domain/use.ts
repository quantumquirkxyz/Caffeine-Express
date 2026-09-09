import { z } from "zod";

export const Use = z
  .object({
    hours: z.number().min(0),
    period: z
      .object({
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .optional(),
  })
  .refine((v) => v.hours >= 0, {
    message: "Use hours must be non-negative",
  });
export type Use = z.infer<typeof Use>;
