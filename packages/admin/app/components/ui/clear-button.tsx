import { X } from "lucide-react";

const ClearButton = ({
  onClear,
  visible = true,
}: {
  onClear: () => void;
  visible?: boolean;
}) => {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        onClear();
      }}
      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded"
      title="Clear"
    >
      <X className="w-4 h-4 text-gray-500 hover:text-black" />
    </button>
  );
};

export default ClearButton;
