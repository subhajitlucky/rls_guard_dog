// Form validation utilities and types

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string | number | boolean | null | undefined) => string | null
  email?: boolean
  number?: boolean
  min?: number
  max?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface FormField {
  name: string
  rules: ValidationRule
  errorMessage?: string
}

export class FormValidator {
  private fields: Record<string, ValidationRule> = {}

  addField(name: string, rules: ValidationRule) {
    this.fields[name] = rules
    return this
  }

  validate(data: Record<string, string | number | boolean | null | undefined>): ValidationResult {
    const errors: Record<string, string> = {}

    for (const [fieldName, rules] of Object.entries(this.fields)) {
      const value = data[fieldName]
      const error = this.validateField(value, rules, fieldName)
      
      if (error) {
        errors[fieldName] = error
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  validateField(value: string | number | boolean | null | undefined, rules: ValidationRule, fieldName: string): string | null {
    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      return `${this.formatFieldName(fieldName)} is required`
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null
    }

    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (typeof value !== 'string' || !emailRegex.test(value)) {
        return `${this.formatFieldName(fieldName)} must be a valid email address`
      }
    }

    // Number validation
    if (rules.number && value !== undefined && value !== null && value !== '') {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return `${this.formatFieldName(fieldName)} must be a valid number`
      }
      
      if (rules.min !== undefined && numValue < rules.min) {
        return `${this.formatFieldName(fieldName)} must be at least ${rules.min}`
      }
      
      if (rules.max !== undefined && numValue > rules.max) {
        return `${this.formatFieldName(fieldName)} must be at most ${rules.max}`
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `${this.formatFieldName(fieldName)} must be at least ${rules.minLength} characters long`
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `${this.formatFieldName(fieldName)} must be at most ${rules.maxLength} characters long`
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return `${this.formatFieldName(fieldName)} format is invalid`
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        return customError
      }
    }

    return null
  }

  private formatFieldName(fieldName: string): string {
    // Convert camelCase or snake_case to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
}

// Predefined validation rules for common use cases
export const commonValidationRules = {
  email: { required: true, email: true },
  password: { required: true, minLength: 8 },
  fullName: { required: true, minLength: 2, maxLength: 100 },
  score: { required: true, number: true, min: 0, max: 100 },
  grade: { required: true, pattern: /^(9th|10th|11th|12th)$/ },
  role: { required: true, pattern: /^(student|teacher|head_teacher)$/ },
  subject: { required: true, minLength: 2, maxLength: 50 },
  schoolName: { required: true, minLength: 2, maxLength: 200 },
}

// React hook for form validation
import { useState, useCallback } from 'react'

export function useFormValidation(initialData: Record<string, string | number | boolean> = {}) {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = useCallback((name: string, value: string | number | boolean) => {
    setData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  const touchField = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const validateWith = useCallback((validator: FormValidator) => {
    const result = validator.validate(data)
    setErrors(result.errors)
    return result.isValid
  }, [data])

  const reset = useCallback((newData: Record<string, string | number | boolean> = {}) => {
    setData(newData)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [])

  const submit = useCallback(async (
    onSubmit: (data: Record<string, string | number | boolean>) => Promise<void>,
    validator?: FormValidator
  ) => {
    setIsSubmitting(true)
    
    try {
      // Validate if validator provided
      if (validator) {
        const isValid = validateWith(validator)
        if (!isValid) {
          setIsSubmitting(false)
          return false
        }
      }

      await onSubmit(data)
      setIsSubmitting(false)
      return true
    } catch (error) {
      setIsSubmitting(false)
      throw error
    }
  }, [data, validateWith])

  return {
    data,
    errors,
    touched,
    isSubmitting,
    updateField,
    touchField,
    validateWith,
    reset,
    submit,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError: (name: string) => touched[name] ? errors[name] : undefined
  }
}