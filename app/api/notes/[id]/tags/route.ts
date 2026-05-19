import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const tagSchema = z.object({
    text: z.string().min(1),
});

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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