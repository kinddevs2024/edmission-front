/**
 * Random placeholder phrases for the AI chat input.
 * Picked randomly each time to keep the UI engaging.
 */

export const AI_PLACEHOLDERS = [
  'Что вы хотите сегодня?',
  'Какие фантазии у вас сегодня?',
  'О чём мечтаете?',
  'Чем могу помочь?',
  'Какой у вас вопрос?',
  'Что вас интересует?',
  'Напишите свой вопрос…',
  'С чего начнём?',
  'Чем займёмся сегодня?',
  'Что бы вы хотели обсудить?',
]

export function getRandomPlaceholder(): string {
  return AI_PLACEHOLDERS[Math.floor(Math.random() * AI_PLACEHOLDERS.length)]
}
