import { inject, provide, type InjectionKey, type Ref } from "vue";

export interface EditorialConfig {
  isPreview: boolean;
  editorialUrl: string;
}

export const EditorialConfigKey: InjectionKey<Readonly<Ref<EditorialConfig>>> =
  Symbol("EditorialConfig");

/** Provides the Editorial config to the descendants of the current component. */
export function provideEditorialVueConfig(
  config: Readonly<Ref<EditorialConfig>>,
) {
  provide(EditorialConfigKey, config);
}

export function useEditorialVueConfig() {
  const config = inject(EditorialConfigKey, undefined);
  if (!config) {
    throw new Error(
      "useEditorialVueConfig must be used within EditorialVueConfigProvider",
    );
  }
  return config;
}
