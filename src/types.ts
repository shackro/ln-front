export type ProductStatus = 'available' | 'reserved' | 'sold'
export type BidStatus = 'pending' | 'confirmed' | 'rejected'
export type LoanStatus = 'submitted' | 'reviewing' | 'approved' | 'disbursed' | 'declined' | 'settled'
export type Role = 'freelancer' | 'admin'

export interface Product {
  id: string
  title: string
  category: string
  description: string
  diagnosticNotes: string
  originalValue: number
  price: number
  condition: 'A' | 'B' | 'C'
  status: ProductStatus
  location: string
  image: string
  images: string[]
  inspectionVideoUrl?: string | null
  createdAt: string
}

export interface Bid {
  id: string
  productId: string
  bidderPhone?: string
  amount: number
  status: BidStatus
  referralCode?: string
  createdAt: string
}

export interface LoanApplication {
  id: string
  borrowerName: string
  nationalId: string
  phone: string
  collateral: string
  principal: number
  termMonths: number
  status: LoanStatus
  referralCode?: string
  createdAt: string
}

export interface Referral {
  id: string
  referralCode: string
  kind: 'buy' | 'loan'
  referenceId: string
  amount: number
  status: 'pending' | 'paid'
  createdAt: string
}

export interface StoreData {
  products: Product[]
  bids: Bid[]
  loans: LoanApplication[]
  referrals: Referral[]
  monthlyRate: number | null
  whatsappNumber: string
}

export interface Profile {
  name: string
  phone: string
  role: Role
  referralCode: string
}
