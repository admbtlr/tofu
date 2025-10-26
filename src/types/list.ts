export type ListId = string;

export interface List {
  id: ListId;
  name: string;
  isDefault: boolean;
  createdAt: string; // ISO string
}

export const EVERYTHING_LIST_ID = '__everything__';
