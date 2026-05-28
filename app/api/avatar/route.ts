import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken, unauthorized } from '@/lib/auth';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function DELETE (request: NextRequest){
    const auth = await verifyToken(request);
    if(!auth) return unauthorized();
    try{
        const { key } = await request.json();
        if(!key){
            return NextResponse.json({ error: 'Key requerida' }, { status: 400 })
        };
        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
        }));
        return new NextResponse(null, { status: 204 });
    } catch(error){
        console.error('DELETE avatar error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}