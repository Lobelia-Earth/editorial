import { createStore } from "@/lib/store/createStore";
import { editorialApi } from "@/lib/store/slices/editorialApi";
import type { AppStore } from "@/lib/store/types";
import { useRef } from "react";
import { Provider } from "react-redux";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useRef<AppStore>(null);

  if (!store.current) {
    store.current = createStore();

    // Pre-load basic config
    store.current.dispatch(editorialApi.endpoints.getConfig.initiate());
  }

  return <Provider store={store.current}>{children}</Provider>;
}
