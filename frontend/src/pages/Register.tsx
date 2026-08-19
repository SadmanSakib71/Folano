import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuthErrorMessage } from '../api/auth'
import AuthScreen, {
  authFieldClass,
  authLabelClass,
} from '../components/auth/AuthScreen'
import { useAuth } from '../context/AuthContext'

const MIN_PASSWORD_LENGTH = 6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setError('নাম লিখুন')
      return
    }

    if (!trimmedPhone) {
      setError('ফোন নম্বর লিখুন')
      return
    }

    if (!password) {
      setError('পাসওয়ার্ড লিখুন')
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      return
    }

    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      setError('সঠিক ইমেইল ঠিকানা লিখুন')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await register({
        name: trimmedName,
        phone: trimmedPhone,
        password,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      })
      navigate('/')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthScreen
      title="রেজিস্টার"
      subtitle="ফলানা পরিবারে যোগ দিন"
      onSubmit={handleSubmit}
      submitLabel="রেজিস্টার করুন"
      submittingLabel="রেজিস্টার হচ্ছে..."
      submitting={submitting}
      error={error}
      footer={
        <>
          আগে থেকে অ্যাকাউন্ট আছে?{' '}
          <Link
            to="/login"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            লগইন করুন
          </Link>
        </>
      }
    >
      <div>
        <label htmlFor="register-name" className={authLabelClass}>
          নাম
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={authFieldClass}
        />
      </div>

      <div>
        <label htmlFor="register-phone" className={authLabelClass}>
          ফোন নম্বর
        </label>
        <input
          id="register-phone"
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
        <label htmlFor="register-email" className={authLabelClass}>
          ইমেইল <span className="font-normal text-muted">(ঐচ্ছিক)</span>
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={authFieldClass}
        />
      </div>

      <div>
        <label htmlFor="register-password" className={authLabelClass}>
          পাসওয়ার্ড
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authFieldClass}
        />
      </div>
    </AuthScreen>
  )
}
