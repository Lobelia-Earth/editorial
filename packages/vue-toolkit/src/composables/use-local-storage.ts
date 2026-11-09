import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import { LOCAL_STORAGE_EVENT } from "@isardsat/editorial-common/preview";

type Options<T> = {
  key: string;
  defaultValue: T;
};

type StorageEventDetail<T> = {
  key: string;
  value: T;
};

function deserialize<T>(value: string | null, defaultValue: T): T {
  if (value === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value as T;
  }
}

/**
 * Reactive `localStorage` value, compatible with the React toolkit's
 * `useLocalStorage`: values are stored as JSON and changes are synced across
 * components (and frameworks) in the same tab and across tabs.
 */
export function useLocalStorage<T>({
  key,
  defaultValue,
}: Options<T>): [Ref<T>, (value: T) => void] {
  const value = ref(defaultValue) as Ref<T>;

  const setValue = (newValue: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      console.warn(
        "use-local-storage: Failed to set value to storage, localStorage is blocked",
      );
    }
    window.dispatchEvent(
      new CustomEvent<StorageEventDetail<T>>(LOCAL_STORAGE_EVENT, {
        detail: { key, value: newValue },
      }),
    );
    value.value = newValue;
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea === window.localStorage && event.key === key) {
      value.value = deserialize(event.newValue, defaultValue);
    }
  };

  const handleLocalStorage = (event: Event) => {
    const { detail } = event as CustomEvent<StorageEventDetail<T>>;
    if (detail?.key === key) {
      value.value = detail.value;
    }
  };

  // Read on mount so the server and the first client render match.
  onMounted(() => {
    try {
      value.value = deserialize(window.localStorage.getItem(key), defaultValue);
    } catch {
      console.warn(
        "use-local-storage: Failed to get value from storage, localStorage is blocked",
      );
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener(LOCAL_STORAGE_EVENT, handleLocalStorage);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCAL_STORAGE_EVENT, handleLocalStorage);
  });

  return [value, setValue];
}
