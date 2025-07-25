import type { StandardSchemaV1 } from '@standard-schema/spec'
import { ValidationError } from './schema-validation-error'
import type { MaybePromise } from 'src/types'
export { ValidationError as SchemaValidationError }

type ValidationFunctionSync<TInput = any, TOutput = TInput> = (
  data: TInput,
) => TOutput

type ValidationFunction<TInput = any, TOutput = TInput> = (
  data: TInput,
) => MaybePromise<TOutput>

export type ValidatorSync<TInput = any, TOutput = TInput> =
  | ValidationFunctionSync<TInput, TOutput>
  | StandardSchemaV1<TInput, TOutput>

export type Validator<TInput = any, TOutput = TInput> =
  | ValidationFunction<TInput, TOutput>
  | StandardSchemaV1<TInput, TOutput>

function validateSchemaSync<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  data: StandardSchemaV1.InferInput<TSchema>,
): StandardSchemaV1.InferOutput<TSchema> {
  let result = schema['~standard'].validate(data)
  if (result instanceof Promise) {
    // the validation library implements asyc validation
    throw new Error('async validation is not supported')
  }
  if (result.issues) throw new ValidationError(result, data)
  return result.value
}

export type ValidatorInput<TValidator extends Validator> = Awaited<
  TValidator extends ValidationFunction
    ? Parameters<TValidator>[0]
    : TValidator extends StandardSchemaV1
      ? StandardSchemaV1.InferInput<TValidator>
      : never
>

export type ValidatorOutput<TValidator extends Validator> = Awaited<
  TValidator extends ValidationFunction
    ? ReturnType<TValidator>
    : TValidator extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<TValidator>
      : never
>

export function validateSync<TValidator extends ValidatorSync>(
  fnOrSchema: TValidator,
  data: ValidatorInput<TValidator>,
): ValidatorOutput<TValidator> {
  return typeof fnOrSchema === 'function'
    ? fnOrSchema(data)
    : validateSchemaSync(fnOrSchema, data)
}

async function validateSchemaAsync<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  data: StandardSchemaV1.InferInput<TSchema>,
): Promise<StandardSchemaV1.InferOutput<TSchema>> {
  let result = await schema['~standard'].validate(data)
  if (result.issues) throw new ValidationError(result, data)
  return result.value
}

export function validateAsync<TValidator extends Validator>(
  fnOrSchema: TValidator,
  data: ValidatorInput<TValidator>,
): Promise<ValidatorOutput<TValidator>> {
  return typeof fnOrSchema === 'function'
    ? fnOrSchema(data)
    : validateSchemaAsync(fnOrSchema, data)
}
