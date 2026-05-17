export const isValidUrl = (url: string) => {
  if (!url) return true; // ถ้าไม่กรอกก็ผ่าน (optional field)
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};
