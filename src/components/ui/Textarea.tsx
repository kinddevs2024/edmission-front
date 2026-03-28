import { forwardRef } from 'react'
import { Textarea as MTTextarea } from '@material-tailwind/react'

interface TextareaProps extends Omit<React.ComponentProps<'textarea'>, 'size'> {
  label?: string
  error?: boolean
  resize?: boolean
  variant?: 'outlined' | 'standard' | 'static'
  color?: 'green' | 'blue' | 'gray' | 'amber' | 'red'
  size?: 'md' | 'lg'
}

export const Textarea = forwardRef<HTMLDivElement, TextareaProps>(
  function Textarea(
    { label, error, resize = false, variant = 'outlined', color = 'green', size = 'md', className, placeholder: placeholderProp, ...props },
    ref
  ) {
    // MT outlined + label: use space placeholder so only the floating label shows (no duplicate hint inside the field).
    const placeholder =
      label != null && String(label).trim() !== '' ? (placeholderProp ?? ' ') : placeholderProp
    return (
      <MTTextarea
        ref={ref}
        variant={variant}
        size={size}
        color={color}
        label={label}
        error={!!error}
        resize={resize}
        className={className}
        placeholder={placeholder}
        containerProps={{ className: 'min-w-0 w-full' }}
        onResize={undefined}
        onResizeCapture={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        {...props}
      />
    )
  }
)
