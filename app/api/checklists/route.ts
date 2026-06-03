import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { verifyToken, unauthorized } from '@/lib/auth';

const checklistSchema = z.object({
    title: z.string().min(3),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    archived: z.boolean().optional(),
    deadline: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const auth = await verifyToken(request);
    if(!auth){
        return unauthorized();
    }
    try {
        const checklists = await query(`
            SELECT
                n.*,
                json_agg(ci.* ORDER BY ci.id) FILTER (WHERE ci.id IS NOT NULL) as items
            FROM notes n
            LEFT JOIN checklist_items ci ON n.id = ci.note_id
            WHERE n.type = 'checklist'
            GROUP BY n.id
            ORDER BY n.created_at DESC
            `);
            return NextResponse.json(checklists);
    } catch(error) {
        console.error('GET checklists error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await verifyToken(request);
    if(!auth){
        return unauthorized();
    }
    try {
        const body = await request.json();
        const result = checklistSchema.safeParse(body);
        if(!result.success) {
            return NextResponse.json({ errors: result.error.issues }, { status: 400 });
        }
        const { title, priority, archived, deadline } = result.data;
        const [checklist] = await query(
            'INSERT INTO notes (title, type, priority, archived, deadline) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, 'checklist', priority ?? null, archived ?? false, deadline ?? null]
        );
        return NextResponse.json(checklist, { status: 201 });
    } catch (error) {
        console.error('POST checklist error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}