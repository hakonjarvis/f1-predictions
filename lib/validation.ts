import { NextResponse } from 'next/server'

/**
 * Validation utilities for API inputs
 */

export function validateYear(year: any): NextResponse | number {
  if (!year) {
    return NextResponse.json(
      { error: 'Year is required' },
      { status: 400 }
    )
  }

  const yearNum = parseInt(year, 10)

  if (isNaN(yearNum)) {
    return NextResponse.json(
      { error: 'Year must be a valid number' },
      { status: 400 }
    )
  }

  if (yearNum < 2000 || yearNum > 2030) {
    return NextResponse.json(
      { error: 'Year must be between 2000 and 2030' },
      { status: 400 }
    )
  }

  return yearNum
}

export function validateSessionKey(sessionKey: any): NextResponse | number {
  if (!sessionKey) {
    return NextResponse.json(
      { error: 'Session key is required' },
      { status: 400 }
    )
  }

  const sessionKeyNum = parseInt(sessionKey, 10)

  if (isNaN(sessionKeyNum)) {
    return NextResponse.json(
      { error: 'Session key must be a valid number' },
      { status: 400 }
    )
  }

  if (sessionKeyNum <= 0) {
    return NextResponse.json(
      { error: 'Session key must be a positive number' },
      { status: 400 }
    )
  }

  return sessionKeyNum
}

export function validateEmail(email: string): boolean {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateName(name: string): boolean {
  // Name should be at least 2 characters and not too long
  return name.trim().length >= 2 && name.trim().length <= 100
}
