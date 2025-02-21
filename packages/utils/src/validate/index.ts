import type { StandardSchemaV1 } from "@standard-schema/spec";
import { SchemaValidationError } from "./schema-validation-error";

type ValidationFunction<TInput = any, TOutput = TInput> = (
  data: TInput
) => TOutput;

export type Validator<TInput = any, TOutput = TInput> =
  | ValidationFunction<TInput, TOutput>
  | StandardSchemaV1<TInput, TOutput>;

export async function validateSchema<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  data: StandardSchemaV1.InferInput<TSchema>
): Promise<StandardSchemaV1.InferOutput<TSchema>> {
  let result = await schema["~standard"].validate(data);
  if (result.issues) throw new SchemaValidationError(result, data);
  return result.value;
}

type InferInput<TValidator extends Validator> =
  TValidator extends ValidationFunction
    ? Parameters<TValidator>[0]
    : TValidator extends StandardSchemaV1
      ? StandardSchemaV1.InferInput<TValidator>
      : never;

type InferOutput<TValidator extends Validator> =
  TValidator extends ValidationFunction
    ? ReturnType<TValidator>
    : TValidator extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<TValidator>
      : never;

// eslint-disable-next-line @typescript-eslint/require-await
export async function validate<TValidator extends Validator>(
  fnOrSchema: TValidator,
  data: InferInput<TValidator>
): Promise<InferOutput<TValidator>> {
  return typeof fnOrSchema === "function"
    ? fnOrSchema(data)
    : validateSchema(fnOrSchema, data);
}
