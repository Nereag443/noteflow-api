import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, unauthorized } from '@/lib/auth';

type Params = { params: Promise<{ tagId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
    const auth = await verifyToken(request);
    if (!auth){
        return unauthorized();
    }
    try {
        const { tagId } = await params;
        await query('DELETE FROM note_tags WHERE id = $1', [tagId]);
        return new NextResponse(null, { status: 204 });
    } catch(error) {
    console.error('DELETE tag error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}