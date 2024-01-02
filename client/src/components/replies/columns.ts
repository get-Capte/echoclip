import type { ColumnDef } from '@tanstack/vue-table'

export interface Shortcut {
  name: string
  created_at: string
  htmlText: string
}

export const columns: ColumnDef<Shortcut>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'created_at',
    header: 'Created At'
  },
  {
    accessorKey: 'htmlText',
    header: 'Content'
  }
]
