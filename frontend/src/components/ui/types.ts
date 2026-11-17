export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'teal';

export interface SelectOption<T extends string = string> { value: T; label: string; shortLabel?: string; detail?: string; disabled?: boolean }

export interface Column { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string; nowrap?: boolean }
