import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { verifyToken, unauthorized } from '@/lib/auth';

interface NoteRow {
    id: string;
    title: string;
    type: string;
    color: string | null;
    archived: boolean;
    created_at: string;
    updated_at: string;
}

type Params = { params: Promise<{ id: string }> }

const updateSchema = z.object({
    title: z.string().min(3).optional(),
    color: z.string().optional(),
    archived: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: Params) {
    const auth = verifyToken(request);
    if (!auth){
        return unauthorized();
    }
    try {
        const { id } = await params;
        const [idea] = await query(`
            SELECT 
                n.*,
                json_agg(nt.text) FILTER (WHERE nt.id IS NOT NULL) as tags
            FROM notes n
            LEFT JOIN note_tags nt ON n.id = nt.note_id
            WHERE n.id = $1 AND n.type = 'idea'
            GROUP BY n.id`, [id]);
        if (!idea) {
            return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });
        }
        return NextResponse.json(idea);
    } catch (error) {
        console.error('GET idea error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = verifyToken(request);
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
        const { title, color, archived } = result.data;
        const [idea] = await query<NoteRow>(
            `UPDATE notes 
             SET title = COALESCE($1, title),
                 color = COALESCE($2, color),
                 archived = CASE WHEN $3::boolean IS NOT NULL THEN $3::boolean ELSE archived END,
                 updated_at = NOW()
             WHERE id = $4 AND type = 'idea' RETURNING *`,
            [title ?? null, color ?? null, archived ?? null, id]
        );
        if (!idea) {
            return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });
        }
        return NextResponse.json(idea);
    } catch (error) {
        console.error('PATCH idea error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const auth = verifyToken(request);
    if (!auth){
        return unauthorized();
    }
    try {
        const { id } = await params;
        await query('DELETE FROM notes WHERE id = $1 AND type = $2', [id, 'idea']);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('DELETE idea error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}