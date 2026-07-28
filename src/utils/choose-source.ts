import { Alert } from 'react-native';

export function chooseSource(
  title: string,
  cameraLabel: string,
  galleryLabel: string,
): Promise<'camera' | 'gallery' | null> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      undefined,
      [
        { text: cameraLabel, onPress: () => resolve('camera') },
        { text: galleryLabel, onPress: () => resolve('gallery') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
