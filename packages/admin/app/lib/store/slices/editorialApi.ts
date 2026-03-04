import { getFirebaseInstance } from "@/lib/auth";
import type {
  EditorialConfig,
  EditorialData,
  EditorialDataItem,
  EditorialDiffResponse,
  EditorialFile,
  EditorialFiles,
  EditorialFilesResponse,
  EditorialSchema,
  EditorialSchemaItem,
} from "@isardsat/editorial-common";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.PROD
  ? "/api/v1"
  : import.meta.env.VITE_EDITORIAL_BASE_URL;

// Gets the current user's token
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { auth } = getFirebaseInstance();

    const user = auth.currentUser;

    if (user) {
      return await user.getIdToken();
    }
  } catch (error) {
    process.env.NODE_ENV === "development" &&
      console.debug("Auth not available:", error);
  }

  return null;
}

// Base query with automatic token injection
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: async (headers) => {
    const token = await getAuthToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Handle SSR
  if (typeof window === "undefined") {
    return { data: {} };
  }

  return rawBaseQuery(args, api, extraOptions);
};

export const editorialApi = createApi({
  reducerPath: "editorialApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["schema", "data", "files", "config", "dataDiff"],
  endpoints: (builder) => ({
    getConfig: builder.query<EditorialConfig, void>({
      query: () => "/config",
      providesTags: [{ type: "config" }],
    }),
    pull: builder.mutation<boolean, void>({
      query: () => ({ url: "/pull", method: "POST" }),
    }),
    push: builder.mutation<boolean, { author: string }>({
      query: ({ author }) => ({
        url: "/push",
        method: "POST",
        body: { author },
      }),
    }),
    publish: builder.mutation<boolean, { author: string }>({
      query: ({ author }) => ({
        url: "/publish",
        method: "POST",
        body: { author },
      }),
      invalidatesTags: () => [{ type: "dataDiff" }],
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
      query: () => "/data?preview=true",
      providesTags: () => [{ type: "data" }],
    }),
    getDataDiff: builder.query<EditorialDiffResponse, void>({
      query: () => "/environments/diff",
      providesTags: () => [{ type: "dataDiff" }],
    }),
    getDataCount: builder.query<number, void>({
      query: () => "/data?preview=true",
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
      query: () => "/data?preview=true",
      transformResponse: (response: EditorialData, _, { itemType, id }) => {
        return response[itemType]?.[id] || null;
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
              0,
            );
          }

          return count;
        }

        function countFilesInArray(items: EditorialFiles): number {
          return items.reduce((acc, item) => acc + countFiles(item), 0);
        }

        return countFilesInArray(response.files);
      },
      providesTags: () => [{ type: "files" }],
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
    uploadFiles: builder.mutation<string[], { files: FileList; path?: string }>(
      {
        query: ({ files, path }) => {
          const formData = new FormData();
          Array.from(files).forEach((file) => {
            formData.append("files", file);
          });
          if (path) {
            formData.append("path", path);
          }
          return {
            url: `/files`,
            method: "PUT",
            body: formData,
          };
        },
        invalidatesTags: () => [{ type: "files" }],
      },
    ),
    createDirectory: builder.mutation<boolean, { name: string; path?: string }>(
      {
        query: ({ name, path }) => ({
          url: `/files/directory`,
          method: "POST",
          body: { name, path },
        }),
        invalidatesTags: () => [{ type: "files" }],
      },
    ),
    updateObject: builder.mutation<
      EditorialDataItem,
      Partial<EditorialDataItem>
    >({
      query: ({ id, type, ...patch }) => ({
        url: `/data/${type}/${id}`,
        method: "PATCH",
        body: { id, type, ...patch },
      }),
      invalidatesTags: () => [{ type: "data" }, { type: "dataDiff" }],
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
      invalidatesTags: () => [{ type: "data" }, { type: "dataDiff" }],
    }),
    deleteObject: builder.mutation<
      void,
      Pick<EditorialDataItem, "id" | "type">
    >({
      query: ({ id, type }) => ({
        url: `/data/${type}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: () => [{ type: "data" }, { type: "dataDiff" }],
    }),
  }),
});

export const {
  useCreateDirectoryMutation,
  useCreateObjectMutation,
  useDeleteFileMutation,
  useDeleteObjectMutation,
  useGetConfigQuery,
  useGetDataCountQuery,
  useGetDataObjectQuery,
  useGetDataQuery,
  useGetDataDiffQuery,
  useGetFileCountQuery,
  useGetFilesQuery,
  useGetFilesTotalSizeQuery,
  useGetSchemaQuery,
  useGetSchemaTypeQuery,
  usePublishMutation,
  usePullMutation,
  usePushMutation,
  useUpdateObjectMutation,
  useUploadFilesMutation,
} = editorialApi;
