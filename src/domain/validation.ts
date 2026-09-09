import { z } from "zod";
import { Observation } from "./observation.js";

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateObservation(data: unknown): {
  success: true;
  data: z.infer<typeof Observation>;
} {
  const result = Observation.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  throw new ValidationError("Malformed observation", result.error.issues);
}
