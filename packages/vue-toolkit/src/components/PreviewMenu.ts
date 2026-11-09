import {
  defineComponent,
  h,
  ref,
  watch,
  type FunctionalComponent,
  type PropType,
} from "vue";
import {
  ALWAYS_SHOW_PREVIEW_INDICATOR_STORAGE_KEY,
  EDITION_MODE_STORAGE_KEY,
} from "@isardsat/editorial-common/preview";
import { useLocalStorage } from "../composables/use-local-storage";
import { CheckIcon, DotsIcon } from "./icons";
import styles from "./PreviewMenu.module.css";
import { useEditorialVueConfig } from "./providers/EditorialVueConfigContext";

type Position = {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
};

export type PreviewMenuProps = {
  /** Builds the URL that enables preview mode, given the current path. */
  enablePreviewUrl?: (redirectPath: string) => string;
  /** Builds the URL that disables preview mode, given the current path. */
  disablePreviewUrl?: (redirectPath: string) => string;
  /** Fixed position of the indicator on the screen. */
  position?: Position;
  /** Shows the toggle for the `EditorialContent` shortcuts. */
  showEditionToggle?: boolean;
};

const defaultEnablePreviewUrl = (redirectPath: string) =>
  `/api/preview?redirectTo=${encodeURIComponent(redirectPath)}`;

const defaultDisablePreviewUrl = (redirectPath: string) =>
  `/api/previewEnd?redirectTo=${encodeURIComponent(redirectPath)}`;

// Numbers are treated as pixels, like React does with inline styles.
const toPositionStyle = (position: Position) =>
  Object.fromEntries(
    Object.entries(position).map(([side, value]) => [
      side,
      typeof value === "number" ? `${value}px` : value,
    ]),
  );

const MenuItem: FunctionalComponent<{
  checked: boolean;
  onClick: () => void;
}> = ({ checked, onClick }, { slots }) =>
  h(
    "button",
    {
      type: "button",
      role: "menuitemcheckbox",
      "aria-checked": checked,
      class: styles.item,
      onClick,
    },
    [
      h("span", { class: styles.itemIcon }, checked ? [h(CheckIcon)] : []),
      slots.default?.(),
    ],
  );

export const PreviewMenu = defineComponent({
  name: "PreviewMenu",
  props: {
    enablePreviewUrl: {
      type: Function as PropType<(redirectPath: string) => string>,
      default: defaultEnablePreviewUrl,
    },
    disablePreviewUrl: {
      type: Function as PropType<(redirectPath: string) => string>,
      default: defaultDisablePreviewUrl,
    },
    position: {
      type: Object as PropType<Position>,
      default: () => ({ bottom: 10, left: 10 }),
    },
    showEditionToggle: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const config = useEditorialVueConfig();
    const isMenuOpen = ref(false);
    const menuRef = ref<HTMLDivElement | null>(null);

    const [isEditionMode, setIsEditionMode] = useLocalStorage({
      key: EDITION_MODE_STORAGE_KEY,
      defaultValue: false,
    });

    const [alwaysShowPreviewIndicator, setAlwaysShowPreviewIndicator] =
      useLocalStorage({
        key: ALWAYS_SHOW_PREVIEW_INDICATOR_STORAGE_KEY,
        defaultValue: false,
      });

    watch(isMenuOpen, (open, _, onCleanup) => {
      if (!open) {
        return;
      }

      const handlePointerDown = (event: PointerEvent) => {
        if (!menuRef.value?.contains(event.target as Node)) {
          isMenuOpen.value = false;
        }
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          isMenuOpen.value = false;
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
      onCleanup(() => {
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      });
    });

    // Read the path when clicking so client-side navigations are taken into account.
    const togglePreview = () => {
      const redirectPath = window.location.pathname + window.location.search;
      window.location.assign(
        config.value.isPreview
          ? props.disablePreviewUrl(redirectPath)
          : props.enablePreviewUrl(redirectPath),
      );
    };

    return () => {
      const { isPreview } = config.value;

      if (!alwaysShowPreviewIndicator.value && !isPreview) {
        return null;
      }

      // Open the dropdown towards the center of the screen.
      const opensDownwards = props.position.top !== undefined;

      return h(
        "div",
        {
          class: [styles.indicator, isPreview && styles.indicatorActive],
          style: toPositionStyle(props.position),
        },
        [
          h("span", `Preview mode ${isPreview ? "enabled" : "disabled"}`),
          h(
            "button",
            {
              type: "button",
              class: styles.toggleButton,
              onClick: togglePreview,
            },
            isPreview ? "Disable" : "Enable",
          ),

          h("div", { class: styles.menu, ref: menuRef }, [
            h(
              "button",
              {
                type: "button",
                class: styles.menuTarget,
                "aria-label": "Preview options",
                "aria-haspopup": "menu",
                "aria-expanded": isMenuOpen.value,
                onClick: () => {
                  isMenuOpen.value = !isMenuOpen.value;
                },
              },
              [h(DotsIcon)],
            ),

            isMenuOpen.value &&
              h(
                "div",
                {
                  role: "menu",
                  class: [
                    styles.dropdown,
                    opensDownwards ? styles.dropdownDown : styles.dropdownUp,
                  ],
                },
                [
                  isPreview &&
                    props.showEditionToggle &&
                    h(
                      MenuItem,
                      {
                        checked: isEditionMode.value,
                        onClick: () => setIsEditionMode(!isEditionMode.value),
                      },
                      () => "Show Editorial shortcuts",
                    ),
                  h(
                    MenuItem,
                    {
                      checked: alwaysShowPreviewIndicator.value,
                      onClick: () =>
                        setAlwaysShowPreviewIndicator(
                          !alwaysShowPreviewIndicator.value,
                        ),
                    },
                    () => "Always display preview indicator",
                  ),
                ],
              ),
          ]),
        ],
      );
    };
  },
});
