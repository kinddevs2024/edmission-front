declare module 'react-better-password' {
  import type { ComponentClass, InputHTMLAttributes } from 'react'

  export interface ReactBetterPasswordProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
    value?: string
    onChange?: (value: string) => void
    timeout?: number
    mask?: string
    show?: boolean
  }

  const ReactBetterPassword: ComponentClass<ReactBetterPasswordProps>
  export default ReactBetterPassword
}
