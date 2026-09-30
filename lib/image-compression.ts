const MAX_IMAGE_BYTES = 1_000_000;
const MAX_EDGE = 2560;

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Could not convert this image to JPEG')),
      'image/jpeg',
      quality,
    );
  });
}

/** Convert an image to a large JPEG, reducing quality and dimensions as needed to stay under 1 MB. */
export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    for (let resize = 0; resize < 12; resize++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare this image');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.88, 0.78, 0.68, 0.58, 0.48, 0.38]) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.size <= MAX_IMAGE_BYTES) {
          const base = file.name.replace(/\.[^.]*$/, '') || 'image';
          return new File([blob], `${base}.jpg`, {type: 'image/jpeg', lastModified: file.lastModified});
        }
      }
      scale *= 0.82;
    }

    throw new Error('Could not reduce this image below 1 MB');
  } finally {
    bitmap.close();
  }
}
