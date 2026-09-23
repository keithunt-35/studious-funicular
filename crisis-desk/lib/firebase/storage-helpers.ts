import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase";

const MAX_INCIDENT_PHOTO_SIZE = 10 * 1024 * 1024;

export async function uploadIncidentPhoto(incidentId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Incident photos must be image files.");
  }

  if (file.size > MAX_INCIDENT_PHOTO_SIZE) {
    throw new Error("Incident photos must be smaller than 10 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileReference = ref(storage, `incidents/${incidentId}/photo-${Date.now()}.${extension}`);
  await uploadBytes(fileReference, file, { contentType: file.type });
  return getDownloadURL(fileReference);
}