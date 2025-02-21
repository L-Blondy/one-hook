'use client'
import { type BaseSchema, optional, parse, string } from 'valibot'
import { defineCookies } from '@rebase.io/use-cookie'

export const { CookieProvider, useCookie, useClearCookies, cookieService } =
  defineCookies({
    'input-validation-schema': {
      expires: 7,
      validate: optional(string(), ''),
    },
    'input-validation-function': {
      expires: 7,
      validate: (value) => String(value ?? ''),
    },
  })
