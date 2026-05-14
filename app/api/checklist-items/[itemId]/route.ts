import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
    text: z.string().min(1).optional(),
    is_completed: z.boolean().optional(),
})

export async function PATCH(request :Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const { itemId } = await params;
        const body = await request.json();
        const result = updateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ errors: result.error.issues }, { status: 400 })
        }
        const { text, is_completed } = result.data;
        const [item] = await query(
            `UPDATE checklist_items SET text = COALESCE($1, text), is_completed = COALESCE($2, is_completed) WHERE id = $3 RETURNING *`,
            [ text, is_completed, itemId ]
        );
        if(!item){
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
        }
        return NextResponse.json(item);
    } catch (error){
        console.error(error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(request :Request, { params }: { params: Promise<{ itemId: string }> }) {
    try {
        const { itemId } = await params;
        await query('DELETE FROM checklist_items WHERE id = $1', [itemId]);
        return new NextResponse(null, { status: 204 });
    } catch (error){
        console.error(error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}