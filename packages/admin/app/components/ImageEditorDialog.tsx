import {
  getConstraintIssues,
  getEditedBaseName,
  getFileNamesInDirectory,
  getOutputSize,
  getRelativeFilePath,
  getUploadedFileValue,
  IMAGE_FORMATS,
  renderEditedImage,
  resolveFileUrl,
  splitFilePath,
  type ImageFormat,
  type PixelArea,
} from "@/lib/imageEditing";
import {
  useGetConfigQuery,
  useGetFilesQuery,
  useUploadFilesMutation,
} from "@/lib/store/slices/editorialApi";
import { parseAspectRatio } from "@isardsat/editorial-common";
import { RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Spinner } from "./ui/spinner";

const aspectPresets = ["original", "1:1", "4:3", "3:2", "16:9", "3:4", "2:3"];

export interface ImageEditorDialogProps {
  // Uploaded file field value of the image to edit
  value: string;
  aspectRatio?: string;
  maxWidth?: number;
  onClose: () => void;
  // Receives the field value of the saved copy
  onSaved?: (value: string) => void;
}

export default function ImageEditorDialog({
  value,
  aspectRatio,
  maxWidth,
  onClose,
  onSaved,
}: ImageEditorDialogProps) {
  const { data: config } = useGetConfigQuery();
  const { data: files } = useGetFilesQuery();
  const [uploadFiles] = useUploadFilesMutation();

  const [source, setSource] = useState<{
    url: string;
    bitmap: ImageBitmap;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropPixels, setCropPixels] = useState<PixelArea | null>(null);
  const [aspectPreset, setAspectPreset] = useState("original");

  const [widthInput, setWidthInput] = useState("");
  const [format, setFormat] = useState<ImageFormat>("webp");
  const [quality, setQuality] = useState(85);
  const [baseNameInput, setBaseNameInput] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const relativePath = getRelativeFilePath(value, config?.largeFilesUrl);
  const { directory, baseName } = splitFilePath(relativePath);
  const existingNames = useMemo(
    () => getFileNamesInDirectory(files, directory),
    [files, directory],
  );
  const { extension } = IMAGE_FORMATS[format];
  const outputBaseName =
    baseNameInput ?? getEditedBaseName(baseName, extension, existingNames);
  const outputFileName = `${outputBaseName.trim()}.${extension}`;
  const isValidName = !!outputBaseName.trim() && !/[/\\]/.test(outputBaseName);
  const overwritesFile = existingNames.has(outputFileName);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    let bitmap: ImageBitmap | undefined;

    (async () => {
      try {
        const response = await fetch(resolveFileUrl(value));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        bitmap = await createImageBitmap(blob, {
          imageOrientation: "from-image",
        });
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) setSource({ url: objectUrl, bitmap });
      } catch (error) {
        console.error("Error loading image for editing:", error);
        if (!cancelled) {
          setLoadError(
            value.startsWith("http")
              ? "The image could not be loaded. Large files must be served with CORS headers that allow this admin's origin."
              : "The image could not be loaded.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      bitmap?.close();
    };
  }, [value]);

  const fixedAspect = parseAspectRatio(aspectRatio);
  const isQuarterTurned = Math.abs(rotation) % 180 === 90;
  const originalAspect = source
    ? isQuarterTurned
      ? source.bitmap.height / source.bitmap.width
      : source.bitmap.width / source.bitmap.height
    : 1;
  const aspect =
    fixedAspect ??
    (aspectPreset === "original"
      ? originalAspect
      : (parseAspectRatio(aspectPreset) ?? originalAspect));

  const output = cropPixels
    ? getOutputSize(
        cropPixels,
        aspect,
        Number(widthInput) || undefined,
        maxWidth,
      )
    : null;
  const outputIssues = output
    ? getConstraintIssues(output, { aspectRatio, maxWidth })
    : [];

  const rotate = (degrees: number) =>
    setRotation(
      (current) => ((((current + degrees + 180) % 360) + 360) % 360) - 180,
    );

  const handleSave = async () => {
    if (!source || !cropPixels || !output) return;

    setIsSaving(true);
    try {
      const blob = await renderEditedImage(source.bitmap, {
        crop: cropPixels,
        rotation,
        width: output.width,
        height: output.height,
        format,
        quality: quality / 100,
      });
      const file = new File([blob], outputFileName, { type: blob.type });

      await uploadFiles({ files: [file], path: directory }).unwrap();
      toast.success("Image saved", { duration: 2000 });

      onSaved?.(
        getUploadedFileValue(
          directory,
          outputFileName,
          file.size,
          config?.largeFilesUrl,
        ),
      );
      onClose();
    } catch (error) {
      console.error("Saving edited image failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Saving the image failed",
        { duration: 3000 },
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit image</DialogTitle>
          <DialogDescription>
            The edited image is saved as a new file next to the original.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[50vh] min-h-64 rounded-md overflow-hidden bg-muted">
          {loadError ? (
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-destructive">
              {loadError}
            </p>
          ) : source ? (
            <Cropper
              image={source.url}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              maxZoom={5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, pixels) => setCropPixels(pixels)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider
              min={1}
              max={5}
              step={0.01}
              value={[zoom]}
              onValueChange={([next]) => setZoom(next)}
              disabled={!source}
            />
          </div>

          <div className="space-y-2">
            <Label>Rotation ({rotation}°)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Rotate left"
                onClick={() => rotate(-90)}
                disabled={!source}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Slider
                min={-180}
                max={180}
                step={1}
                value={[rotation]}
                onValueChange={([next]) => setRotation(next)}
                disabled={!source}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Rotate right"
                onClick={() => rotate(90)}
                disabled={!source}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            {fixedAspect ? (
              <p className="text-sm text-muted-foreground h-9 flex items-center">
                {aspectRatio} (required by this field)
              </p>
            ) : (
              <Select value={aspectPreset} onValueChange={setAspectPreset}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectPresets.map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset === "original" ? "Original" : preset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-editor-width">
              Width (px){maxWidth ? `, max ${maxWidth}` : ""}
            </Label>
            <Input
              id="image-editor-width"
              type="number"
              min={1}
              value={widthInput}
              placeholder={output ? String(output.width) : ""}
              onChange={(event) => setWidthInput(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={format}
              onValueChange={(next) => setFormat(next as ImageFormat)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Quality{" "}
              {IMAGE_FORMATS[format].lossy ? `(${quality})` : "(lossless)"}
            </Label>
            <Slider
              min={10}
              max={100}
              step={1}
              value={[quality]}
              onValueChange={([next]) => setQuality(next)}
              disabled={!IMAGE_FORMATS[format].lossy}
              className="h-9"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="image-editor-name">File name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-editor-name"
                value={outputBaseName}
                onChange={(event) => setBaseNameInput(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">
                .{extension}
              </span>
            </div>
            {!isValidName && (
              <p className="text-xs text-destructive">
                The name can't be empty or contain slashes.
              </p>
            )}
            {isValidName && overwritesFile && (
              <p className="text-xs text-amber-600">
                A file with this name already exists and will be replaced.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:items-center">
          <p className="text-sm text-muted-foreground sm:mr-auto">
            {output && `Output: ${output.width} × ${output.height} px`}
            {outputIssues.length > 0 && (
              <span className="text-amber-600">
                {" "}
                · {outputIssues.join(", ")}
              </span>
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!source || !cropPixels || !isValidName || isSaving}
          >
            {isSaving ? "Saving..." : "Save copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
