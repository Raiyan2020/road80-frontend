import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const checkMediaPermissions = async () => {
  if (Capacitor.getPlatform() === 'web') {
    return true;
  }

  let cameraStatus = await Camera.checkPermissions();
  
  // Request if any are in 'prompt' state
  if (cameraStatus.camera === 'prompt' || cameraStatus.photos === 'prompt') {
    cameraStatus = await Camera.requestPermissions();
  }

  // Return true if at least one is granted (allows gallery or camera to work)
  return cameraStatus.camera === 'granted' || cameraStatus.photos === 'granted';
};
