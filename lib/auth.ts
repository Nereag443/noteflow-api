import { NextRequest, NextResponse } from 'next/server';
import admin from './firebase-admin';

export interface AuthPayload{
    userId: string;
    email: string;
}

export async function verifyToken(request: NextRequest): Promise<AuthPayload | null> {
    const authHeader = request.headers.get('Authorization');
    if(!authHeader  || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try{
        const decoded = await admin.auth().verifyIdToken(token);
        return { userId: decoded.uid, email: decoded.email ?? ''};
    } catch{
        return null;
    }
}

export function unauthorized(){
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}