import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { verifyToken, unauthorized } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> }

const updateSchema = z.object({
    title: z.string().min(3).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    archived: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await verifyToken(request);
    if (!auth){
        return unauthorized();
    }
    try {
        const { id } = await params;
        const [checklist] = await query(`
            SELECT 
                n.*,
                json_agg(ci.* ORDER BY ci.id) FILTER (WHERE ci.id IS NOT NULL) as items
            FROM notes n
            LEFT JOIN checklist_items ci ON n.id = ci.note_id
            WHERE n.id = $1 AND n.type = 'checklist'
            GROUP BY n.id`, [id]);
        if (!checklist) {
            return NextResponse.json({ error: 'Checklist no encontrada' }, { status: 404 });
        }
        return NextResponse.json(checklist);
    } catch (error) {
        console.error('GET checklist error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await verifyToken(request);
    if (!auth){
        return unauthorized();
    }
    try {
        const { id } = await params;
        const body = await request.json();
        const result = updateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ errors: result.error.issues }, { status: 400 });
        }
        const { title, priority, archived } = result.data;
        const [checklist] = await query(
            `UPDATE notes 
             SET title = COALESCE($1, title),
                 priority = COALESCE($2, priority),
                 archived = CASE WHEN $3::boolean IS NOT NULL THEN $3::boolean ELSE archived END,
                 updated_at = NOW()
             WHERE id = $4 AND type = 'checklist' RETURNING *`,
            [title ?? null, priority ?? null, archived ?? null, id]
        );
        if (!checklist) {
            return NextResponse.json({ error: 'Checklist no encontrada' }, { status: 404 });
        }
        return NextResponse.json(checklist);
    } catch (error) {
        console.error('PATCH checklist error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const auth = await verifyToken(request);
    if (!auth){
        return unauthorized();
    }

    try {
        const { id } = await params;
        await query('DELETE FROM notes WHERE id = $1 AND type = $2', [id, 'checklist']);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('DELETE checklist error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}