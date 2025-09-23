import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🚀 Starting class averages calculation...')

    // Get all progress records
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select('*')

    if (progressError) {
      console.error('❌ Error fetching progress data:', progressError)
      throw progressError
    }

    console.log(`📊 Found ${progressData?.length || 0} progress records`)

    if (!progressData || progressData.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No progress data found to calculate averages',
          calculated_averages: 0,
          total_progress_records: 0,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Group progress by classroom (simplest approach)
    const classroomGroups: { [key: string]: any[] } = {}

    for (const record of progressData) {
      const classroomId = record.classroom_id
      if (!classroomGroups[classroomId]) {
        classroomGroups[classroomId] = []
      }
      classroomGroups[classroomId].push(record)
    }

    // Calculate averages for each classroom
    const classAverages = []

    for (const [classroomId, records] of Object.entries(classroomGroups)) {
      const totalScore = records.reduce((sum, r) => sum + (r.score / r.max_score), 0)
      const averageScore = (totalScore / records.length) * 100

      // Get classroom and school info
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('name, subject, school_id, teacher_id')
        .eq('id', classroomId)
        .single()

      let schoolName = 'Unknown School'
      let teacherName = 'Unknown Teacher'

      if (classroom) {
        const { data: school } = await supabase
          .from('schools')
          .select('name')
          .eq('id', classroom.school_id)
          .single()

        const { data: teacher } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', classroom.teacher_id)
          .single()

        if (school) schoolName = school.name
        if (teacher) teacherName = teacher.full_name
      }

      classAverages.push({
        classroom_id: classroomId,
        classroom_name: classroom?.name || 'Unknown Classroom',
        subject: classroom?.subject || 'Unknown Subject',
        school_name: schoolName,
        teacher_name: teacherName,
        average_score: Math.round(averageScore * 100) / 100,
        total_records: records.length,
        calculated_at: new Date().toISOString()
      })
    }

    console.log(`📈 Calculated ${classAverages.length} class averages`)

    // Try to save to MongoDB (if configured) - Enhanced for Deno compatibility
    let mongoSuccess = false
    try {
      const mongoUrl = Deno.env.get('MONGODB_URI')
      if (mongoUrl) {
        console.log('🍃 Attempting MongoDB save with enhanced Deno compatibility...')

        // Use different import approach for better Deno compatibility
        const { MongoClient } = await import("https://deno.land/x/mongo@v0.32.0/mod.ts")

        // Create client with Deno-compatible options
        const client = new MongoClient(mongoUrl, {
          // Explicitly enable TLS (required for MongoDB Atlas)
          tls: true,
          // Relax SSL validation for Deno compatibility
          tlsAllowInvalidCertificates: true,
          tlsAllowInvalidHostnames: true,
          // Connection timeouts
          connectTimeoutMS: 15000,
          serverSelectionTimeoutMS: 15000,
        })

        console.log('🔌 Connecting to MongoDB...')
        await client.connect()
        console.log('✅ MongoDB connection established')

        const db = client.database('rls_guard_dog')
        console.log('📊 Using database:', db.name)

        const collection = db.collection('class_averages')
        console.log('📋 Using collection: class_averages')

        // Clear old data
        console.log('🧹 Clearing old data...')
        const deleteResult = await collection.deleteMany({})
        console.log(`Deleted ${deleteResult.deletedCount} old records`)

        // Insert new data
        if (classAverages.length > 0) {
          console.log(`💾 Inserting ${classAverages.length} new records...`)
          const insertResult = await collection.insertMany(classAverages)
          console.log(`✅ Successfully inserted ${insertResult.insertedCount} records`)
        } else {
          console.log('⚠️ No data to insert')
        }

        await client.close()
        console.log('🔌 MongoDB connection closed')

        mongoSuccess = true
        console.log('🎉 MongoDB save completed successfully!')
      } else {
        console.log('⚠️ MONGODB_URI not configured - skipping MongoDB save')
      }
    } catch (mongoError) {
      console.error('❌ MongoDB save failed with error:', mongoError.message)
      console.error('Error details:', mongoError)

      // Try alternative approach - maybe the issue is with SSL
      try {
        console.log('🔄 Attempting fallback without SSL...')
        const mongoUrl = Deno.env.get('MONGODB_URI')
        if (mongoUrl) {
          const { MongoClient } = await import("https://deno.land/x/mongo@v0.32.0/mod.ts")

          // Try with minimal options
          const client = new MongoClient(mongoUrl)
          await client.connect()

          const db = client.database('rls_guard_dog')
          const collection = db.collection('class_averages')

          await collection.insertOne({
            fallback_test: true,
            averages: classAverages,
            timestamp: new Date().toISOString()
          })

          await client.close()
          mongoSuccess = true
          console.log('✅ Fallback save successful!')
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message)
      }
    }

    // Return success response
    const response = {
      success: true,
      message: 'Class averages calculated successfully',
      calculated_averages: classAverages.length,
      total_progress_records: progressData.length,
      mongodb_saved: mongoSuccess,
      averages: classAverages,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in Edge Function:', error)

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
