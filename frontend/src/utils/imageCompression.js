const MAX_SIZE_KB = 500;
const MIN_QUALITY = 0.4;

/**
 * Compress image file before upload.
 * Iteratively reduces JPEG quality until output is below MAX_SIZE_KB (500 KB)
 * or rejects if MIN_QUALITY (0.4) is reached and the image is still too large.
 *
 * @param {File} file - Image file from input
 * @param {number} maxWidth - Max width in px (default 1200)
 * @param {number} quality - Initial JPEG quality 0-1 (default 0.8)
 * @returns {Promise<string>} Base64 compressed image
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down to maxWidth preserving aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Initial encode
        let currentQuality = quality;
        let base64 = canvas.toDataURL('image/jpeg', currentQuality);

        // If already under the limit, resolve immediately
        if (getFileSizeKB(base64) < MAX_SIZE_KB) {
          resolve(base64);
          return;
        }

        // Iterative quality reduction loop
        currentQuality -= 0.1;
        while (currentQuality >= MIN_QUALITY) {
          base64 = canvas.toDataURL('image/jpeg', currentQuality);
          if (getFileSizeKB(base64) < MAX_SIZE_KB) {
            resolve(base64);
            return;
          }
          currentQuality = Math.round((currentQuality - 0.1) * 10) / 10;
        }

        // Final attempt at minimum quality
        base64 = canvas.toDataURL('image/jpeg', MIN_QUALITY);
        if (getFileSizeKB(base64) < MAX_SIZE_KB) {
          resolve(base64);
        } else {
          reject(new Error('Image too large to compress below 500 KB. Please use a smaller image.'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get approximate file size in KB from a base64 string.
 * @param {string} base64String
 * @returns {number}
 */
export function getFileSizeKB(base64String) {
  // Remove data URL prefix if present before calculating
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / 1024;
}
