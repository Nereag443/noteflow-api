import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import { verifyToken, unauthorized } from '@/lib/auth';

const ideaSchema = z.object ({
    title: z.string().min(3),
    color: z.string().optional(),
    archived: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    location_name: z.string().optional(),
})

interface NoteRow {
    id: string;
    title: string;
    type: string;
    color: string | null;
    archived: boolean;
    created_at: string;
    updated_at: string;
}

export async function GET(request: NextRequest) {
    const auth = await verifyToken(request);
    if(!auth){
        return unauthorized();
    }
    try {
        const ideas = await query(`
            SELECT
                n.*,
                json_agg(nt.text) FILTER (WHERE nt.id IS NOT NULL) as tags
            FROM notes n
            LEFT JOIN note_tags nt ON n.id = nt.note_id
            WHERE n.type = 'idea'
            GROUP BY n.id
            ORDER BY n.created_at DESC
            `);
        return NextResponse.json(ideas);
    } catch (error) {
        console.error('GET ideas error:', error);
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
        const result = ideaSchema.safeParse(body);
        if(!result.success) {
            return NextResponse.json({ errors: result.error.issues }, { status: 400 });
        }
        const { title, color, archived, tags, latitude, longitude, location_name } = result.data;
        const [idea] = await query<NoteRow>(
            'INSERT INTO notes (title, type, color, archived, latitude, longitude, location_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, 'idea', color ?? null, archived ?? false, latitude ?? null, longitude ?? null, location_name ?? null]
        );
        if(tags && tags.length > 0) {
            await Promise.all(tags.map((tag) =>
                query('INSERT INTO note_tags (note_id, text) VALUES ($1, $2)', [idea.id, tag])
            ));
        }
        return NextResponse.json({ ...idea, tags: tags ?? [] }, { status: 201 });
    } catch(error) {
        console.error('POST idea error;', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}