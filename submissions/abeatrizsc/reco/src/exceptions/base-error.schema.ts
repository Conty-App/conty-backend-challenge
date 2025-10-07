import { z } from "zod";

export const BaseErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});

export type BaseErrorSchema = z.infer<typeof BaseErrorSchema>;