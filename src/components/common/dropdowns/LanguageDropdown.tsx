import { useState, useRef, RefObject } from 'react'
import { cn } from '@/lib'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@iconify/react'
import { useOnClickOutside } from 'usehooks-ts'

import { OptimizeImage } from '../images'

export type LanguageOption = {
  id: string
  name: string
  flag: string
}

type LanguageDropdownProps = {
  options: LanguageOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

const LanguageDropdown = ({ options, value, onChange, className }: LanguageDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(option => option.id === value) || options[0]
  
  // Debug flag path
  // useEffect(() => {
  //   console.log('Selected flag path:', selectedOption.flag)
  // }, [selectedOption])

  useOnClickOutside(dropdownRef as RefObject<HTMLElement>, () => setIsOpen(false))

  return (
    <div 
      ref={dropdownRef}
      className={cn(
        'relative',
        className
      )}
    >
      {/* Selected option / trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2.5 py-2 px-3 rounded-full cursor-pointer'
      >
        <div className="size-9.5 rounded-full border border-slate-200 shadow-md overflow-hidden">
          <OptimizeImage 
            src={selectedOption.flag}
            alt={selectedOption.name}
            folder="flags"
            className="size-full"
          />
        </div>
        {/* <span className='text-[1.45rem]'>{selectedOption.name}</span> */}
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className='absolute top-full right-0 mt-2 w-full min-w-[160px] py-2 rounded-xl bg-white shadow-lg border border-slate-200 z-[51]'
          >
            <div className='py-1'>
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 w-full px-4.5 py-2.5 cursor-pointer text-left hover:bg-slate-50 transition-colors',
                    option.id === value && 'bg-slate-50/80'
                  )}
                >
                  <div className="size-8 rounded-full overflow-hidden">
                    <OptimizeImage 
                      src={option.flag}
                      alt={option.name}
                      folder="flags"
                      className="size-full"
                    />
                  </div>
                  <span className='text-[1.25rem]'>{option.name}</span>
                  {option.id === value && (
                    <Icon icon='lucide:check' className='ml-auto text-primary' />
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

export default LanguageDropdown