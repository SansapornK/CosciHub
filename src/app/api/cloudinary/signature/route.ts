// src/app/api/cloudinary/signature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { folder, publicId, resourceType = 'image' } = await req.json();

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder is required' },
        { status: 400 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Parameters to sign
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
    };

    if (publicId) {
      paramsToSign.public_id = publicId;
    }

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      publicId,
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
