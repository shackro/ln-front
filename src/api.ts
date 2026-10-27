import type { Bid, LoanApplication, Product, Referral, StoreData } from './types'

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!(init?.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (path.startsWith('/api/admin/')) {
    const token = sessionStorage.getItem('admin_token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string | { msg?: string }[] } | null
    const detail = Array.isArray(body?.detail) ? body.detail.map((item) => item.msg).filter(Boolean).join(', ') : body?.detail
    if (response.status === 401 && path.startsWith('/api/admin/')) {
      sessionStorage.removeItem('admin_token')
      window.dispatchEvent(new Event('admin-auth-expired'))
    }
    throw new Error(detail || `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  adminLogin: (email: string, password: string) => {
    const formData = new FormData()
    formData.set('username', email)
    formData.set('password', password)
    return request<{ access_token: string; token_type: string }>('/api/auth/login', {
      method: 'POST',
      body: formData,
    })
  },
  logoutAdmin: () => sessionStorage.removeItem('admin_token'),
  bootstrap: async () => {
    const data = await request<Pick<StoreData, 'products' | 'bids' | 'monthlyRate' | 'whatsappNumber'>>('/api/bootstrap')
    return { ...data, loans: [], referrals: [] } satisfies StoreData
  },
  adminBootstrap: () => request<StoreData>('/api/admin/bootstrap'),
  partnerReferrals: (referralCode: string) => request<Referral[]>(`/api/referrals/${encodeURIComponent(referralCode)}`),
  createBid: (bid: Bid) => request<Bid>('/api/bids', {
    method: 'POST',
    body: JSON.stringify({
      id: bid.id,
      productId: bid.productId,
      bidderPhone: bid.bidderPhone,
      amount: bid.amount,
      referralCode: bid.referralCode,
    }),
  }),
  resolveBid: (bidId: string, action: 'confirm' | 'reject') =>
    request<{ message: string; bidId: string }>(`/api/admin/bids/${bidId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
  sellProduct: (productId: string, referralCode?: string) =>
    request<{ message: string; productId: string }>(`/api/admin/products/${productId}/sell`, {
      method: 'PATCH',
      body: JSON.stringify(referralCode ? { referralCode } : {}),
    }),
  updateLoan: (loanId: string, status: LoanApplication['status']) =>
    request<{ message: string; loanId: string }>(`/api/admin/loans/${loanId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  createLoan: (loan: LoanApplication) =>
    request<LoanApplication>('/api/loans', {
      method: 'POST',
      body: JSON.stringify({
        id: loan.id,
        borrowerName: loan.borrowerName,
        nationalId: loan.nationalId,
        phone: loan.phone,
        collateral: loan.collateral,
        principal: loan.principal,
        termMonths: loan.termMonths,
        referralCode: loan.referralCode,
      }),
    }),
  createProduct: (product: Product) =>
    request<Product>('/api/admin/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (product: Product) =>
    request<Product>(`/api/admin/products/${encodeURIComponent(product.id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: product.title,
        category: product.category,
        description: product.description,
        diagnosticNotes: product.diagnosticNotes,
        originalValue: product.originalValue,
        price: product.price,
        condition: product.condition,
        location: product.location,
        image: product.image,
        images: product.images,
        inspectionVideoUrl: product.inspectionVideoUrl ?? null,
      }),
    }),
  updateSettings: (settings: { monthlyRate: number | null; whatsappNumber: string }) =>
    request<{ monthlyRate: number | null; whatsappNumber: string }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  payReferral: (referralId: string) =>
    request<Referral>(`/api/admin/referrals/${referralId}/pay`, { method: 'PATCH' }),
  resetDemo: () => request<StoreData>('/api/admin/reset-demo', { method: 'POST' }),
}

export function apiErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The API request failed. Please try again.'
}
