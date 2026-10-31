import { BadRequestException, type PipeTransform } from "@nestjs/common";

/** Minimal structural type so the API does not need a direct dependency on zod. */
interface SafeParseSchema<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> } };
}

/**
 * Validates and sanitizes a request payload against a shared Zod contract.
 * Unknown properties are stripped, which also prevents mass-assignment of fields
 * that are not part of the contract.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: SafeParseSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value ?? {});
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
