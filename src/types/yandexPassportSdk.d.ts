/** Yandex Passport «Мгновенный вход» — sdk-suggest-with-polyfills-latest.js */
export type YaAuthSuggestInitResult =
  | { status: 'ok'; handler: () => Promise<unknown> }
  | { status: 'error'; code?: string }

export type YaAuthSuggestOAuthParams = {
  client_id: string
  response_type: 'token'
  redirect_uri: string
}

export type YaAuthSuggestButtonParams = {
  view: 'button'
  parentId: string
  buttonSize?: 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl'
  buttonView?: 'main' | 'additional' | 'icon' | 'iconBG'
  buttonTheme?: 'light' | 'dark'
  buttonBorderRadius?: number | string
  buttonIcon?: 'ya' | 'yaEng'
}

declare global {
  interface Window {
    YaAuthSuggest?: {
      init: (
        oauth: YaAuthSuggestOAuthParams,
        tokenPageOrigin: string,
        suggest?: YaAuthSuggestButtonParams
      ) => Promise<YaAuthSuggestInitResult>
    }
    YaSendSuggestToken?: (origin: string, extraData: Record<string, unknown>) => void
  }
}

export {}
