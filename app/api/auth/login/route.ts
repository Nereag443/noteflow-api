import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es obligatori'),
})

export async function POST(request: Request) {
    try{
        const body = await request.json();
        const result = loginSchema.safeParse(body);
        if(!result.success){
            return NextResponse.json({ erorrs: result.error.issues }, { status: 400 });
        }
        const { email, password } = result.data;
        const [user] = await query<{ id: string; email: string; password: string }>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if(!user){
            return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401});
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: '7d'}
        );
        return NextResponse.json({ token, email: user.email });
    } catch(error){
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}