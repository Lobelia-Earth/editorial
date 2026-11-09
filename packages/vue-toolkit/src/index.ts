import { EditorialContent } from "./components/EditorialContent";
import { PreviewMenu, type PreviewMenuProps } from "./components/PreviewMenu";
import {
  provideEditorialVueConfig,
  useEditorialVueConfig,
  type EditorialConfig,
} from "./components/providers/EditorialVueConfigContext";
import { EditorialVueConfigProvider } from "./components/providers/EditorialVueConfigProvider";

export {
  EditorialContent,
  EditorialVueConfigProvider,
  PreviewMenu,
  provideEditorialVueConfig,
  useEditorialVueConfig,
};
export type { EditorialConfig, PreviewMenuProps };
