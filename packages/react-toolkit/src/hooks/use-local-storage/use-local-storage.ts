import {
  createStorage,
  readValue,
  type UseStorageOptions,
} from "./create-storage";

export function useLocalStorage<T = string>(props: UseStorageOptions<T>) {
  return createStorage<T>("localStorage", "use-local-storage")(props);
}

export const readLocalStorageValue = readValue("localStorage");
