import { forwardRef } from 'react'
import { Checkbox as MTCheckbox } from '@material-tailwind/react'

interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  label?: React.ReactNode
  color?: 'blue' | 'red' | 'green' | 'amber' | 'teal' | 'indigo' | 'purple' | 'pink' | 'gray'
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, color = 'green', className, ...props }, ref) {
    return (
      <MTCheckbox
        ref={ref}
        color={color as 'green'}
        label={label}
        crossOrigin={undefined}
        onResize={undefined}
        onResizeCapture={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        className={className}
        {...props}
      />
    )
  }
)
