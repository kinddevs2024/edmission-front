import { create } from 'zustand'
import type { DocumentPageFormat, DocumentScene, DocumentSceneElement, DocumentTemplate, EditableSceneDocument, EditorDocumentType } from '@/types/documentModule'
import { clampElementToPage, createBlankScene, parseScene, stringifyScene } from '@/utils/documentScene'

type HistorySnapshot = string

type TemplateMeta = {
  id?: string
  name: string
  type: EditorDocumentType
  status: 'draft' | 'active' | 'archived'
  pageFormat: DocumentTemplate['pageFormat']
  width?: number
  height?: number
  editorVersion: string
  previewImageUrl?: string
  isDefault?: boolean
  assets: NonNullable<DocumentTemplate['assets']>
}

interface DocumentEditorState {
  scene: DocumentScene
  selectedElementId: string | null
  stageZoom: number
  stagePosition: { x: number; y: number }
  previewData: Record<string, unknown>
  metadata: TemplateMeta
  history: HistorySnapshot[]
  future: HistorySnapshot[]
  loadTemplate: (template: DocumentTemplate, previewData?: Record<string, unknown>) => void
  loadSceneDocument: (document: EditableSceneDocument, previewData?: Record<string, unknown>) => void
  reset: (options?: { type?: EditorDocumentType; pageFormat?: DocumentPageFormat; width?: number; height?: number }) => void
  selectElement: (id: string | null) => void
  setPreviewData: (data: Record<string, unknown>) => void
  setMetadata: (patch: Partial<TemplateMeta>) => void
  setStageZoom: (zoom: number) => void
  setStagePosition: (position: { x: number; y: number }) => void
  addElement: (element: DocumentSceneElement) => void
  updateElement: (id: string, patch: Partial<DocumentSceneElement>, commit?: boolean) => void
  removeElement: (id: string) => void
  duplicateElement: (id: string) => void
  moveLayer: (id: string, direction: 'up' | 'down') => void
  toggleLock: (id: string) => void
  alignElement: (id: string, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  undo: () => void
  redo: () => void
  commitHistory: () => void
}

const defaultScene = createBlankScene('A4_PORTRAIT')

function createDefaultMeta(type: EditorDocumentType = 'offer'): TemplateMeta {
  return {
    name: '',
    type,
    status: 'draft',
    pageFormat: 'A4_PORTRAIT',
    editorVersion: '1.0.0',
    assets: [],
  }
}

export const useDocumentEditorStore = create<DocumentEditorState>((set, get) => ({
  scene: defaultScene,
  selectedElementId: null,
  stageZoom: 0.72,
  stagePosition: { x: 0, y: 0 },
  previewData: {},
  metadata: createDefaultMeta(),
  history: [stringifyScene(defaultScene)],
  future: [],
  loadTemplate: (template, previewData = {}) =>
    get().loadSceneDocument(template, previewData),
  loadSceneDocument: (document, previewData = {}) =>
    set(() => ({
      scene: parseScene(document.canvasJson, document.pageFormat ?? 'A4_PORTRAIT', document.width, document.height),
      selectedElementId: null,
      stageZoom: 0.72,
      stagePosition: { x: 0, y: 0 },
      previewData,
      metadata: {
        id: document.id,
        name: document.name,
        type: document.type,
        status: document.status ?? 'draft',
        pageFormat: document.pageFormat,
        width: document.width,
        height: document.height,
        editorVersion: document.editorVersion,
        previewImageUrl: document.previewImageUrl,
        isDefault: false,
        assets: document.assets ?? [],
      },
      history: [document.canvasJson],
      future: [],
    })),
  reset: (options = {}) => {
    const type = options.type ?? 'offer'
    const scene = createBlankScene(options.pageFormat ?? 'A4_PORTRAIT', options.width, options.height)
    return set(() => ({
      scene,
      selectedElementId: null,
      stageZoom: 0.72,
      stagePosition: { x: 0, y: 0 },
      previewData: {},
      metadata: {
        ...createDefaultMeta(type),
        pageFormat: options.pageFormat ?? 'A4_PORTRAIT',
        width: scene.page.width,
        height: scene.page.height,
      },
      history: [stringifyScene(scene)],
      future: [],
    }))
  },
  selectElement: (id) => set(() => ({ selectedElementId: id })),
  setPreviewData: (data) => set(() => ({ previewData: data })),
  setMetadata: (patch) => set((state) => ({ metadata: { ...state.metadata, ...patch } })),
  setStageZoom: (zoom) => set(() => ({ stageZoom: Math.max(0.3, Math.min(2, zoom)) })),
  setStagePosition: (position) => set(() => ({ stagePosition: position })),
  addElement: (element) =>
    set((state) => {
      const scene = {
        ...state.scene,
        elements: [...state.scene.elements, clampElementToPage(element, state.scene)],
      }
      return {
        scene,
        selectedElementId: element.id,
        history: [...state.history, stringifyScene(scene)],
        future: [],
      }
    }),
  updateElement: (id, patch, commit = true) =>
    set((state) => {
      const scene = {
        ...state.scene,
        elements: state.scene.elements.map((element) =>
          element.id === id ? clampElementToPage({ ...element, ...patch }, state.scene) : element
        ),
      }
      return {
        scene,
        history: commit ? [...state.history, stringifyScene(scene)] : state.history,
        future: commit ? [] : state.future,
      }
    }),
  removeElement: (id) =>
    set((state) => {
      const scene = {
        ...state.scene,
        elements: state.scene.elements.filter((element) => element.id !== id),
      }
      return {
        scene,
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        history: [...state.history, stringifyScene(scene)],
        future: [],
      }
    }),
  duplicateElement: (id) =>
    set((state) => {
      const source = state.scene.elements.find((element) => element.id === id)
      if (!source) return state
      const copy = clampElementToPage({
        ...source,
        id: `${source.id}-copy-${Date.now()}`,
        x: source.x + 24,
        y: source.y + 24,
      }, state.scene)
      const scene = { ...state.scene, elements: [...state.scene.elements, copy] }
      return {
        scene,
        selectedElementId: copy.id,
        history: [...state.history, stringifyScene(scene)],
        future: [],
      }
    }),
  moveLayer: (id, direction) =>
    set((state) => {
      const index = state.scene.elements.findIndex((element) => element.id === id)
      if (index < 0) return state
      const swapIndex = direction === 'up' ? index + 1 : index - 1
      if (swapIndex < 0 || swapIndex >= state.scene.elements.length) return state
      const elements = [...state.scene.elements]
      const current = elements[index]
      elements[index] = elements[swapIndex]
      elements[swapIndex] = current
      const scene = { ...state.scene, elements }
      return {
        scene,
        history: [...state.history, stringifyScene(scene)],
        future: [],
      }
    }),
  toggleLock: (id) =>
    set((state) => {
      const scene = {
        ...state.scene,
        elements: state.scene.elements.map((element) =>
          element.id === id ? { ...element, locked: !element.locked } : element
        ),
      }
      return {
        scene,
        history: [...state.history, stringifyScene(scene)],
        future: [],
      }
    }),
  alignElement: (id, alignment) =>
    set((state) => {
      const scene = {
        ...state.scene,
        elements: state.scene.elements.map((element) => {
          if (element.id !== id) return element
          switch (alignment) {
            case 'left':
              return { ...element, x: 24 }
            case 'center':
              return { ...element, x: (state.scene.page.width - element.width) / 2 }
            case 'right':
              return { ...element, x: state.scene.page.width - element.width - 24 }
            case 'top':
              return { ...element, y: 24 }
            case 'middle':
              return { ...element, y: (state.scene.page.height - element.height) / 2 }
            case 'bottom':
              return { ...element, y: state.scene.page.height - element.height - 24 }
            default:
              return element
          }
        }),
      }
      return {
        scene,
        history: [...state.history, stringifyScene(scene)],
        future: [],
      }
    }),
  undo: () =>
    set((state) => {
      if (state.history.length <= 1) return state
      const nextFuture = [state.history[state.history.length - 1], ...state.future]
      const nextHistory = state.history.slice(0, -1)
      return {
        ...state,
        scene: parseScene(
          nextHistory[nextHistory.length - 1],
          state.metadata.pageFormat,
          state.metadata.width,
          state.metadata.height
        ),
        history: nextHistory,
        future: nextFuture,
      }
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        ...state,
        scene: parseScene(next, state.metadata.pageFormat, state.metadata.width, state.metadata.height),
        history: [...state.history, next],
        future: state.future.slice(1),
      }
    }),
  commitHistory: () => {
    const state = get()
    set(() => ({
      history: [...state.history, stringifyScene(state.scene)],
      future: [],
    }))
  },
}))
