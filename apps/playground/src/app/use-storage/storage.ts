'use client'
import { optional, string } from 'valibot'
import { defineStorage } from '@rebase.io/use-storage'

export const { useLocalStorage, useClearLocalStorage } = defineStorage(
  {
    'input-validation-schema': {
      expires: 7,
      validate: optional(string(), ''),
    },
    'input-validation-function': {
      expires: 7,
      validate: (value) => String(value ?? ''),
    },
  },
  { type: 'local' },
)
