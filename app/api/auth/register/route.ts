import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { z } from 'zod';
import bcrypt from "bcryptjs";
import { hash } from "crypto";

const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function POST(request: Request) {
    try{
        const body = await request.json();
        const result = registerSchema.safeParse(body);
        if(!result.success){
            return NextResponse.json({ errors: result.error.issues }, { status: 400 });
        }
        const { email, password } = result.data;
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if(existing.length >0){
            return NextResponse.json({ error: 'El emal ya está registrado' }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [user] = await query<{ id: string; email: string; created_at: string }>(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, hashedPassword]
        )
        return NextResponse.json(user, { status: 201 });
    } catch(error){
        console.error('Register error: ', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}