import { MAX_DIMENSION, MAX_UPLOAD_BYTES } from "@/config/constants";

export function loadImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "This photo cannot be opened. Try exporting it as JPEG again.",
        ),
      );
    };
    img.src = url;
  });
}

export async function prepareImageForUpload(fileToUpload: File): Promise<File> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(fileToUpload);
  } catch {
    return fileToUpload;
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // Early return if image already satisfies size and dimension limits
  if (
    fileToUpload.size <= MAX_UPLOAD_BYTES &&
    width <= MAX_DIMENSION &&
    height <= MAX_DIMENSION
  ) {
    return fileToUpload;
  }

  let targetWidth = width;
  let targetHeight = height;
  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.max(
        1,
        Math.round((targetHeight * MAX_DIMENSION) / targetWidth),
      );
      targetWidth = MAX_DIMENSION;
    } else {
      targetWidth = Math.max(
        1,
        Math.round((targetWidth * MAX_DIMENSION) / targetHeight),
      );
      targetHeight = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fileToUpload;

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const jpegBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );

  if (!jpegBlob) return fileToUpload;

  const nextName = fileToUpload.name.replace(/\.[^.]+$/, ".jpg");
  return new File([jpegBlob], nextName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function convertBlobToJpeg(
  sourceBlob: Blob,
  quality = 0.95,
): Promise<Blob> {
  const img = await loadImage(sourceBlob);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Your browser could not prepare the download. Try another browser.",
    );
  }

  context.drawImage(img, 0, 0);

  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  if (!jpeg) {
    throw new Error(
      "The JPEG download could not be prepared. Please try again.",
    );
  }

  return jpeg;
}
