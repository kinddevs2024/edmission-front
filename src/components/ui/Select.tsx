import { type SelectHTMLAttributes } from 'react'
import { Select as MTSelect, Option } from '@material-tailwind/react'


interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  value,
  onChange,
  disabled,
  name,
  size: _omitSize,
  ...rest
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

  const handleChange = (val?: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: val ?? '', name },
      } as React.ChangeEvent<HTMLSelectElement>
      onChange(syntheticEvent)
    }
  }

  const selectProps = {
    id: inputId,
    label,
    value: value ?? '',
    onChange: (val?: string) => handleChange(val),
    variant: 'outlined' as const,
    size: 'md' as const,
    color: 'green' as const,
    error: !!error,
    className,
    disabled,
    name,
    ...rest,
  }

  return (
    <div className="w-full">
      <MTSelect {...(selectProps as React.ComponentProps<typeof MTSelect>)}>
        {placeholder && (
          <Option value="">{placeholder}</Option>
        )}
        {options.map((opt) => (
          <Option key={opt.value} value={opt.value}>
            {opt.label}
          </Option>
        ))}
      </MTSelect>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
