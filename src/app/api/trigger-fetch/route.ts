
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, unmetGoals } = body;

    if (!email || !unmetGoals) {
      return NextResponse.json(
        { success: false, message: 'Missing email or unmetGoals' },
        { status: 400 }
      );
    }

    // For now, we'll just log the data on the server side.
    console.log('Received data for trigger fetch:', {
      email,
      unmetGoals,
    });

    return NextResponse.json({ success: true, message: 'Data received successfully for trigger-fetch' });
  } catch (error) {
    console.error('Error in /api/trigger-fetch:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
