'use client'

import React from 'react'

interface InputFieldProps {
  id: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  className?: string
  placeholder?: string
}

export function InputField({ 
  id, 
  type, 
  value, 
  onChange, 
  required = false, 
  className = '',
  placeholder 
}: InputFieldProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
    />
  )
}

interface FormButtonProps {
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function FormButton({ 
  type = 'button', 
  children, 
  onClick, 
  disabled = false,
  className = ''
}: FormButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}