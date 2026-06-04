import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { verifyToken, unauthorized } from '@/lib/auth';

const noteSchema = z.object({
    title: z.string().min(3),
    type: z.enum(['note', 'checklist', 'idea']),
    content: z.string().optional(),
    color: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    archived: z.boolean().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    location_name: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const auth = await verifyToken(request);
    if(!auth){
        return unauthorized();
    }
    try {
        const notes = await query(`
            SELECT 
                n.*,
                json_agg(ci.*) FILTER (WHERE ci.id IS NOT NULL) as items,
                json_agg(nt.text) FILTER (WHERE nt.id IS NOT NULL) as tags
            FROM notes n
            LEFT JOIN checklist_items ci ON n.id = ci.note_id
            LEFT JOIN note_tags nt ON n.id = nt.note_id
            GROUP BY n.id
            ORDER BY n.created_at DESC`);
        return NextResponse.json(notes);
    } catch(error) {
        console.error(error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500});
    }
}

export async function POST(request: NextRequest) {
    const auth = await verifyToken(request);
    if(!auth){
        return unauthorized();
    }
    try {
        const body = await request.json();
        const result = noteSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ errors: result.error.issues }, { status: 400 });
        }
        const { title, type, content, color, priority, archived, latitude, longitude, location_name } = result.data;
        const [note] = await query(
            'INSERT INTO notes (title, type, content, color, priority, archived, latitude, longitude, location_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [title, type, content, color, priority ?? null, archived ?? false, latitude ?? null, longitude ?? null, location_name ?? null]
        );
        return NextResponse.json(note, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}