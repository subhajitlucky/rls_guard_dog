'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ProgressData {
  id: string
  student_id: string
  classroom_id: string
  school_id: string
  subject: string
  score: number
  max_score: number
  created_at: string
  profiles?: {
    full_name: string
  }
  classrooms?: {
    name: string
    subject: string
  }
}

interface UseRealtimeProgressOptions {
  schoolId?: string
  teacherId?: string
  studentId?: string
  classroomId?: string
}

export function useRealtimeProgress(options: UseRealtimeProgressOptions = {}) {
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Memoize options to prevent unnecessary re-renders
  const { schoolId, teacherId, studentId, classroomId } = options

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('progress')
          .select(`
            *,
            profiles!progress_student_id_fkey (
              full_name
            ),
            classrooms (
              name,
              subject,
              teacher_id
            )
          `)

        // Apply filters based on user role and options
        if (schoolId) {
          query = query.eq('school_id', schoolId)
        }

        if (studentId) {
          query = query.eq('student_id', studentId)
        }

        if (classroomId) {
          query = query.eq('classroom_id', classroomId)
        }

        if (teacherId) {
          query = query.eq('classrooms.teacher_id', teacherId)
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setProgressData(data || [])
        setConnectionStatus('connected')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch progress data')
        setConnectionStatus('disconnected')
      } finally {
        setLoading(false)
      }
    }

    const setupRealtimeSubscription = () => {
      try {
        // Create a channel for progress updates
        const channel = supabase.channel('progress_changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'progress',
              ...(schoolId && { filter: `school_id=eq.${schoolId}` })
            },
            async (payload) => {
              console.log('Real-time progress update:', payload)

              if (payload.eventType === 'INSERT') {
                // Fetch the complete record with relations
                const { data: newRecord } = await supabase
                  .from('progress')
                  .select(`
                    *,
                    profiles!progress_student_id_fkey (
                      full_name
                    ),
                    classrooms (
                      name,
                      subject,
                      teacher_id
                    )
                  `)
                  .eq('id', payload.new.id)
                  .single()

                if (newRecord) {
                  // Check if this record should be included based on filters
                  let shouldInclude = true

                  if (studentId && newRecord.student_id !== studentId) {
                    shouldInclude = false
                  }

                  if (classroomId && newRecord.classroom_id !== classroomId) {
                    shouldInclude = false
                  }

                  if (teacherId && newRecord.classrooms?.teacher_id !== teacherId) {
                    shouldInclude = false
                  }

                  if (shouldInclude) {
                    setProgressData(prev => [newRecord, ...prev])
                  }
                }
              } else if (payload.eventType === 'UPDATE') {
                // Update existing record
                setProgressData(prev => 
                  prev.map(item => 
                    item.id === payload.new.id 
                      ? { ...item, ...payload.new }
                      : item
                  )
                )
              } else if (payload.eventType === 'DELETE') {
                // Remove deleted record
                setProgressData(prev => 
                  prev.filter(item => item.id !== payload.old.id)
                )
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status)
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected')
            } else if (status === 'CHANNEL_ERROR') {
              setConnectionStatus('disconnected')
              setError('Real-time connection failed')
            }
          })

        subscription = channel
      } catch (err) {
        console.error('Failed to setup real-time subscription:', err)
        setError('Failed to setup real-time updates')
        setConnectionStatus('disconnected')
      }
    }

    // Initialize
    fetchInitialData().then(() => {
      setupRealtimeSubscription()
    })

    // Cleanup function
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [schoolId, teacherId, studentId, classroomId])

  // Manual refresh function
  const refresh = async () => {
    setLoading(true)
    // Re-trigger the effect by updating a dummy state
    // In practice, you'd call fetchInitialData here
  }

  return {
    progressData,
    loading,
    error,
    connectionStatus,
    refresh
  }
}

export type { ProgressData, UseRealtimeProgressOptions }