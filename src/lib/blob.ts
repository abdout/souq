import { put, list, del, head } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob storage
 * @param pathname - The path where the file will be stored
 * @param file - The file to upload (File, Blob, or string)
 * @param options - Upload options
 */
export async function uploadToBlob(
  pathname: string, 
  file: File | Blob | string,
  options: {
    access?: 'public';
    addRandomSuffix?: boolean;
    cacheControlMaxAge?: number;
    contentType?: string;
  } = {}
) {
  try {
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true, // Prevents overwriting and makes URLs unique
      ...options,
    });
    
    return {
      success: true,
      blob,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    };
  } catch (error) {
    console.error('Failed to upload to Vercel Blob:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * List blobs with optional filtering
 */
export async function listBlobs(options: {
  prefix?: string;
  limit?: number;
  cursor?: string;
} = {}) {
  try {
    const result = await list({
      limit: 1000,
      ...options,
    });
    
    return {
      success: true,
      blobs: result.blobs,
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error('Failed to list blobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List failed',
      blobs: [],
    };
  }
}

/**
 * Delete a blob by URL
 */
export async function deleteBlob(url: string) {
  try {
    await del(url);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete blob:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Get blob metadata
 */
export async function getBlobInfo(url: string) {
  try {
    const blob = await head(url);
    return {
      success: true,
      blob,
    };
  } catch (error) {
    console.error('Failed to get blob info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Head request failed',
    };
  }
}

/**
 * Upload files for different business types with organized folder structure
 */
export async function uploadBusinessFile(
  businessType: 'restaurant' | 'pharmacy' | 'grocery',
  fileType: 'item-image' | 'business-logo' | 'business-license',
  tenantSlug: string,
  file: File,
  itemId?: string
) {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  
  // Organized folder structure
  let pathname: string;
  
  switch (fileType) {
    case 'item-image':
      pathname = `${businessType}/${tenantSlug}/items/${itemId}/${timestamp}.${fileExtension}`;
      break;
    case 'business-logo':
      pathname = `${businessType}/${tenantSlug}/logo/${timestamp}.${fileExtension}`;
      break;
    case 'business-license':
      pathname = `${businessType}/${tenantSlug}/documents/license-${timestamp}.${fileExtension}`;
      break;
    default:
      pathname = `${businessType}/${tenantSlug}/misc/${timestamp}.${fileExtension}`;
  }
  
  return uploadToBlob(pathname, file, {
    access: 'public',
    addRandomSuffix: false, // We're already adding timestamp for uniqueness
    contentType: file.type,
  });
}