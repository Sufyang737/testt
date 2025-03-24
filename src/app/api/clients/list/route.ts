import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);
pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN || '');

export async function GET() {
  try {
    const clients = await pb.collection('clients').getList(1, 50, {
      sort: '-created'
    });

    return NextResponse.json({
      success: true,
      data: clients.items
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    );
  }
} 