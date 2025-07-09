import { clientEnv } from "@/lib/env";
import type {
  EditorialConfig,
  EditorialData,
  EditorialDataItem,
  EditorialFile,
  EditorialFiles,
  EditorialFilesResponse,
  EditorialSchema,
  EditorialSchemaItem,
} from "@isardsat/editorial-common";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: new URL("/api/v1", clientEnv.EDITORIAL_API_URL).href,
});

export const editorialApi = createApi({
  reducerPath: "editorialApi",
  baseQuery,
  tagTypes: ["schema", "data", "files", "config"],
  endpoints: (builder) => ({
    getConfig: builder.query<EditorialConfig, void>({
      query: () => "/config",
      providesTags: [{ type: "config" }],
    }),
    pull: builder.mutation<boolean, void>({
      query: () => ({ url: "/pull", method: "POST" }),
    }),
    push: builder.mutation<boolean, void>({
      query: () => ({ url: "/push", method: "POST" }),
    }),
    publish: builder.mutation<boolean, void>({
      query: () => ({ url: "/publish", method: "POST" }),
    }),
    getSchema: builder.query<EditorialSchema, void>({
      query: () => "/schema",
      providesTags: [{ type: "schema" }],
    }),
    getSchemaType: builder.query<EditorialSchemaItem | null, string>({
      query: () => "/schema",
      transformResponse: (response: EditorialSchema, _, itemType) => {
        return response[itemType] || null;
      },
      providesTags: (_result, _error, itemType) => [
        { type: "schema", id: itemType },
      ],
    }),
    getData: builder.query<EditorialData, void>({
      query: () => "/data",
      providesTags: () => [{ type: "data" }],
    }),
    getDataCount: builder.query<number, void>({
      query: () => "/data",
      transformResponse(response: EditorialData) {
        const items = Object.values(response).reduce((acc, item) => {
          return acc + Object.keys(item).length;
        }, 0);

        return items;
      },
    }),
    getDataObject: builder.query<
      EditorialDataItem,
      { itemType: string; id: string }
    >({
      query: () => "/data",
      transformResponse: (response: EditorialData, _, { itemType, id }) => {
        return response[itemType][id] || null;
      },
      providesTags: (_result, _error, { itemType, id }) => [
        { type: "data", id: `${itemType}-${id}` },
      ],
    }),
    getFiles: builder.query<EditorialFiles, void>({
      query: () => "/files",
      transformResponse: (response: EditorialFilesResponse) => response.files,
      providesTags: () => [{ type: "files" }],
    }),
    getFileCount: builder.query<number, void>({
      query: () => "/files",
      transformResponse: (response: EditorialFilesResponse) => {
        function countFiles(item: EditorialFile): number {
          let count = item.type === "file" ? 1 : 0;

          if (item.children && item.children.length > 0) {
            count += item.children.reduce(
              (acc, child) => acc + countFiles(child),
              0
            );
          }

          return count;
        }

        // Function to count files in an array of editorial files
        function countFilesInArray(items: EditorialFiles): number {
          return items.reduce((acc, item) => acc + countFiles(item), 0);
        }

        return countFilesInArray(response.files);
      },
    }),
    getFilesTotalSize: builder.query<number, void>({
      query: () => "/files",
      transformResponse: (response: EditorialFilesResponse) =>
        response.totalSize,
      providesTags: () => [{ type: "files" }],
    }),
    deleteFile: builder.mutation<boolean, string>({
      query: (path) => ({
        url: `/files`,
        method: "DELETE",
        body: { path },
      }),
      invalidatesTags: () => [{ type: "files" }],
    }),
    updateObject: builder.mutation<
      EditorialDataItem,
      Partial<EditorialDataItem>
    >({
      query: ({ id, type, ...patch }) => ({
        url: `/data/${type}/${id}`,
        method: "PATCH",
        body: { id, type, ...patch },
      }),
      invalidatesTags: () => [{ type: "data" }],
    }),
    createObject: builder.mutation<
      EditorialDataItem,
      Omit<EditorialDataItem, "createdAt" | "updatedAt">
    >({
      query: ({ id, type, ...put }) => ({
        url: `/data/${type}/${id}`,
        method: "PUT",
        body: { id, type, ...put },
      }),
      invalidatesTags: () => [{ type: "data" }],
    }),
    deleteObject: builder.mutation<
      void,
      Pick<EditorialDataItem, "id" | "type">
    >({
      query: ({ id, type }) => ({
        url: `/data/${type}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: () => [{ type: "data" }],
    }),
  }),
});

export const {
  useCreateObjectMutation,
  useDeleteFileMutation,
  useDeleteObjectMutation,
  useGetConfigQuery,
  useGetDataCountQuery,
  useGetDataObjectQuery,
  useGetDataQuery,
  useGetFileCountQuery,
  useGetFilesQuery,
  useGetFilesTotalSizeQuery,
  useGetSchemaQuery,
  useGetSchemaTypeQuery,
  usePublishMutation,
  usePullMutation,
  usePushMutation,
  useUpdateObjectMutation,
} = editorialApi;
