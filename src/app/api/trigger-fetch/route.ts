
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

    // Log the data received from the client app
    console.log('Received data for trigger fetch:', {
      email,
      unmetGoals,
    });
    
    // --- Example of fetching data from another service ---
    console.log('Now, fetching external data as an example...');
    try {
      // We are using a sample API (JSONPlaceholder) for demonstration.
      // You can replace this URL with any other API endpoint you need to call.
      const externalResponse = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      if (!externalResponse.ok) {
        // Handle cases where the external API returns an error
        throw new Error(`External fetch failed with status: ${externalResponse.status}`);
      }
      const externalData = await externalResponse.json();
      console.log('Successfully fetched external data:', externalData);
      
      // You could now use this `externalData` along with the user's `unmetGoals`
      // to perform some action, like sending a more detailed email or notification.

    } catch (fetchError) {
      console.error('Error during external fetch:', fetchError);
      // Depending on your needs, you might want to return an error here
      // or just log it and continue.
    }
    // --- End of example ---


    return NextResponse.json({ 
      success: true, 
      message: 'Data received and an example external fetch was triggered successfully.' 
    });

  } catch (error) {
    console.error('Error in /api/trigger-fetch:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
