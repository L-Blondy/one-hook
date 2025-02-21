/* eslint-disable @typescript-eslint/no-unused-vars */
import { renderHook } from '@testing-library/react'
import { expectTypeOf, test } from 'vitest'
import { useMergeRefs } from '.'
import React from 'react'

test(`The type of the value should be preserved`, () => {
  renderHook(() => {
    const ref1 = React.useRef<HTMLElement | null>(null)
    const ref2 = React.useRef<HTMLElement | null>(null)
    const ref = useMergeRefs(ref1, ref2)
    expectTypeOf(ref).toEqualTypeOf<(value: HTMLElement | null) => void>()
  })
  renderHook(() => {
    const ref1 = React.useRef<HTMLElement | null | undefined>(null)
    const ref2 = React.useRef<HTMLElement | null | undefined>(null)
    const ref = useMergeRefs(ref1, ref2)
    expectTypeOf(ref).toEqualTypeOf<
      (value: HTMLElement | null | undefined) => void
    >()
  })
  renderHook(() => {
    const ref1 = React.useRef<HTMLElement | null>(null)
    const ref2 = React.useRef<HTMLElement | null>(null)
    const ref = useMergeRefs(ref1, ref2)
    expectTypeOf(ref).toEqualTypeOf<(value: HTMLElement | null) => void>()
  })
  renderHook(() => {
    const ref1 = (value: HTMLElement | null) => {}
    const ref2 = (value: HTMLElement | null) => {}
    const ref = useMergeRefs(ref1, ref2)
    expectTypeOf(ref).toEqualTypeOf<(value: HTMLElement | null) => void>()
  })
  renderHook(() => {
    const ref1 = (value: HTMLElement | null) => {}
    const ref2 = (value: HTMLElement | undefined) => {}
    const ref = useMergeRefs(ref1, ref2)
    expectTypeOf(ref).toEqualTypeOf<
      (value: HTMLElement | null | undefined) => void
    >()
  })
  renderHook(() => {
    const ref1 = (value: HTMLElement | undefined) => {}
    const ref2 = (value: HTMLElement | undefined) => {}
    const ref = useMergeRefs(ref1, ref2)
    expectTypeOf(ref).toEqualTypeOf<(value: HTMLElement | undefined) => void>()
  })
})
