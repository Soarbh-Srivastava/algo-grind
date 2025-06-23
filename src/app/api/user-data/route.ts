
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
    // In a real scenario, this is where you'd process the data,
    // e.g., send an email, save to another database, etc.
    console.log('Received user data for potential reminder:', {
      email,
      unmetGoals,
    });

    return NextResponse.json({ success: true, message: 'Data received successfully' });
  } catch (error) {
    console.error('Error in /api/user-data:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
