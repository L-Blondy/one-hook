import { it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAudioAnalyser } from 'src'

it('Should not crash', () => {
  renderHook(() => useAudioAnalyser(null, { method: 'getByteFrequencyData' }))
})
