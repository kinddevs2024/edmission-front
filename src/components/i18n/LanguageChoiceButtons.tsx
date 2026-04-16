import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { supportedLngs, type SupportedLng } from '@/i18n/config'

const LANGUAGE_LABELS: Record<SupportedLng, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
}

const LANGUAGE_FLAG_SRC: Record<SupportedLng, string> = {
  en: 'https://flagcdn.com/w80/us.png',
  ru: 'https://flagcdn.com/w80/ru.png',
  uz: 'https://flagcdn.com/w80/uz.png',
}

interface LanguageChoiceButtonsProps {
  onSelect: (lng: SupportedLng) => void | Promise<void>
  /** Extra class on each button row */
  buttonClassName?: string
}

/** Shared layout: same as auth ChooseLanguage page — flags + labels, comfortable touch targets. */
export function LanguageChoiceButtons({ onSelect, buttonClassName }: LanguageChoiceButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      {supportedLngs.map((lng) => (
        <Button
          key={lng}
          type="button"
          variant="secondary"
          className={cn(
            'min-h-[48px] w-full justify-start gap-3 px-4 py-3 text-left font-medium',
            buttonClassName
          )}
          onClick={() => void onSelect(lng)}
        >
          <span className="flex h-6 w-6 shrink-0 overflow-hidden rounded-full border border-black/10" aria-hidden>
            <img src={LANGUAGE_FLAG_SRC[lng]} alt="" className="h-full w-full object-cover" loading="lazy" />
          </span>
          {LANGUAGE_LABELS[lng]}
        </Button>
      ))}
    </div>
  )
}
