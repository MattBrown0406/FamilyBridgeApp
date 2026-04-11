import { supabase } from '@/integrations/supabase/client';

export const STORAGE_REF_PREFIX = 'storage://';

interface StorageRef {
  bucket: string;
  path: string;
}

export const createStorageRef = (bucket: string, path: string) => `${STORAGE_REF_PREFIX}${bucket}/${path}`;

export const parseStorageRef = (value?: string | null): StorageRef | null => {
  if (!value || !value.startsWith(STORAGE_REF_PREFIX)) {
    return null;
  }

  const remainder = value.slice(STORAGE_REF_PREFIX.length);
  const firstSlash = remainder.indexOf('/');

  if (firstSlash <= 0 || firstSlash === remainder.length - 1) {
    return null;
  }

  return {
    bucket: remainder.slice(0, firstSlash),
    path: remainder.slice(firstSlash + 1),
  };
};

export const resolveStorageUrl = async (value?: string | null, expiresIn = 3600): Promise<string | null> => {
  if (!value) {
    return null;
  }

  const storageRef = parseStorageRef(value);
  if (!storageRef) {
    return value;
  }

  const { data, error } = await supabase.storage
    .from(storageRef.bucket)
    .createSignedUrl(storageRef.path, expiresIn);

  if (error) {
    console.error('Error resolving storage URL:', error);
    return null;
  }

  return data?.signedUrl ?? null;
};
