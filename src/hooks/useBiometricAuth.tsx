import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

const CREDENTIALS_SERVER = 'familybridge.app';

interface StoredCredentials {
  email: string;
  password: string;
}

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType | null>(null);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    // Only available on native platforms
    if (!Capacitor.isNativePlatform()) {
      setIsAvailable(false);
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      setIsAvailable(result.isAvailable);
      setBiometryType(result.biometryType);
      
      // Check if we have stored credentials
      if (result.isAvailable) {
        try {
          await NativeBiometric.getCredentials({ server: CREDENTIALS_SERVER });
          setHasStoredCredentials(true);
        } catch {
          setHasStoredCredentials(false);
        }
      }
    } catch (error) {
      console.log('Biometric not available:', error);
      setIsAvailable(false);
    }
  };

  const saveCredentials = async (email: string, password: string): Promise<boolean> => {
    if (!isAvailable) return false;

    try {
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: CREDENTIALS_SERVER,
      });
      setHasStoredCredentials(true);
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  };

  const getCredentials = async (): Promise<StoredCredentials | null> => {
    if (!isAvailable || !hasStoredCredentials) return null;

    try {
      // Verify with biometrics first
      await NativeBiometric.verifyIdentity({
        reason: 'Sign in to FamilyBridge',
        title: 'Biometric Login',
        subtitle: 'Use your fingerprint or face to sign in',
        description: 'Touch the sensor or look at your device',
      });

      // Get the credentials
      const credentials = await NativeBiometric.getCredentials({
        server: CREDENTIALS_SERVER,
      });

      return {
        email: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return null;
    }
  };

  const deleteCredentials = async (): Promise<boolean> => {
    try {
      await NativeBiometric.deleteCredentials({
        server: CREDENTIALS_SERVER,
      });
      setHasStoredCredentials(false);
      return true;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return false;
    }
  };

  const getBiometryLabel = (): string => {
    switch (biometryType) {
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FINGERPRINT:
        return 'Fingerprint';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Face Authentication';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Iris Authentication';
      default:
        return 'Biometrics';
    }
  };

  return {
    isAvailable,
    biometryType,
    hasStoredCredentials,
    saveCredentials,
    getCredentials,
    deleteCredentials,
    getBiometryLabel,
    checkBiometricAvailability,
  };
}
