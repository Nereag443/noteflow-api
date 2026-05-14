import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
    title: z.string().min(3).optional(),
    content: z.string().optional(),
    color: z.string().optional(),
})

export async function GET (request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const [note] = await query(`
            SELECT 
                n.*,
                json_agg(ci.*) FILTER (WHERE ci.id IS NOT NULL) as items,
                json_agg(nt.text) FILTER (WHERE nt.id IS NOT NULL) as tags
            FROM notes n
            LEFT JOIN checklist_items ci ON n.id = ci.note_id
            LEFT JOIN note_tags nt ON n.id = nt.note_id
            WHERE n.id = $1
            GROUP BY n.id`, [id]);
        if (!note) {
            return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
        }
        return NextResponse.json(note);
    }catch {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PATCH (request: Request, { params }: {params: Promise<{ id: string }> }) {
    try {
        const body = await request.json();
        const result = updateSchema.safeParse(body);
        if(!result.success) {
            return NextResponse.json({ errors: result.error.issues }, { status: 400 });
        }
        const { title, content, color } = result.data;
        const { id } = await params;
        const [note] = await query(
            'UPDATE notes SET title = COALESCE($1, title), content = COALESCE($2, content), color = COALESCE($3, color) WHERE id = $4 RETURNING *',
            [title, content, color, id]
        );
        if(!note) {
            return NextResponse.json({ error: 'Nota no encontrada' }, { status: 400 });
        }
        return NextResponse.json(note);
    } catch (error) {
        console.error('Error updating note', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await query('DELETE FROM notes WHERE id = $1', [id]);
        return new NextResponse(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}