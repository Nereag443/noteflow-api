import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthPayload{
    userId: string;
    email: string;
}

export function verifyToken(request: NextRequest): AuthPayload | null {
    const authHeader = request.headers.get('Authorization');
    if(!authHeader  || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
        return payload;
    } catch{
        return null;
    }
}

export function unauthorized(){
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}