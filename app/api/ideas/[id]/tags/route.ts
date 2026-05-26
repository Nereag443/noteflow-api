import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { verifyToken, unauthorized } from '@/lib/auth';

const tagSchema = z.object({
    text: z.string().min(1),
});

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await verifyToken(request);
    if (!auth){
        return unauthorized();
    }
    try {
        const { id } = await params;
        const tags = await query(
            'SELECT * FROM note_tags WHERE note_id = $1',
            [id]
        );
        return NextResponse.json(tags);
    } catch (error) {
        console.error('GET tags error', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: Params) {
    const auth = await verifyToken(request);
    if (!auth){
        return unauthorized();
    }
    try {
        const { id } = await params;
        const body = await request.json();
        const result = tagSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ errors: result.error.issues }, { status: 400 });
        }
        const [tag] = await query(
            'INSERT INTO note_tags (note_id, text) VALUES ($1, $2) RETURNING *',
            [id, result.data.text]
        );

        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        console.error('POST tags error', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}