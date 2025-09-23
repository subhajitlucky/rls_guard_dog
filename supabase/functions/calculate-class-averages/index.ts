import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClassAverage {
  school_id: string
  school_name: string
  subject: string
  grade: string
  teacher_name: string
  average_score: number
  total_students: number
  total_progress_records: number
  calculated_at: string
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

    // Get all progress records with related data
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select(`
        id,
        student_id,
        classroom_id,
        school_id,
        subject,
        score,
        max_score,
        created_at,
        students:profiles!progress_student_id_fkey(
          id,
          full_name,
          grade
        ),
        classrooms:classrooms!progress_classroom_id_fkey(
          id,
          name,
          teacher:profiles!classrooms_teacher_id_fkey(
            id,
            full_name
          )
        ),
        schools:schools!progress_school_id_fkey(
          id,
          name
        )
      `)

    if (progressError) {
      console.error('❌ Error fetching progress data:', progressError)
      throw progressError
    }

    console.log(`📊 Found ${progressData?.length || 0} progress records`)

    if (!progressData || progressData.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No progress data found',
          calculated_averages: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Group progress by school, subject, and grade
    const groupedData: { [key: string]: any[] } = {}

    progressData.forEach(record => {
      const schoolId = record.school_id
      const schoolName = record.schools?.name || 'Unknown School'
      const subject = record.subject
      const grade = record.students?.grade || 'Unknown'
      const teacherName = record.classrooms?.teacher?.full_name || 'Unknown Teacher'

      const key = `${schoolId}-${subject}-${grade}`

      if (!groupedData[key]) {
        groupedData[key] = []
      }

      groupedData[key].push({
        ...record,
        school_name: schoolName,
        student_grade: grade,
        teacher_name: teacherName
      })
    })

    // Calculate averages for each group
    const classAverages: ClassAverage[] = []

    Object.entries(groupedData).forEach(([key, records]) => {
      const firstRecord = records[0]
      
      // Calculate percentage scores
      const percentageScores = records.map(r => (r.score / r.max_score) * 100)
      const averageScore = percentageScores.reduce((sum, score) => sum + score, 0) / percentageScores.length
      
      // Get unique students
      const uniqueStudents = new Set(records.map(r => r.student_id))

      const classAverage: ClassAverage = {
        school_id: firstRecord.school_id,
        school_name: firstRecord.school_name,
        subject: firstRecord.subject,
        grade: firstRecord.student_grade,
        teacher_name: firstRecord.teacher_name,
        average_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
        total_students: uniqueStudents.size,
        total_progress_records: records.length,
        calculated_at: new Date().toISOString()
      }

      classAverages.push(classAverage)
    })

    console.log(`📈 Calculated ${classAverages.length} class averages`)

    // Connect to MongoDB and save the averages
    const mongoUrl = Deno.env.get('MONGODB_URI')
    if (!mongoUrl) {
      throw new Error('MONGODB_URI environment variable not set')
    }

    const client = new MongoClient()
    await client.connect(mongoUrl)
    
    const db = client.database('rls_guard_dog')
    const collection = db.collection('class_averages')

    console.log('💾 Saving to MongoDB...')

    // Clear old data and insert new averages
    await collection.deleteMany({})
    
    if (classAverages.length > 0) {
      await collection.insertMany(classAverages)
    }

    await client.close()

    console.log('✅ Successfully saved class averages to MongoDB')

    // Return summary
    const response = {
      success: true,
      message: 'Class averages calculated and saved successfully',
      calculated_averages: classAverages.length,
      total_progress_records: progressData.length,
      summary: classAverages.map(avg => ({
        school: avg.school_name,
        subject: avg.subject,
        grade: avg.grade,
        teacher: avg.teacher_name,
        average: `${avg.average_score}%`,
        students: avg.total_students,
        records: avg.total_progress_records
      })),
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
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

/* To deploy this function to Supabase:

1. Install Supabase CLI:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref YOUR_PROJECT_REF

4. Deploy the function:
   supabase functions deploy calculate-class-averages

5. Set environment variables in Supabase dashboard:
   - MONGODB_URI: Your MongoDB Atlas connection string
   - Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

6. Test the function:
   curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-class-averages" \
   -H "Authorization: Bearer YOUR_ANON_KEY"

This function will:
- Fetch all progress records from Supabase
- Calculate class averages by school, subject, and grade
- Save the results to MongoDB Atlas
- Return a summary of the calculations
*/