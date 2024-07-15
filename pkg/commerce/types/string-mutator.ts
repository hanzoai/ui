interface StringMutator {
  get(): string | null
  set(v: string | null): void
}

interface StringArrayMutator {
  get(): string[] | null
  set(v: string[] | null): void
}

export type {
  StringMutator, 
  StringArrayMutator
}