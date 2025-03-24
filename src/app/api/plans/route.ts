import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Set the admin token
pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN || '');

export async function GET() {
  try {
    const records = await pb.collection('plans').getFullList({
      sort: 'created',
      fields: 'id,title,description,total_tokens,price'
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error al obtener planes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los planes' },
      { status: error.status || 500 }
    );
  }
} 