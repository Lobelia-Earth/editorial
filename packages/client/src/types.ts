import type {
  EditorialConfig,
  EditorialData,
  EditorialDataItem,
  EditorialDataType,
  EditorialSchema,
} from "@isardsat/editorial-common";

export interface ClientOptions {
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  defaultLocale?: string;
  timeout?: number;
}

export interface GetContentOptions {
  /** Filter content by locale/language code */
  locale?: string;
  /** Include preview/draft content in the response */
  preview?: boolean;
}

export interface EditorialClientInterface {
  getSchema(): Promise<EditorialSchema>;
  getConfig(): Promise<EditorialConfig>;
  getContent<T = EditorialData>(options?: GetContentOptions): Promise<T>;
  getContentByType<T = EditorialDataType>(
    type: string,
    options?: GetContentOptions
  ): Promise<T[]>;
  getContentIds(type: string, options?: GetContentOptions): Promise<string[]>;
  getContentById<T = EditorialDataItem>(
    type: string,
    id: string,
    options?: GetContentOptions
  ): Promise<T>;
  createContent<T = EditorialDataItem>(
    type: string,
    id: string,
    data: T
  ): Promise<T>;
  updateContent<T = EditorialDataItem>(
    type: string,
    id: string,
    data: Partial<T>
  ): Promise<T>;
  deleteContent(type: string, id: string): Promise<boolean>;
}

export {
  EditorialConfig,
  EditorialData,
  EditorialDataItem,
  EditorialDataType,
  EditorialSchema,
};
