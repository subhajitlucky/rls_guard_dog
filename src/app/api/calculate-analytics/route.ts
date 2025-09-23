import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Get Supabase project details
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Extract project ref from Supabase URL
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    
    // Construct Edge Function URL
    const edgeFunctionUrl = `https://${projectRef}.supabase.co/functions/v1/calculate-analytics`

    console.log('🔗 Calling Edge Function:', edgeFunctionUrl)

    // Call the Supabase Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Edge Function error:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: `Edge Function failed: ${response.status}`,
          details: errorText,
          troubleshooting: {
            function_url: edgeFunctionUrl,
            status: response.status,
            suggestion: response.status === 404 
              ? 'Edge Function not deployed. Run: supabase functions deploy calculate-analytics'
              : response.status === 500
              ? 'Check MongoDB URI and Edge Function logs in Supabase dashboard'
              : 'Check Supabase configuration and function deployment'
          }
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('✅ Edge Function success:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ API Route error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to call Edge Function',
        details: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: {
          common_issues: [
            'Edge Function not deployed to Supabase',
            'MongoDB URI not configured in Supabase environment variables',
            'Supabase project URL or API key incorrect',
            'Network connectivity issues'
          ],
          deployment_guide: 'See README.md for setup instructions'
        }
      },
      { status: 500 }
    )
  }
}