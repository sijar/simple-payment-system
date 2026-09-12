import axios, { AxiosInstance } from 'axios'

const apiBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api'

const api: AxiosInstance = axios.create({
    baseURL: apiBaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
})

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const clientId = localStorage.getItem('clientId') || 'web-client'
            config.headers['X-Client-ID'] = clientId
        }
        return config
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized access')
        }
        return Promise.reject(error)
    }
)

export default api
