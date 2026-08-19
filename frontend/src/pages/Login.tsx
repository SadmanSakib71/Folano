import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuthErrorMessage } from '../api/auth'
import AuthScreen, {
  authFieldClass,
  authLabelClass,
} from '../components/auth/AuthScreen'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedPhone = phone.trim()

    if (!trimmedPhone) {
      setError('ফোন নম্বর লিখুন')
      return
    }

    if (!password) {
      setError('পাসওয়ার্ড লিখুন')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await login(trimmedPhone, password)
      navigate('/')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthScreen
      title="লগইন"
      subtitle="আপনার অ্যাকাউন্টে প্রবেশ করুন"
      onSubmit={handleSubmit}
      submitLabel="লগইন"
      submittingLabel="লগইন হচ্ছে..."
      submitting={submitting}
      error={error}
      footer={
        <>
          নতুন?{' '}
          <Link
            to="/register"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            রেজিস্টার করুন
          </Link>
        </>
      }
    >
      <div>
        <label htmlFor="login-phone" className={authLabelClass}>
          ফোন নম্বর
        </label>
        <input
          id="login-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={authFieldClass}
          placeholder="০১XXXXXXXXX"
        />
      </div>

      <div>
        <label htmlFor="login-password" className={authLabelClass}>
          পাসওয়ার্ড
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authFieldClass}
        />
      </div>
    </AuthScreen>
  )
}
