import type {
  EditorialConfig,
  EditorialData,
  EditorialDataItem,
  EditorialDataType,
  EditorialSchema,
} from "@isardsat/editorial-common";
import {
  EditorialError,
  EditorialNetworkError,
  EditorialNotFoundError,
  EditorialValidationError,
} from "./errors.js";
import type {
  ClientOptions,
  EditorialClientInterface,
  GetContentOptions,
} from "./types.js";

export function createEditorialClient(
  baseURL: string,
  options: ClientOptions = {}
): EditorialClientInterface {
  const apiBaseURL = new URL("/api/v1/", baseURL);
  const defaultLocale = options.defaultLocale || "en";
  const fetchFn = options.fetch || globalThis.fetch;
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const timeout = options.timeout || 30000;

  async function request<T>(
    endpoint: string,
    requestOptions: RequestInit = {}
  ): Promise<T> {
    const url = new URL(endpoint, apiBaseURL);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchFn(url.toString(), {
        ...requestOptions,
        headers: {
          ...defaultHeaders,
          ...requestOptions.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMessage = await response
          .text()
          .catch(() => response.statusText);

        if (response.status === 404) {
          throw new EditorialNotFoundError(errorMessage);
        }

        if (response.status === 400) {
          throw new EditorialValidationError(errorMessage);
        }

        throw new EditorialError(
          errorMessage || `HTTP ${response.status} ${response.statusText}`,
          response.status,
          response.statusText
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof EditorialError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new EditorialNetworkError("Request timeout");
      }

      throw new EditorialNetworkError(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  function buildQueryParams(options: GetContentOptions = {}): URLSearchParams {
    const params = new URLSearchParams();

    if (options.locale && options.locale !== defaultLocale) {
      params.append("lang", options.locale);
    }

    if (options.preview) {
      params.append("preview", "true");
    }

    return params;
  }

  return {
    async getSchema(): Promise<EditorialSchema> {
      return request<EditorialSchema>("schema");
    },

    async getConfig(): Promise<EditorialConfig> {
      return request<EditorialConfig>("config");
    },

    async getContent<T = EditorialData>(
      options: GetContentOptions = {}
    ): Promise<T> {
      const params = buildQueryParams(options);
      const endpoint = params.toString() ? `data?${params}` : "data";

      return request<T>(endpoint);
    },

    async getContentByType<T = EditorialDataType>(
      type: string,
      options: GetContentOptions = {}
    ): Promise<T[]> {
      const params = buildQueryParams(options);
      const endpoint = params.toString()
        ? `data/${encodeURIComponent(type)}?${params}`
        : `data/${encodeURIComponent(type)}`;

      const result = await request<Record<string, T>>(endpoint);
      return Object.values(result) as T[];
    },

    async getContentIds(
      type: string,
      options: GetContentOptions = {}
    ): Promise<string[]> {
      const params = new URLSearchParams();
      if (options.preview) {
        params.append("preview", "true");
      }

      const endpoint = params.toString()
        ? `data/${encodeURIComponent(type)}/ids?${params}`
        : `data/${encodeURIComponent(type)}/ids`;

      return request<string[]>(endpoint);
    },

    async getContentById<T = EditorialDataItem>(
      type: string,
      id: string,
      options: GetContentOptions = {}
    ): Promise<T> {
      const params = buildQueryParams(options);
      const endpoint = params.toString()
        ? `data/${encodeURIComponent(type)}/${encodeURIComponent(id)}?${params}`
        : `data/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;

      return request<T>(endpoint);
    },

    async createContent<T = EditorialDataItem>(
      type: string,
      id: string,
      data: T
    ): Promise<T> {
      return request<T>(
        `data/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
    },

    async updateContent<T = EditorialDataItem>(
      type: string,
      id: string,
      data: Partial<T>
    ): Promise<T> {
      return request<T>(
        `data/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );
    },

    async deleteContent(type: string, id: string): Promise<boolean> {
      return request<boolean>(
        `data/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
    },
  };
}
