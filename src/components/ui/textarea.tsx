import React, { ChangeEvent, useState, forwardRef } from 'react'
import { cn, xssProtect } from '@/lib'

interface TextareaProps extends Omit<React.ComponentProps<'textarea'>, 'onChange'> {
  onSafeChange?: (e: ChangeEvent<HTMLInputElement>) => void
  defaultValue?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

const Textarea = forwardRef<HTMLInputElement, TextareaProps>(
  ({ className, defaultValue = '', onChange, onSafeChange, ...props }, ref) => {
    const [value, setValue] = useState(defaultValue)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = xssProtect(e.target.value)
      e.target.value = sanitizedValue
      setValue(sanitizedValue)
      
      onSafeChange?.(e)
      onChange?.(e)
    }

    return (
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        data-slot="textarea"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-Textarea/30 border-Textarea flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-lg',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
