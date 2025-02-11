import type {
  EditorialData,
  EditorialDataObject,
  EditorialFiles,
  EditorialSchema,
  EditorialSchemaItem,
} from '@isardsat/editorial-common';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clientEnv } from '../env';

const baseQuery = fetchBaseQuery({
  baseUrl: new URL('/api/v1', clientEnv.NEXT_PUBLIC_EDITORIAL_API_URL).href,
});

export const editorialApi = createApi({
  reducerPath: 'editorialApi',
  baseQuery,
  tagTypes: ['schema', 'data', 'files'],
  endpoints: (builder) => ({
    getSchema: builder.query<EditorialSchema, void>({
      query: () => '/schema',
      providesTags: [{ type: 'schema' }],
    }),
    getSchemaType: builder.query<EditorialSchemaItem | null, string>({
      query: () => '/schema',
      transformResponse: (response: EditorialSchema, _, itemType) => {
        return response[itemType] || null;
      },
      providesTags: [{ type: 'schema' }],
    }),
    getData: builder.query<EditorialData, void>({
      query: () => '/data',
      providesTags: () => [{ type: 'data' }],
    }),
    getDataObject: builder.query<
      EditorialDataObject,
      { itemType: string; id: string }
    >({
      query: () => '/data',
      transformResponse: (response: EditorialData, _, { itemType, id }) => {
        return response[itemType][id] || null;
      },
      providesTags: () => [{ type: 'data' }],
    }),
    getFiles: builder.query<EditorialFiles, void>({
      query: () => '/files',
      providesTags: () => [{ type: 'files' }],
    }),
    deleteFile: builder.mutation<boolean, string>({
      query: (path) => ({
        url: `/files`,
        method: 'DELETE',
        body: { path },
      }),
      invalidatesTags: () => [{ type: 'files' }],
    }),
    updateObject: builder.mutation<
      EditorialDataObject,
      Partial<EditorialDataObject>
    >({
      query: ({ id, type, ...patch }) => ({
        url: `/data/${type}/${id}`,
        method: 'PATCH',
        body: { id, type, ...patch },
      }),
      invalidatesTags: () => [{ type: 'data' }],
    }),
    createObject: builder.mutation<EditorialDataObject, EditorialDataObject>({
      query: ({ id, type, ...put }) => ({
        url: `/data/${type}/${id}`,
        method: 'PUT',
        body: { id, type, ...put },
      }),
      invalidatesTags: () => [{ type: 'data' }],
    }),
    deleteObject: builder.mutation<
      void,
      Pick<EditorialDataObject, 'id' | 'type'>
    >({
      query: ({ id, type }) => ({
        url: `/data/${type}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => [{ type: 'data' }],
    }),
  }),
});

export const {
  useGetSchemaQuery,
  useGetSchemaTypeQuery,
  useGetDataQuery,
  useGetDataObjectQuery,
  useGetFilesQuery,
  useDeleteFileMutation,
  useDeleteObjectMutation,
  useUpdateObjectMutation,
} = editorialApi;
