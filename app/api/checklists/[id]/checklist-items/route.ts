import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { verifyToken, unauthorized } from '@/lib/auth';

const itemSchema = z.object({
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
        const items = await query(
            'SELECT * FROM checklist_items WHERE note_id = $1 ORDER BY id',
            [id]
        );
        return NextResponse.json(items);
    }catch (error) {
        console.error('Error fetching checklist items:', error);
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
        const result = itemSchema.safeParse(body);
        if(!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }
        const [item] = await query(
            'INSERT INTO checklist_items (note_id, text) VALUES ($1, $2) RETURNING *',
            [id, result.data.text]
        );
        return NextResponse.json(item, { status: 201 });
    } catch(error){
        console.error('POST checklist item error:', error);
        return NextResponse.json({ error: 'Error interno'}, { status: 500 });
    }
}