import { z } from "zod";
import { BaseErrorSchema } from "./base-error.schema";

export const BadRequestError = BaseErrorSchema.extend({
  statusCode: z.literal(400),
  error: z.literal("Bad Request"),
  message: z.string().default("Invalid request body or parameters"),
});

export const InternalServerError = BaseErrorSchema.extend({
  statusCode: z.literal(500),
  error: z.literal("Internal Server Error"),
  message: z.string().default("An unexpected error occurred"),
});

export const errors = {
  400: BadRequestError,
  500: InternalServerError,
};
