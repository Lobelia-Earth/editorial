import {
  cloneVNode,
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  reactive,
  ref,
  Text,
  watch,
  type ComponentPublicInstance,
  type PropType,
  type VNode,
} from "vue";
import { EDITION_MODE_STORAGE_KEY } from "@isardsat/editorial-common/preview";
import { useLocalStorage } from "../composables/use-local-storage";
import styles from "./EditorialContent.module.css";
import { PencilIcon } from "./icons";
import { useEditorialVueConfig } from "./providers/EditorialVueConfigContext";

const HighlightOverlay = defineComponent({
  name: "HighlightOverlay",
  props: {
    target: {
      type: Object as PropType<HTMLElement | null>,
      default: null,
    },
    entityName: { type: String, required: true },
    instanceId: { type: String, required: true },
    propertyName: { type: String, default: undefined },
    editorialUrl: { type: String, required: true },
  },
  setup(props) {
    const rect = reactive({ top: 0, left: 0, width: 0, height: 0 });

    watch(
      () => props.target,
      (target, _, onCleanup) => {
        if (!target) {
          return;
        }

        const updateRect = () => {
          const boundingBox = target.getBoundingClientRect();
          const offsetParent = target.offsetParent as HTMLElement;

          if (offsetParent && offsetParent !== document.body) {
            const offsetParentRect = offsetParent.getBoundingClientRect();

            Object.assign(rect, {
              top: boundingBox.top - offsetParentRect.top,
              left: boundingBox.left - offsetParentRect.left,
              width: boundingBox.width,
              height: boundingBox.height,
            });
          } else {
            Object.assign(rect, {
              top: boundingBox.top + window.scrollY,
              left: boundingBox.left + window.scrollX,
              width: boundingBox.width,
              height: boundingBox.height,
            });
          }
        };

        updateRect();

        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect);

        const resizeObserver = new ResizeObserver(updateRect);
        resizeObserver.observe(target);

        onCleanup(() => {
          window.removeEventListener("resize", updateRect);
          window.removeEventListener("scroll", updateRect);
          resizeObserver.disconnect();
        });
      },
      { immediate: true },
    );

    return () => {
      const { entityName, instanceId, propertyName, editorialUrl } = props;

      return h(
        "div",
        {
          class: styles.overlay,
          style: {
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          },
        },
        [
          h(
            "a",
            {
              class: styles.label,
              href: new URL(
                `admin/dashboard/${entityName}/${instanceId}${propertyName ? `#${propertyName}` : ""}`,
                editorialUrl,
              ).href,
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
              },
            },
            [
              h("strong", entityName),
              !propertyName && `.${instanceId.substring(0, 20)}`,
              !propertyName && instanceId.length > 20 ? "…" : "",
              propertyName ? `.${propertyName}` : "",
              h(PencilIcon),
            ],
          ),
        ],
      );
    };
  },
});

const isElementVNode = (vnode: VNode) =>
  vnode.type !== Comment && vnode.type !== Text && vnode.type !== Fragment;

// Unwraps fragments (e.g. a `<slot />` passed through a wrapper) and drops comments (e.g. `v-if`).
const getChildVNodes = (vnodes: VNode[]): VNode[] =>
  vnodes.flatMap((vnode) => {
    if (vnode.type === Fragment && Array.isArray(vnode.children)) {
      return getChildVNodes(vnode.children as VNode[]);
    }
    return vnode.type === Comment ? [] : [vnode];
  });

export const EditorialContent = defineComponent({
  name: "EditorialContent",
  // Attributes (e.g. classes or scoped style ids) are passed to the child, as this component has no element of its own.
  inheritAttrs: false,
  props: {
    entityName: { type: String, required: true },
    instanceId: { type: String, required: true },
    propertyName: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const config = useEditorialVueConfig();

    const [isEditionMode] = useLocalStorage({
      key: EDITION_MODE_STORAGE_KEY,
      defaultValue: false,
    });

    const targetRef = ref<Element | ComponentPublicInstance | null>(null);

    // The child can be an element or a component, in which case its root element is used.
    const targetElement = computed(() => {
      const target = targetRef.value;
      const element = target instanceof Element ? target : target?.$el;
      return element instanceof HTMLElement ? element : null;
    });

    return () => {
      const children = slots.default?.() ?? [];
      const childVNodes = getChildVNodes(children);
      const child =
        childVNodes.length === 1 && isElementVNode(childVNodes[0])
          ? childVNodes[0]
          : null;

      if (!config.value.isPreview || !isEditionMode.value) {
        // Same structure as in edition mode, so toggling it doesn't remount the child.
        return child ? [cloneVNode(child, attrs)] : children;
      }

      if (!child) {
        console.error(
          "EditorialContent expects a single element as its child.",
        );
        return null;
      }

      // The overlay goes after the child so the child keeps its position among its siblings.
      return [
        cloneVNode(child, { ...attrs, ref: targetRef }, true),
        h(HighlightOverlay, {
          target: targetElement.value,
          entityName: props.entityName,
          instanceId: props.instanceId,
          propertyName: props.propertyName,
          editorialUrl: config.value.editorialUrl,
        }),
      ];
    };
  },
});
