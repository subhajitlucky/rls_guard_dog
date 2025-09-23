import { createClient } from '@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const mongodbUri = Deno.env.get('MONGODB_URI')!

import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts"

// Types for our analytics data
interface ClassAverage {
  classroom_id: string
  classroom_name: string
  school_id: string
  school_name: string
  teacher_id: string
  teacher_name: string
  subject: string
  average_score: number
  total_students: number
  last_updated: string
  scores_distribution: {
    excellent: number // 90-100
    good: number      // 80-89
    satisfactory: number // 70-79
    needs_improvement: number // Below 70
  }
}

interface SchoolAnalytics {
  school_id: string
  school_name: string
  total_students: number
  total_teachers: number
  total_classrooms: number
  overall_average: number
  subject_averages: Array<{
    subject: string
    average: number
    student_count: number
  }>
  grade_averages: Array<{
    grade: string
    average: number
    student_count: number
  }>
  last_updated: string
}

Deno.serve(async (_req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize MongoDB client
    const client = new MongoClient()
    await client.connect(mongodbUri)
    const db = client.database("rls_guard_dog")

    // Get all progress data with related information
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select(`
        *,
        classrooms (
          id,
          name,
          subject,
          teacher_id,
          school_id,
          profiles!classrooms_teacher_id_fkey (
            full_name
          ),
          schools (
            id,
            name
          )
        ),
        profiles!progress_student_id_fkey (
          full_name,
          grade
        )
      `)

    if (progressError) {
      throw new Error(`Error fetching progress data: ${progressError.message}`)
    }

    // Calculate class averages
    const classAverages = new Map<string, ClassAverage>()
    const schoolStats = new Map<string, any>()

    for (const progress of progressData) {
      const classroom = progress.classrooms
      if (!classroom) continue

      const classroomId = classroom.id
      
      if (!classAverages.has(classroomId)) {
        classAverages.set(classroomId, {
          classroom_id: classroomId,
          classroom_name: classroom.name,
          school_id: classroom.school_id,
          school_name: classroom.schools?.name || 'Unknown',
          teacher_id: classroom.teacher_id,
          teacher_name: classroom.profiles?.full_name || 'Unknown',
          subject: classroom.subject,
          average_score: 0,
          total_students: 0,
          last_updated: new Date().toISOString(),
          scores_distribution: {
            excellent: 0,
            good: 0,
            satisfactory: 0,
            needs_improvement: 0
          }
        })
      }

      const classAvg = classAverages.get(classroomId)!
      classAvg.total_students++
      classAvg.average_score += progress.score

      // Update score distribution
      if (progress.score >= 90) {
        classAvg.scores_distribution.excellent++
      } else if (progress.score >= 80) {
        classAvg.scores_distribution.good++
      } else if (progress.score >= 70) {
        classAvg.scores_distribution.satisfactory++
      } else {
        classAvg.scores_distribution.needs_improvement++
      }

      // Track school statistics
      const schoolId = classroom.school_id
      if (!schoolStats.has(schoolId)) {
        schoolStats.set(schoolId, {
          school_id: schoolId,
          school_name: classroom.schools?.name || 'Unknown',
          students: new Set(),
          teachers: new Set(),
          classrooms: new Set(),
          totalScore: 0,
          totalRecords: 0,
          subjects: new Map(),
          grades: new Map()
        })
      }

      const school = schoolStats.get(schoolId)!
      school.students.add(progress.student_id)
      school.teachers.add(classroom.teacher_id)
      school.classrooms.add(classroomId)
      school.totalScore += progress.score
      school.totalRecords++

      // Track by subject
      if (!school.subjects.has(classroom.subject)) {
        school.subjects.set(classroom.subject, { total: 0, count: 0 })
      }
      const subjectStats = school.subjects.get(classroom.subject)!
      subjectStats.total += progress.score
      subjectStats.count++

      // Track by grade (from student profile)
      const studentGrade = progress.profiles?.grade
      if (studentGrade) {
        if (!school.grades.has(studentGrade)) {
          school.grades.set(studentGrade, { total: 0, count: 0 })
        }
        const gradeStats = school.grades.get(studentGrade)!
        gradeStats.total += progress.score
        gradeStats.count++
      }
    }

    // Finalize class averages
    for (const [_, classAvg] of classAverages) {
      if (classAvg.total_students > 0) {
        classAvg.average_score = Math.round((classAvg.average_score / classAvg.total_students) * 100) / 100
      }
    }

    // Prepare school analytics
    const schoolAnalytics: SchoolAnalytics[] = []
    for (const [_, school] of schoolStats) {
      const analytics: SchoolAnalytics = {
        school_id: school.school_id,
        school_name: school.school_name,
        total_students: school.students.size,
        total_teachers: school.teachers.size,
        total_classrooms: school.classrooms.size,
        overall_average: school.totalRecords > 0 ? 
          Math.round((school.totalScore / school.totalRecords) * 100) / 100 : 0,
        subject_averages: Array.from(school.subjects.entries() as Iterable<[string, { total: number; count: number }]>).map(([subject, stats]) => ({
          subject,
          average: Math.round((stats.total / stats.count) * 100) / 100,
          student_count: stats.count
        })),
        grade_averages: Array.from(school.grades.entries() as Iterable<[string, { total: number; count: number }]>).map(([grade, stats]) => ({
          grade,
          average: Math.round((stats.total / stats.count) * 100) / 100,
          student_count: stats.count
        })),
        last_updated: new Date().toISOString()
      }
      schoolAnalytics.push(analytics)
    }

    // Store in MongoDB
    const classAveragesCollection = db.collection("class_averages")
    const schoolAnalyticsCollection = db.collection("school_analytics")

    // Clear existing data and insert new
    await classAveragesCollection.deleteMany({})
    await schoolAnalyticsCollection.deleteMany({})

    if (classAverages.size > 0) {
      await classAveragesCollection.insertMany(Array.from(classAverages.values()))
    }
    
    if (schoolAnalytics.length > 0) {
      await schoolAnalyticsCollection.insertMany(schoolAnalytics)
    }

    await client.close()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Analytics calculated and stored successfully',
        data: {
          classAveragesCalculated: classAverages.size,
          schoolAnalyticsCalculated: schoolAnalytics.length,
          totalProgressRecords: progressData.length
        }
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Analytics calculation error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})