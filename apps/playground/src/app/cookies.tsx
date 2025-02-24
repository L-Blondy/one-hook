'use client'
import { optional, string } from 'valibot'
import { defineCookies } from '@1hook/use-cookie'

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
