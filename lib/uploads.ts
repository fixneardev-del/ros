export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PROVIDER_PHOTOS = 6;
export const MAX_JOB_PHOTOS = 4;

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export type PhotoValidation =
  | { ok: true; extension: "jpg" | "png" | "webp" }
  | { ok: false; message: string };

/**
 * Checks the declared type, the size and the magic bytes. The browser's MIME
 * type alone is not trusted.
 */
export async function validatePhoto(file: File): Promise<PhotoValidation> {
  if (file.size === 0) {
    return { ok: false, message: "That file is empty. Choose a photo." };
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      message: "That photo is over 5 MB. Choose a smaller photo or resize it.",
    };
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { ok: false, message: "Add a JPG, PNG or WebP photo." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (startsWith(bytes, JPEG)) return { ok: true, extension: "jpg" };
  if (startsWith(bytes, PNG)) return { ok: true, extension: "png" };

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return { ok: true, extension: "webp" };

  return { ok: false, message: "Add a JPG, PNG or WebP photo." };
}

export function photoFiles(formData: FormData, field = "photos") {
  return formData
    .getAll(field)
    .filter((value): value is File => value instanceof File && value.size > 0);
}
