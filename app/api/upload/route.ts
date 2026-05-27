import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { verifyToken, unauthorized } from '@/lib/auth';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(request: NextRequest){
    const auth = await verifyToken(request);
    if(!auth) return unauthorized();
    try {
        const{fileName, contentType} = await request.json();
        const key = `avatars/&{auth.userId}/${Date.now()}-&{fileName}`;
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
            ContentType: contentType,
        });
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
        const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return NextResponse.json({ signedUrl, publicUrl });
    } catch (error){
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}