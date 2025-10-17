import { ChangeEvent, useState } from 'react'
import { xssProtect } from '@/lib'

export function useSafeInput(initialValue: string = '') {
  const [value, setValue] = useState(initialValue)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = xssProtect(e.target.value)
    e.target.value = sanitizedValue
    setValue(sanitizedValue)
  }

  return {
    value,
    handleChange,
    setValue: (newValue: string) => setValue(xssProtect(newValue))
  }
}