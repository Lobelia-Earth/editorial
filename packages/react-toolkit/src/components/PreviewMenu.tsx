import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocalStorage } from "../hooks/use-local-storage/use-local-storage";
import styles from "./PreviewMenu.module.css";
import { useEditorialReactConfig } from "./providers/EditorialReactConfigContext";

type Position = Pick<CSSProperties, "top" | "right" | "bottom" | "left">;

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

const CheckIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    ></path>
  </svg>
);

const DotsIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    ></path>
  </svg>
);

type MenuItemProps = {
  checked: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const MenuItem = ({ checked, onClick, children }: MenuItemProps) => (
  <button
    type="button"
    role="menuitemcheckbox"
    aria-checked={checked}
    className={styles.item}
    onClick={onClick}
  >
    <span className={styles.itemIcon}>{checked && <CheckIcon />}</span>
    {children}
  </button>
);

export const PreviewMenu = ({
  enablePreviewUrl = defaultEnablePreviewUrl,
  disablePreviewUrl = defaultDisablePreviewUrl,
  position = { bottom: 10, left: 10 },
  showEditionToggle = true,
}: PreviewMenuProps) => {
  const { isPreview } = useEditorialReactConfig();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isEditionMode, setIsEditionMode] = useLocalStorage({
    key: "isEditionMode",
    defaultValue: false,
  });

  const [alwaysShowPreviewIndicator, setAlwaysShowPreviewIndicator] =
    useLocalStorage({
      key: "alwaysShowPreviewIndicator",
      defaultValue: false,
    });

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  if (!alwaysShowPreviewIndicator && !isPreview) {
    return null;
  }

  // Read the path when clicking so client-side navigations are taken into account.
  const togglePreview = () => {
    const redirectPath = window.location.pathname + window.location.search;
    window.location.assign(
      isPreview
        ? disablePreviewUrl(redirectPath)
        : enablePreviewUrl(redirectPath),
    );
  };

  // Open the dropdown towards the center of the screen.
  const opensDownwards = position.top !== undefined;

  return (
    <div
      className={`${styles.indicator} ${isPreview ? styles.indicatorActive : ""}`}
      style={position}
    >
      <span>Preview mode {isPreview ? "enabled" : "disabled"}</span>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={togglePreview}
      >
        {isPreview ? "Disable" : "Enable"}
      </button>

      <div className={styles.menu} ref={menuRef}>
        <button
          type="button"
          className={styles.menuTarget}
          aria-label="Preview options"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <DotsIcon />
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            className={`${styles.dropdown} ${opensDownwards ? styles.dropdownDown : styles.dropdownUp}`}
          >
            {isPreview && showEditionToggle && (
              <MenuItem
                checked={isEditionMode}
                onClick={() => setIsEditionMode(!isEditionMode)}
              >
                Show Editorial shortcuts
              </MenuItem>
            )}
            <MenuItem
              checked={alwaysShowPreviewIndicator}
              onClick={() =>
                setAlwaysShowPreviewIndicator(!alwaysShowPreviewIndicator)
              }
            >
              Always display preview indicator
            </MenuItem>
          </div>
        )}
      </div>
    </div>
  );
};
