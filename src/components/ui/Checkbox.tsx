import { forwardRef } from 'react'
import { Checkbox as MTCheckbox } from '@material-tailwind/react'

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  label?: React.ReactNode
  color?: 'blue' | 'red' | 'green' | 'amber' | 'teal' | 'indigo' | 'purple' | 'pink' | 'gray'
  onPointerEnterCapture?: React.PointerEventHandler<HTMLInputElement>
  onPointerLeaveCapture?: React.PointerEventHandler<HTMLInputElement>
  onResize?: React.ReactEventHandler<HTMLInputElement>
  onResizeCapture?: React.ReactEventHandler<HTMLInputElement>
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      color = 'green',
      className,
      onPointerEnterCapture: _onPointerEnterCapture,
      onPointerLeaveCapture: _onPointerLeaveCapture,
      onResize: _onResize,
      onResizeCapture: _onResizeCapture,
      ...props
    },
    ref
  ) {
    return (
      <MTCheckbox
        ref={ref}
        color={color as 'green'}
        label={label}
        crossOrigin={undefined}
        className={className}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        onResize={undefined}
        onResizeCapture={undefined}
        {...props}
      />
    )
  }
)
