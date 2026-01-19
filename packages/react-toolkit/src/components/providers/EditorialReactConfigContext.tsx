import { createContext, useContext } from "react";

export interface EditorialConfig {
  isPreview: boolean;
  editorialUrl: string;
}

export const EditorialConfigContext = createContext<
  EditorialConfig | undefined
>(undefined);

export function useEditorialReactConfig() {
  const context = useContext(EditorialConfigContext);
  if (!context) {
    throw new Error(
      "useEditorialReactConfig must be used within EditorialReactConfigProvider",
    );
  }
  return context;
}
