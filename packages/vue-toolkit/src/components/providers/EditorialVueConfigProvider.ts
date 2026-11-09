import { defineComponent, toRef, type PropType } from "vue";
import {
  provideEditorialVueConfig,
  type EditorialConfig,
} from "./EditorialVueConfigContext";

export const EditorialVueConfigProvider = defineComponent({
  name: "EditorialVueConfigProvider",
  props: {
    config: {
      type: Object as PropType<EditorialConfig>,
      required: true,
    },
  },
  setup(props, { slots }) {
    provideEditorialVueConfig(toRef(props, "config"));

    return () => slots.default?.();
  },
});
