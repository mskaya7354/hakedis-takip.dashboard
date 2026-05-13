import { api } from './client'

export async function login(username, password) {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const { data } = await api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  localStorage.setItem('hakedis_token', data.access_token)
  return data
}

export function logout() {
  localStorage.removeItem('hakedis_token')
}

export function isAuthed() {
  return !!localStorage.getItem('hakedis_token')
}
