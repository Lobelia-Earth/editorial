import {
  LARGE_FILE_SIZE,
  parseAspectRatio,
  type EditorialFiles,
} from "@isardsat/editorial-common";

export const IMAGE_FORMATS = {
  webp: { mimeType: "image/webp", extension: "webp", lossy: true },
  jpeg: { mimeType: "image/jpeg", extension: "jpg", lossy: true },
  png: { mimeType: "image/png", extension: "png", lossy: false },
} as const;

export type ImageFormat = keyof typeof IMAGE_FORMATS;

export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageConstraints {
  aspectRatio?: string;
  maxWidth?: number;
}

// SVGs are vector and GIFs may be animated, so neither can go through a canvas
const editableImagePattern = /\.(png|jpe?g|webp)$/i;

// Relative difference tolerated before an image is considered off-ratio
const ASPECT_RATIO_TOLERANCE = 0.01;

export function isEditableImage(path: string | undefined) {
  return !!path && editableImagePattern.test(path.split("?")[0]);
}

export function resolveFileUrl(value: string) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  // In dev the admin runs on Vite, so public files must be loaded from the
  // Editorial server's origin instead of the admin's.
  const origin = import.meta.env.PROD
    ? ""
    : new URL(import.meta.env.VITE_EDITORIAL_BASE_URL).origin;
  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
}

/**
 * Returns the value stored in an uploaded file field for a file: its path
 * relative to the public directory, or its full URL when it is a large file.
 */
export function getFileFieldValue(
  relativePath: string,
  isLarge: boolean,
  largeFilesUrl: string | undefined,
) {
  return isLarge ? `${largeFilesUrl}/${relativePath}` : relativePath;
}

/**
 * Inverse of getFileFieldValue: the path of a file relative to the public
 * directory, from the value stored in an uploaded file field.
 */
export function getRelativeFilePath(
  value: string,
  largeFilesUrl: string | undefined,
) {
  if (largeFilesUrl && value.startsWith(`${largeFilesUrl}/`)) {
    return value.slice(largeFilesUrl.length + 1);
  }
  return value.replace(/^\/+/, "");
}

export function splitFilePath(relativePath: string) {
  const slashIndex = relativePath.lastIndexOf("/");
  const directory = slashIndex === -1 ? "" : relativePath.slice(0, slashIndex);
  const fileName = relativePath.slice(slashIndex + 1);
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;

  return { directory, fileName, baseName };
}

export function getFileNamesInDirectory(
  files: EditorialFiles | undefined,
  directory: string,
): Set<string> {
  let nodes = files ?? [];

  for (const segment of directory.split("/").filter(Boolean)) {
    const dir = nodes.find(
      (node) => node.type === "directory" && node.name === segment,
    );
    nodes = dir?.children ?? [];
  }

  return new Set(
    nodes.filter((node) => node.type === "file").map((node) => node.name),
  );
}

/**
 * Suggests a name for the edited copy of an image that does not overwrite
 * any file in the same directory, e.g. "hero-edited.webp", "hero-edited-2.webp".
 */
export function getEditedBaseName(
  baseName: string,
  extension: string,
  existingNames: Set<string>,
) {
  const candidate = `${baseName}-edited`;
  if (!existingNames.has(`${candidate}.${extension}`)) return candidate;

  let index = 2;
  while (existingNames.has(`${candidate}-${index}.${extension}`)) index++;
  return `${candidate}-${index}`;
}

/**
 * Output size of the edited image. Images are never upscaled beyond the
 * cropped area, and never wider than maxWidth.
 */
export function getOutputSize(
  crop: Pick<PixelArea, "width" | "height">,
  aspect: number,
  requestedWidth: number | undefined,
  maxWidth: number | undefined,
) {
  const limit = Math.min(crop.width, maxWidth ?? Infinity);
  const width = Math.max(
    1,
    Math.round(Math.min(requestedWidth || limit, limit)),
  );

  return { width, height: Math.max(1, Math.round(width / aspect)) };
}

/**
 * Lists the constraints of a field that an image of the given size breaks.
 */
export function getConstraintIssues(
  size: { width: number; height: number },
  { aspectRatio, maxWidth }: ImageConstraints,
): string[] {
  const issues: string[] = [];
  const ratio = parseAspectRatio(aspectRatio);

  if (ratio) {
    const actual = size.width / size.height;
    if (Math.abs(actual - ratio) / ratio > ASPECT_RATIO_TOLERANCE) {
      issues.push(`Doesn't match the ${aspectRatio} aspect ratio`);
    }
  }

  if (maxWidth && size.width > maxWidth) {
    issues.push(`Wider than ${maxWidth}px`);
  }

  return issues;
}

/**
 * Returns where an edited image ends up after uploading it to a directory,
 * mirroring the server, which hands large files to the large file handler.
 */
export function getUploadedFileValue(
  directory: string,
  fileName: string,
  size: number,
  largeFilesUrl: string | undefined,
) {
  const relativePath = directory ? `${directory}/${fileName}` : fileName;
  return getFileFieldValue(
    relativePath,
    size >= LARGE_FILE_SIZE,
    largeFilesUrl,
  );
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  return { canvas, context };
}

/**
 * Rotates, crops and resizes an image. The crop area is expressed in pixels
 * of the rotated image's bounding box, as reported by react-easy-crop.
 */
export async function renderEditedImage(
  source: ImageBitmap,
  {
    crop,
    rotation,
    width,
    height,
    format,
    quality,
  }: {
    crop: PixelArea;
    rotation: number;
    width: number;
    height: number;
    format: ImageFormat;
    quality: number;
  },
): Promise<Blob> {
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const boxWidth = Math.round(source.width * cos + source.height * sin);
  const boxHeight = Math.round(source.width * sin + source.height * cos);

  const rotated = createCanvas(boxWidth, boxHeight);
  rotated.context.translate(boxWidth / 2, boxHeight / 2);
  rotated.context.rotate(radians);
  rotated.context.drawImage(source, -source.width / 2, -source.height / 2);

  let current = createCanvas(Math.round(crop.width), Math.round(crop.height));
  current.context.drawImage(
    rotated.canvas,
    Math.round(crop.x),
    Math.round(crop.y),
    current.canvas.width,
    current.canvas.height,
    0,
    0,
    current.canvas.width,
    current.canvas.height,
  );

  // Halve in steps, a single big downscale produces aliasing artifacts
  while (current.canvas.width / 2 >= width) {
    const next = createCanvas(
      Math.round(current.canvas.width / 2),
      Math.round(current.canvas.height / 2),
    );
    next.context.drawImage(
      current.canvas,
      0,
      0,
      next.canvas.width,
      next.canvas.height,
    );
    current = next;
  }

  const output = createCanvas(width, height);
  const { mimeType, lossy } = IMAGE_FORMATS[format];

  if (format === "jpeg") {
    // JPEG has no alpha channel, transparent areas would turn black
    output.context.fillStyle = "#fff";
    output.context.fillRect(0, 0, width, height);
  }
  output.context.drawImage(current.canvas, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    output.canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Image encoding failed"));
        // Browsers fall back to PNG for formats they cannot encode
        if (blob.type !== mimeType) {
          return reject(
            new Error(`This browser cannot save images as ${format}`),
          );
        }
        resolve(blob);
      },
      mimeType,
      lossy ? quality : undefined,
    );
  });
}
