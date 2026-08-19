import axios from 'axios'
import type { User } from '../types'
import api from './client'

export interface AuthResponse {
  token: string
  user: User
}

export async function registerUser(data: {
  name: string
  phone: string
  email?: string
  password: string
}) {
  const response = await api.post<AuthResponse>('/auth/register', data)
  return response.data
}

export async function loginUser(data: {
  phone: string
  password: string
}) {
  const response = await api.post<AuthResponse>('/auth/login', data)
  return response.data
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid phone or password': 'ফোন নম্বর বা পাসওয়ার্ড সঠিক নয়',
  'A user with this phone number already exists':
    'এই ফোন নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে',
  'Name, phone, and password are required':
    'নাম, ফোন নম্বর এবং পাসওয়ার্ড দিতে হবে',
  'Phone and password are required': 'ফোন নম্বর এবং পাসওয়ার্ড দিতে হবে',
}

function readServerError(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null
  }

  const data: unknown = error.response?.data

  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error: unknown }).error
    return typeof message === 'string' ? message : null
  }

  return null
}

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  const serverError = readServerError(error)

  if (serverError && AUTH_ERROR_MESSAGES[serverError]) {
    return AUTH_ERROR_MESSAGES[serverError]
  }

  return 'কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।'
}
