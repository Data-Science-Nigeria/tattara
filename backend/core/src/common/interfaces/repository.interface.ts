import { FindOptionsWhere } from 'typeorm';

export type SimpleCriteria =
  | string
  | string[]
  | number
  | number[]
  | Date
  | Date[];

export type AnyCriteria<T> = SimpleCriteria | FindOptionsWhere<T>;

export interface ScopingContext {
  userId?: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export interface CreatorFieldConfig {
  propertyName: string;
  columnName: string;
  exists: boolean;
}
