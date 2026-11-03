import type { EditorialFiles } from "@isardsat/editorial-common";
import { describe, expect, it } from "vitest";
import {
  getConstraintIssues,
  getEditedBaseName,
  getFileNamesInDirectory,
  getOutputSize,
  getRelativeFilePath,
  getUploadedFileValue,
  isEditableImage,
  splitFilePath,
} from "./imageEditing";

const largeFilesUrl = "https://bucket.example.com/files";

describe("isEditableImage", () => {
  it.each(["a.png", "dir/a.JPG", "a.jpeg", "a.webp", "a.png?v=2"])(
    "accepts %s",
    (path) => {
      expect(isEditableImage(path)).toBe(true);
    },
  );

  it.each(["a.svg", "a.gif", "a.pdf", "", undefined])("rejects %s", (path) => {
    expect(isEditableImage(path)).toBe(false);
  });
});

describe("getRelativeFilePath", () => {
  it("strips the large files URL", () => {
    expect(
      getRelativeFilePath(`${largeFilesUrl}/images/a.png`, largeFilesUrl),
    ).toBe("images/a.png");
  });

  it("keeps relative paths without leading slashes", () => {
    expect(getRelativeFilePath("/images/a.png", largeFilesUrl)).toBe(
      "images/a.png",
    );
    expect(getRelativeFilePath("a.png", largeFilesUrl)).toBe("a.png");
  });
});

describe("splitFilePath", () => {
  it("splits nested paths", () => {
    expect(splitFilePath("images/2026/hero.final.jpg")).toEqual({
      directory: "images/2026",
      fileName: "hero.final.jpg",
      baseName: "hero.final",
    });
  });

  it("splits root paths", () => {
    expect(splitFilePath("hero.jpg")).toEqual({
      directory: "",
      fileName: "hero.jpg",
      baseName: "hero",
    });
  });
});

describe("getFileNamesInDirectory", () => {
  const files: EditorialFiles = [
    {
      name: "images",
      path: "images",
      relativePath: "images",
      size: 0,
      type: "directory",
      children: [
        {
          name: "a.png",
          path: "https://example.com/images/a.png",
          relativePath: "images/a.png",
          size: 10,
          type: "file",
        },
        {
          name: "nested",
          path: "images/nested",
          relativePath: "images/nested",
          size: 0,
          type: "directory",
          children: [],
        },
      ],
    },
  ];

  it("lists the files of a directory", () => {
    expect(getFileNamesInDirectory(files, "images")).toEqual(
      new Set(["a.png"]),
    );
  });

  it("returns an empty set for missing directories", () => {
    expect(getFileNamesInDirectory(files, "missing").size).toBe(0);
    expect(getFileNamesInDirectory(undefined, "images").size).toBe(0);
  });
});

describe("getEditedBaseName", () => {
  it("suggests a name that does not overwrite existing files", () => {
    expect(getEditedBaseName("hero", "webp", new Set())).toBe("hero-edited");
    expect(
      getEditedBaseName(
        "hero",
        "webp",
        new Set(["hero-edited.webp", "hero-edited-2.webp"]),
      ),
    ).toBe("hero-edited-3");
  });

  it("only considers files with the same extension", () => {
    expect(
      getEditedBaseName("hero", "webp", new Set(["hero-edited.jpg"])),
    ).toBe("hero-edited");
  });
});

describe("getOutputSize", () => {
  const crop = { width: 3000, height: 1687.5 };

  it("defaults to the cropped size", () => {
    expect(getOutputSize(crop, 16 / 9, undefined, undefined)).toEqual({
      width: 3000,
      height: 1688,
    });
  });

  it("caps the width to maxWidth", () => {
    expect(getOutputSize(crop, 16 / 9, 2400, 1600)).toEqual({
      width: 1600,
      height: 900,
    });
  });

  it("never upscales", () => {
    expect(
      getOutputSize({ width: 800, height: 450 }, 16 / 9, 1200, 1600),
    ).toEqual({ width: 800, height: 450 });
  });

  it("uses the requested width", () => {
    expect(getOutputSize(crop, 16 / 9, 1280, undefined)).toEqual({
      width: 1280,
      height: 720,
    });
  });
});

describe("getConstraintIssues", () => {
  it("accepts matching images", () => {
    expect(
      getConstraintIssues(
        { width: 1600, height: 901 },
        { aspectRatio: "16:9", maxWidth: 1600 },
      ),
    ).toEqual([]);
  });

  it("reports off-ratio and too wide images", () => {
    expect(
      getConstraintIssues(
        { width: 2000, height: 2000 },
        { aspectRatio: "16:9", maxWidth: 1600 },
      ),
    ).toEqual(["Doesn't match the 16:9 aspect ratio", "Wider than 1600px"]);
  });

  it("ignores missing constraints", () => {
    expect(getConstraintIssues({ width: 5000, height: 10 }, {})).toEqual([]);
  });
});

describe("getUploadedFileValue", () => {
  it("returns a relative path for small files", () => {
    expect(getUploadedFileValue("images", "a.webp", 500, largeFilesUrl)).toBe(
      "images/a.webp",
    );
    expect(getUploadedFileValue("", "a.webp", 500, largeFilesUrl)).toBe(
      "a.webp",
    );
  });

  it("returns the large files URL for large files", () => {
    expect(
      getUploadedFileValue("images", "a.webp", 2_000_000, largeFilesUrl),
    ).toBe(`${largeFilesUrl}/images/a.webp`);
  });
});
