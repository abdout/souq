import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob, listBlobs } from '@/lib/blob';

export async function GET() {
  try {
    // Test listing blobs
    const result = await listBlobs({ limit: 10 });
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Vercel Blob',
        error: result.error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Vercel Blob is working!',
      blobCount: result.blobs.length,
      blobs: result.blobs.slice(0, 5) // Show first 5 blobs
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Vercel Blob connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 });
    }
    
    // Test upload
    const result = await uploadToBlob(`test-uploads/test-${Date.now()}.${file.name.split('.').pop()}`, file);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Upload failed',
        error: result.error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully!',
      blob: result.blob,
      url: result.url
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Upload test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}