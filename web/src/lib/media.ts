/** Media helpers: compresses images and reads videos as data URLs for local storage. */

const MAX_IMAGE_DIMENSION = 1280;
const IMAGE_QUALITY = 0.72;
const MAX_VIDEO_BYTES = 8 * 1024 * 1024;

export async function fileToImageDataUrl(file: File): Promise<string> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(bitmapUrl);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export async function fileToVideoDataUrl(file: File): Promise<string> {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Vídeo muito grande (máx. 8 MB). Prefira vídeos curtos.");
  }
  return readAsDataUrl(file);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = url;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

/** Converts a data URL back to a Blob (used when packaging report ZIPs). */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*?);/);
    const mime = mimeMatch?.[1] ?? "application/octet-stream";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export function extensionForDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/")) return "jpg";
  if (dataUrl.startsWith("data:video/webm")) return "webm";
  if (dataUrl.startsWith("data:video/")) return "mp4";
  return "bin";
}
