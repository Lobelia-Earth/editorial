import { useEffect, useState } from "react";

interface ColorPickerProps {
  id: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Convert RGB to Hex
function rgbToHex(rgb: string): string {
  const match = rgb.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
  );
  if (!match) return "#000000";

  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);

  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Convert Hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "rgb(0, 0, 0)";

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgb(${r}, ${g}, ${b})`;
}

export default function ColorPicker({
  id,
  value,
  onChange,
  placeholder,
}: ColorPickerProps) {
  const [hexValue, setHexValue] = useState("#000000");

  useEffect(() => {
    if (value) {
      setHexValue(rgbToHex(value));
    }
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setHexValue(hex);
    onChange(hexToRgb(hex));
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        id={id}
        type="color"
        value={hexValue}
        onChange={handleColorChange}
        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
      />
      <span className="text-sm text-gray-600">
        {value || placeholder || "Select a color"}
      </span>
    </div>
  );
}
