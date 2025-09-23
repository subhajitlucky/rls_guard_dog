'use client'

import { useEffect, useState } from 'react'
import { authClient } from './auth'
import { Profile } from './types'

// Simple auth state hook
export function useAuth() {
  const [user, setUser] = useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.user) {
          setUser(session.user)
          
          // Try to get profile, but don't fail if it has issues
          try {
            const profile = await authClient.getProfile()
            setProfile(profile)
          } catch (profileError) {
            console.warn('Could not load profile on initial session:', profileError)
            // Create a minimal profile from user data
            setProfile({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              role: session.user.user_metadata?.role || 'student',
              school_id: null,
              grade: null,
              subjects: null,
              created_at: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()
  }, [])

  // Login function
  const signIn = async (email: string, password: string) => {
    const { user } = await authClient.signIn(email, password)
    setUser(user)
    const profile = await authClient.getProfile()
    setProfile(profile)
    return { user, profile }
  }

  // Signup function
  const signUp = async (userData: Parameters<typeof authClient.signUp>[0]) => {
    const result = await authClient.signUp(userData)
    setUser(result.user)
    
    // Try to get profile, but don't fail signup if it fails
    try {
      const profile = await authClient.getProfile()
      setProfile(profile)
    } catch (error) {
      console.warn('Could not fetch profile after signup:', error)
      // Set basic profile info from signup data
      setProfile({
        id: result.user.id,
        role: userData.role,
        full_name: userData.fullName,
        email: userData.email,
        school_id: null, // Will be set later
        grade: userData.grade || null,
        subjects: userData.subjects || null,
        created_at: new Date().toISOString()
      })
    }
    
    return result
  }

  // Logout function
  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
    setProfile(null)
  }

  // Role checking helpers
  const isStudent = profile?.role === 'student'
  const isTeacher = profile?.role === 'teacher'
  const isHeadTeacher = profile?.role === 'head_teacher'
  const canAccessTeacher = isTeacher || isHeadTeacher

  return {
    // State
    user,
    profile,
    loading,
    
    // Auth functions
    signIn,
    signUp,
    signOut,
    
    // Role helpers
    isStudent,
    isTeacher,
    isHeadTeacher,
    canAccessTeacher,
    
    // Computed values
    isAuthenticated: !!user,
    displayName: profile?.full_name || user?.email || 'User'
  }
}

// Role checking utility functions
export const authUtils = {
  hasRole(profile: Profile | null, role: string | string[]) {
    if (!profile) return false
    if (Array.isArray(role)) {
      return role.includes(profile.role)
    }
    return profile.role === role
  },

  canAccessTeacher(profile: Profile | null) {
    return this.hasRole(profile, ['teacher', 'head_teacher'])
  }
}