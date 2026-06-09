export const PROPERTY_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const PROPERTY_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PROPERTY_IMAGE_MAX_COUNT = 10;

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const supportedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

export function isSupportedPropertyImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return supportedImageTypes.has(file.type) || supportedImageExtensions.has(extension);
}

export function validatePropertyImages(files: Iterable<File>) {
  const accepted: File[] = [];
  let rejectedType = 0;
  let rejectedSize = 0;

  Array.from(files).forEach((file) => {
    if (!isSupportedPropertyImage(file)) {
      rejectedType += 1;
      return;
    }

    if (file.size > PROPERTY_IMAGE_MAX_BYTES) {
      rejectedSize += 1;
      return;
    }

    accepted.push(file);
  });

  return { accepted, rejectedType, rejectedSize };
}
