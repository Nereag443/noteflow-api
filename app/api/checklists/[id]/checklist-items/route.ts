import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const itemSchema = z.object({
    text: z.string().min(1),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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