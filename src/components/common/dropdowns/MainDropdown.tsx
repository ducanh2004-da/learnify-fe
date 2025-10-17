import { useRef, useState, ReactNode, RefObject } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib'
import { useOnClickOutside } from 'usehooks-ts'

type Option = {
  label: string
  value: string | number
  disabled?: boolean
  username?: boolean
  icon?: string
}

type UserInfo = {
  username?: string
  email?: string
}

type DropdownProps<T extends string | number> = {
  value: T
  options: Option[] | (string | number)[]
  placeholder?: string
  className?: string
  minWidth?: string
  align?: 'left' | 'right'
  showChecks?: boolean
  userInfo?: UserInfo
  children?: (props: { isOpen: boolean }) => ReactNode
  onChange: (value: T) => void
}

const MainDropdown = <T extends string | number>({ 
  value, 
  options, 
  placeholder = 'Select option',
  className,
  minWidth = '140px',
  align = 'left',
  showChecks = true,
  userInfo,
  children,
  onChange
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(dropdownRef as RefObject<HTMLElement>, () => setIsOpen(false))

  const normalizedOptions = options.map(option => 
    typeof option === 'object' 
      ? option 
      : { label: String(option), value: option }
  )

  const selectedLabel = normalizedOptions.find(opt => opt.value === value)?.label || placeholder

  const toggleDropdown = () => setIsOpen(!isOpen)

  return (
    <div ref={dropdownRef} className={cn('element-animation relative', className)}>
      {children ? (
        <div onClick={toggleDropdown}>
          {children({ isOpen })}
        </div>
      ) : (
        <button
          onClick={toggleDropdown}
          className={cn(
            'flex items-center gap-2 px-5 py-3.5 text-[1.25rem] border border-slate-200',
            'rounded-full bg-white hover:border-primary/50 transition-colors focus:outline-none',
            'cursor-pointer justify-between'
          )}
          style={{ minWidth }}
        >
          <span>{selectedLabel}</span>
          <Icon 
            icon="ph:caret-down" 
            className={cn('text-xl transition-transform', isOpen && 'rotate-180')} 
          />
        </button>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'absolute top-full mt-2 py-2 rounded-xl bg-white shadow-lg border border-slate-200 z-[51]',
              align === 'left' ? 'left-0' : 'right-0'
            )}
            style={{ minWidth }}
          >
            {userInfo && (
              <div className="border-b border-slate-200 mb-2">
                <div className="px-4 py-3">
                  <div className="flex flex-col">
                    {userInfo.username && (
                      <span className="text-[1.25rem] text-gray-800 font-semibold">
                        {userInfo.username}
                      </span>
                    )}
                    {userInfo.email && (
                      <span className="text-[1.05rem] text-gray-500">
                        {userInfo.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="py-1 max-h-[300px] overflow-y-auto">
              {normalizedOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value as T)
                      setIsOpen(false)
                    }
                  }}
                  disabled={option.disabled}
                  className={cn(
                    'flex items-center w-full px-4 py-2.5 text-left transition-colors text-[1.1rem]',
                    option.disabled ? 'cursor-default text-gray-400' : 'cursor-pointer hover:bg-slate-50',
                    option.value === value && 'bg-slate-50/80',
                    option.username && 'font-medium'
                  )}
                >
                  {option.icon && (
                    <Icon icon={option.icon} className="mr-2 text-[1.2rem] text-gray-600" />
                  )}
                  <span>{option.label}</span>
                  {showChecks && option.value === value && !option.disabled && (
                    <Icon icon="lucide:check" className="ml-auto text-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MainDropdown