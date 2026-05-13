import { api } from './client'

export const fetchPortfolio = async ({ signal } = {}) =>
  (await api.get('/portfolio', { signal })).data

export const fetchProject = async (id, { signal } = {}) =>
  (await api.get(`/projects/${id}`, { signal })).data
