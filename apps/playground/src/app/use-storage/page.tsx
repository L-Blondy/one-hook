'use client'
import React from 'react'
import { useClearLocalStorage, useLocalStorage } from './storage'
import { useIsHydrated } from '@rebase.io/use-is-hydrated'

export default function UseStoragePage() {
  const isHydrated = useIsHydrated()
  return isHydrated && <Impl />
}

/**
 * Generates an error on the server (localStorage is not defined)
 */
function Impl() {
  const [inputFn, setInputFn] = useLocalStorage('input-validation-function')
  const [inputSc, setInputSc] = useLocalStorage('input-validation-schema')
  const clearCookies = useClearLocalStorage()

  return (
    <div className="space-y-4">
      <div>
        <div>
          <h2>Validation Function</h2>
          <h3>This input is synced accross browser tabs</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputFn}
            onChange={(e) => setInputFn(e.target.value)}
            className="grow rounded border px-3 py-1 active:bg-gray-50"
          />
          <button
            onClick={() =>
              clearCookies({ keys: ['input-validation-function'] })
            }
            className="rounded border px-3 py-1 active:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div>
        <div>
          <h2>Validation Schema</h2>
          <h3>This input is synced accross browser tabs</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputSc}
            onChange={(e) => setInputSc(e.target.value)}
            className="grow rounded border px-3 py-1 active:bg-gray-50"
          />
          <button
            onClick={() => clearCookies({ keys: ['input-validation-schema'] })}
            className="rounded border px-3 py-1 active:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
