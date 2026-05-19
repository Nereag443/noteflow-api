import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ tagId: string }> }
) {
    try {
        const { tagId } = await params;
        await query('DELETE FROM note_tags WHERE id = $1', [tagId]);
        return new NextResponse(null, { status: 204 });
    } catch(error) {
    console.error('DELETE tag error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}