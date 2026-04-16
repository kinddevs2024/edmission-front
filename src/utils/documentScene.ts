import type { DocumentPageFormat, DocumentScene, DocumentSceneElement, DocumentType } from '@/types/documentModule'

export const DOCUMENT_PAGE_FORMATS: Array<{ value: DocumentPageFormat; label: string }> = [
  { value: 'A4_PORTRAIT', label: 'A4 Portrait' },
  { value: 'A4_LANDSCAPE', label: 'A4 Landscape' },
  { value: 'LETTER', label: 'Letter' },
  { value: 'CUSTOM', label: 'Custom' },
]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  offer: 'Offer',
  scholarship: 'Scholarship',
}

export const MERGE_TAG_GROUPS = {
  Student: [
    '{{student.firstName}}',
    '{{student.lastName}}',
    '{{student.fullName}}',
    '{{student.email}}',
    '{{student.phone}}',
    '{{student.country}}',
  ],
  University: [
    '{{university.name}}',
    '{{university.address}}',
    '{{university.logo}}',
  ],
  Offer: [
    '{{offer.programName}}',
    '{{offer.degreeLevel}}',
    '{{offer.intake}}',
    '{{offer.startDate}}',
    '{{offer.startDateLabel}}',
    '{{offer.tuitionFee}}',
    '{{offer.currency}}',
    '{{offer.tuitionDisplay}}',
    '{{offer.conditions}}',
  ],
  Scholarship: [
    '{{scholarship.amount}}',
    '{{scholarship.percent}}',
    '{{scholarship.type}}',
    '{{scholarship.summary}}',
  ],
  Dates: [
    '{{today}}',
    '{{deadline.acceptBy}}',
    '{{deadline.acceptByLabel}}',
  ],
  System: [
    '{{document.id}}',
    '{{document.issuedOn}}',
    '{{document.issuedOnLabel}}',
    '{{document.message}}',
    '{{document.summary}}',
    '{{document.smallPrint}}',
  ],
} as const

const PAGE_DIMENSIONS: Record<Exclude<DocumentPageFormat, 'CUSTOM'>, { width: number; height: number }> = {
  A4_PORTRAIT: { width: 794, height: 1123 },
  A4_LANDSCAPE: { width: 1123, height: 794 },
  LETTER: { width: 816, height: 1056 },
}

export function getPageDimensions(format: DocumentPageFormat, width?: number, height?: number) {
  if (format === 'CUSTOM') {
    return {
      width: Math.max(320, Math.round(width ?? 794)),
      height: Math.max(320, Math.round(height ?? 1123)),
    }
  }
  return PAGE_DIMENSIONS[format]
}

export function createBlankScene(format: DocumentPageFormat, width?: number, height?: number): DocumentScene {
  const size = getPageDimensions(format, width, height)
  return {
    version: '1.0.0',
    page: {
      format,
      width: size.width,
      height: size.height,
      backgroundColor: '#ffffff',
      safeMargin: 32,
    },
    elements: [],
  }
}

export function parseScene(canvasJson: string | undefined, fallbackFormat: DocumentPageFormat = 'A4_PORTRAIT', width?: number, height?: number): DocumentScene {
  if (!canvasJson) return createBlankScene(fallbackFormat, width, height)
  try {
    const parsed = JSON.parse(canvasJson) as Partial<DocumentScene>
    const format = parsed.page?.format ?? fallbackFormat
    const size = getPageDimensions(format, parsed.page?.width ?? width, parsed.page?.height ?? height)
    return {
      version: typeof parsed.version === 'string' && parsed.version.trim() ? parsed.version : '1.0.0',
      page: {
        format,
        width: size.width,
        height: size.height,
        backgroundColor: parsed.page?.backgroundColor ?? '#ffffff',
        safeMargin: parsed.page?.safeMargin ?? 32,
      },
      elements: Array.isArray(parsed.elements) ? parsed.elements.map(normalizeElement).filter(Boolean) as DocumentSceneElement[] : [],
    }
  } catch {
    return createBlankScene(fallbackFormat, width, height)
  }
}

export function stringifyScene(scene: DocumentScene) {
  return JSON.stringify(scene)
}

/**
 * Canvas JSON sometimes carries non-strings (e.g. Mongo BSON Binary serialized as `{ buffer: ... }`).
 * Those must never reach Konva `text` or React DOM — they trigger "Objects are not valid as a React child".
 */
export function coerceCanvasString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value !== 'object') return ''

  const v = value as Record<string, unknown>

  if (v.type === 'Buffer' && Array.isArray(v.data)) {
    try {
      const bytes = Uint8Array.from(v.data as number[])
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    } catch {
      return ''
    }
  }

  if (v.$binary && typeof v.$binary === 'object' && v.$binary !== null) {
    const base64 = (v.$binary as { base64?: string }).base64
    if (typeof base64 === 'string') {
      try {
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      } catch {
        return ''
      }
    }
  }

  if ('buffer' in v && v.buffer != null) {
    const b = v.buffer
    try {
      if (b instanceof ArrayBuffer) {
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(b))
      }
      if (typeof b === 'object' && b !== null && Array.isArray((b as { data?: unknown }).data)) {
        const bytes = Uint8Array.from((b as { data: number[] }).data)
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      }
    } catch {
      return ''
    }
  }

  return ''
}

export function resolveTemplateText(value: unknown, payload: Record<string, unknown>): string {
  const str =
    value === undefined || value === null
      ? ''
      : typeof value === 'string'
        ? value
        : coerceCanvasString(value)
  return str.replace(/{{\s*([^}]+)\s*}}/g, (_match, rawPath: string) => {
    const found = getPathValue(payload, rawPath.trim())
    if (found == null) return ''
    if (typeof found === 'string' || typeof found === 'number' || typeof found === 'boolean') {
      return String(found)
    }
    return coerceCanvasString(found)
  })
}

export function resolveScene(scene: DocumentScene, payload: Record<string, unknown>): DocumentScene {
  return {
    ...scene,
    elements: scene.elements.map((element) => ({
      ...element,
      content: resolveTemplateText(element.content, payload),
      src: resolveTemplateText(element.src, payload),
    })),
  }
}

export function createSamplePayload(type: DocumentType): Record<string, unknown> {
  return {
    today: new Date().toISOString().slice(0, 10),
    student: {
      firstName: 'Ali',
      lastName: 'Valiyev',
      fullName: 'Ali Valiyev',
      email: 'ali@example.com',
      phone: '+998 90 123 45 67',
      country: 'Uzbekistan',
    },
    university: {
      name: 'Edmission University',
      address: 'Tashkent, Uzbekistan',
      logo: '',
    },
    offer: {
      programName: 'Computer Science',
      degreeLevel: 'Bachelor',
      intake: 'Fall 2026',
      startDate: '2026-09-01',
      startDateLabel: 'September 1, 2026',
      tuitionFee: '12000',
      currency: 'USD',
      tuitionDisplay: '12,000 USD',
      conditions: 'Maintain GPA 3.0 and submit final transcript.',
    },
    scholarship: {
      amount: type === 'scholarship' ? '5000' : '',
      percent: type === 'scholarship' ? '50' : '',
      type: type === 'scholarship' ? 'Merit scholarship' : '',
      summary: type === 'scholarship' ? '5000 50% Merit scholarship' : '',
    },
    deadline: {
      acceptBy: '2026-04-15',
      acceptByLabel: 'April 15, 2026',
    },
    document: {
      id: 'preview-document',
      type,
      issuedOn: '2026-03-17',
      issuedOnLabel: 'March 17, 2026',
      message: 'We would be glad to welcome you to this intake.',
      summary: 'Issued on March 17, 2026. Program: Computer Science. Start date: September 1, 2026. Tuition fee: 12,000 USD. Accept by: April 15, 2026.',
      smallPrint: 'This summary is included to make the main terms, deadlines, fees, conditions, and scholarship details explicit.',
    },
  }
}

export function snapValue(value: number, grid = 8) {
  return Math.round(value / grid) * grid
}

export function clampElementToPage(element: DocumentSceneElement, scene: DocumentScene): DocumentSceneElement {
  const maxX = Math.max(0, scene.page.width - element.width)
  const maxY = Math.max(0, scene.page.height - element.height)
  return {
    ...element,
    x: Math.max(0, Math.min(maxX, element.x)),
    y: Math.max(0, Math.min(maxY, element.y)),
    width: Math.max(24, Math.min(scene.page.width, element.width)),
    height: Math.max(12, Math.min(scene.page.height, element.height)),
  }
}

function getPathValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function normalizeTextField(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value
  const coerced = coerceCanvasString(value)
  return coerced === '' ? undefined : coerced
}

function normalizeElement(element: Partial<DocumentSceneElement>) {
  if (!element.type || !element.id) return null
  return {
    id: element.id,
    type: element.type,
    x: typeof element.x === 'number' ? element.x : 0,
    y: typeof element.y === 'number' ? element.y : 0,
    width: typeof element.width === 'number' ? element.width : 120,
    height: typeof element.height === 'number' ? element.height : 48,
    rotation: typeof element.rotation === 'number' ? element.rotation : 0,
    locked: Boolean(element.locked),
    layer: typeof element.layer === 'number' ? element.layer : 0,
    opacity: typeof element.opacity === 'number' ? element.opacity : 1,
    content: normalizeTextField(element.content),
    src: normalizeTextField(element.src),
    fill: element.fill ?? '#0f172a',
    stroke: element.stroke ?? '#cbd5e1',
    strokeWidth: typeof element.strokeWidth === 'number' ? element.strokeWidth : 1,
    radius: typeof element.radius === 'number' ? element.radius : 0,
    points: Array.isArray(element.points) ? element.points : undefined,
    fontSize: typeof element.fontSize === 'number' ? element.fontSize : 24,
    fontFamily: element.fontFamily ?? 'Georgia',
    fontWeight: element.fontWeight ?? 'normal',
    textAlign: element.textAlign ?? 'left',
    lineHeight: typeof element.lineHeight === 'number' ? element.lineHeight : 1.2,
  } satisfies DocumentSceneElement
}
