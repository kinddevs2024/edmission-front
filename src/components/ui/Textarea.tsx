import { forwardRef } from 'react'
import { Textarea as MTTextarea } from '@material-tailwind/react'

interface TextareaProps extends Omit<React.ComponentProps<'textarea'>, 'size'> {
  label?: string
  error?: boolean
  resize?: boolean
}

export const Textarea = forwardRef<HTMLDivElement, TextareaProps>(
  function Textarea({ label, error, resize = false, variant = 'outlined', color = 'green', size = 'md', className, ...props }, ref) {
    return (
      <MTTextarea
        ref={ref}
        variant={variant as 'outlined'}
        size={size as 'md'}
        color={color as 'green'}
        label={label}
        error={!!error}
        resize={resize}
        className={className}
        placeholder={props.placeholder ?? ' '}
        containerProps={{ className: 'min-w-0 w-full' }}
        crossOrigin={undefined}
        onResize={undefined}
        onResizeCapture={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        {...props}
      />
    )
  }
)
