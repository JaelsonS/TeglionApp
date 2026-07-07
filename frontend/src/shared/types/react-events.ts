import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
export type FormChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>

export type FormSubmitEvent = FormEvent<HTMLFormElement>

export type ButtonClickEvent = MouseEvent<HTMLButtonElement>
