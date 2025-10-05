/**
 * API Client for SupplySync AI
 *
 * Handles requests to:
 * - Backend API (NestJS) on port 3001
 * - ML Service (Python FastAPI) on port 8000
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const ML_API_BASE_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000'

class APIClient {
  private baseURL: string
  private mlBaseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
    this.mlBaseURL = ML_API_BASE_URL
  }

  private async request<T>(
    url: string,
    options: RequestInit = {},
    useMlApi: boolean = false
  ): Promise<T> {
    const baseUrl = useMlApi ? this.mlBaseURL : this.baseURL
    const fullUrl = `${baseUrl}${url}`

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T>(url: string, useMlApi: boolean = false): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, useMlApi)
  }

  async post<T>(url: string, data: any, useMlApi: boolean = false): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      useMlApi
    )
  }

  async put<T>(url: string, data: any, useMlApi: boolean = false): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      useMlApi
    )
  }

  async delete<T>(url: string, useMlApi: boolean = false): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' }, useMlApi)
  }

  // ML Service specific methods
  async detectAnomaly(dataPoints: any[]): Promise<any> {
    return this.post(
      '/api/ml/detect-anomaly',
      {
        data_points: dataPoints,
        sensitivity: 0.05,
      },
      true
    )
  }

  async forecastDemand(historicalData: any[], horizon: number = 7): Promise<any> {
    return this.post(
      '/api/ml/forecast-demand',
      {
        historical_data: historicalData,
        forecast_horizon: horizon,
      },
      true
    )
  }

  async getModelInfo(): Promise<any> {
    return this.get('/api/ml/models/info', true)
  }
}

export const apiClient = new APIClient()
