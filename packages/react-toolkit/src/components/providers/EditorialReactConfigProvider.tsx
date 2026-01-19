import { type ReactNode } from "react";
import {
  EditorialConfigContext,
  type EditorialConfig,
} from "./EditorialReactConfigContext";

interface EditorialReactConfigProviderProps {
  children: ReactNode;
  config: EditorialConfig;
}

export function EditorialReactConfigProvider({
  children,
  config,
}: EditorialReactConfigProviderProps) {
  return (
    <EditorialConfigContext.Provider value={config}>
      {children}
    </EditorialConfigContext.Provider>
  );
}
