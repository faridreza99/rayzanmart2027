export interface CloudinaryUploadResult {
  secure_url: string;
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const uploadToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("rm_auth_token");
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText);
        resolve(result);
      } else {
        const errMsg = (() => {
          try { return JSON.parse(xhr.responseText).error || "Upload failed"; } catch { return "Upload failed"; }
        })();
        const err: any = new Error(errMsg);
        err.status = xhr.status;
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed - network error"));
    xhr.send(formData);
  });
};

export const getOptimizedUrl = (url: string, _width?: number, _height?: number): string => {
  return url || "";
};
