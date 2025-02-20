import type { StandardSchemaV1 } from "@standard-schema/spec";

export async function parseStandardSchema<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  data: StandardSchemaV1.InferInput<TSchema>
): Promise<StandardSchemaV1.InferOutput<TSchema>> {
  let result = await schema["~standard"].validate(data);
  if (result.issues) throw new ValidationError(result, data);
  return result.value;
}

export class ValidationError<TData = any> extends Error {
  override name: "ValidationError";
  issues: readonly StandardSchemaV1.Issue[];
  data: TData;

  constructor(result: StandardSchemaV1.FailureResult, data: TData) {
    super("Validation error");
    this.name = "ValidationError";
    this.issues = result.issues;
    this.data = data;
  }
}

export let isValidationError = (error: any): error is ValidationError =>
  error instanceof ValidationError;
