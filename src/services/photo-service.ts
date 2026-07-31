import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

function inspectionPhotoDirUri(inspectionId: string): string {
  return Paths.document.uri + `inspections/${inspectionId}/`;
}

export async function takePhoto(
  inspectionId: string,
  pointKey: string,
): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets[0]) return null;
  return savePhoto(result.assets[0].uri, inspectionId, pointKey);
}

export async function pickPhoto(
  inspectionId: string,
  pointKey: string,
): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.7,
    allowsMultipleSelection: false,
    mediaTypes: 'images',
  });

  if (result.canceled || !result.assets[0]) return null;
  return savePhoto(result.assets[0].uri, inspectionId, pointKey);
}

function savePhoto(sourceUri: string, inspectionId: string, pointKey: string): string {
  const dirUri = inspectionPhotoDirUri(inspectionId);
  new Directory(dirUri).create({ intermediates: true, idempotent: true });
  const filename = `${pointKey.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.jpg`;
  const destFile = new File(dirUri + filename);
  new File(sourceUri).copy(destFile);
  return destFile.uri;
}

export async function captureHeaderPhotoUri(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function pickHeaderPhotoUri(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.7,
    allowsMultipleSelection: false,
    mediaTypes: 'images',
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export function saveHeaderPhoto(inspectionId: string, sourceUri: string): string {
  const dirUri = inspectionPhotoDirUri(inspectionId);
  new Directory(dirUri).create({ intermediates: true, idempotent: true });
  const filename = `header_${Date.now()}.jpg`;
  const destFile = new File(dirUri + filename);
  if (destFile.exists) destFile.delete();
  new File(sourceUri).copy(destFile);
  return destFile.uri;
}

export function deleteInspectionPhotos(inspectionId: string): void {
  const dir = new Directory(inspectionPhotoDirUri(inspectionId));
  if (dir.exists) {
    dir.delete();
  }
}

export function deleteMediaFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best effort — a missing file or unsupported URI scheme should never block the caller.
  }
}

export async function photoToBase64(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return result.base64!;
}
