import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Copy,
  Camera,
  Film,
  FileText,
  HeartHandshake,
  ImagePlus,
  Images,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Menu,
  Package,
  Palette,
  Pencil,
  Percent,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Scale,
  ShoppingBag,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Tag,
  TrendingUp,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import { api, apiErrorMessage } from './api'
import { categories, makeId, money, normalizeKenyanPhone } from './data'
import type { Bid, LoanApplication, Product, Profile, StoreData } from './types'

type PublicPage = 'about' | 'rates' | 'terms' | 'contact'
type Page = 'market' | 'loans' | 'expert' | 'admin' | 'admin-login' | PublicPage
type Notice = { title: string; text?: string; kind?: 'success' | 'error' }
type Theme = 'purple' | 'orange'
const hourInMilliseconds = 60 * 60 * 1000

const themeStorageKey = 'a-plus-marketplace-theme'
const publicPageLinks: { page: PublicPage; path: string; label: string }[] = [
  { page: 'about', path: '/about', label: 'About' },
  { page: 'rates', path: '/rates', label: 'Rates & guide' },
  { page: 'terms', path: '/terms', label: 'Terms' },
  { page: 'contact', path: '/contact', label: 'Contact' },
]
const referralAttributionKey = 'repo-fier-referral-attribution'
const referralAttributionLifetime = 30 * 24 * 60 * 60 * 1000
const referralCodePattern = /^RF\d{6}$/
type AssetCategoryId =
  | 'phones-tablets'
  | 'laptops-computers'
  | 'cameras-audio'
  | 'televisions'
  | 'washing-machines'
  | 'fridges-freezers'
  | 'home-appliances'
  | 'machinery-tools'
  | 'other'

const assetCategories: {
  id: AssetCategoryId
  label: string
  fields: { key: string; label: string; placeholder: string }[]
}[] = [
  {
    id: 'phones-tablets',
    label: 'Phones & tablets',
    fields: [
      { key: 'model', label: 'Brand and model', placeholder: 'e.g. iPhone 14 Pro Max' },
      { key: 'capacity', label: 'Storage capacity', placeholder: 'e.g. 256 GB' },
      { key: 'battery', label: 'Battery health / state', placeholder: 'e.g. 85% battery health' },
    ],
  },
  {
    id: 'laptops-computers',
    label: 'Laptops & computers',
    fields: [
      { key: 'model', label: 'Brand and model', placeholder: 'e.g. HP EliteBook 840 G8' },
      { key: 'processor', label: 'Processor (CPU)', placeholder: 'e.g. Intel Core i5, 11th Gen' },
      { key: 'memory', label: 'RAM and storage', placeholder: 'e.g. 8 GB RAM, 256 GB SSD' },
    ],
  },
  {
    id: 'cameras-audio',
    label: 'Cameras & audio equipment',
    fields: [
      { key: 'model', label: 'Brand and model', placeholder: 'e.g. Canon EOS 250D or Sony WH-1000XM4' },
      { key: 'type', label: 'Equipment type / key specifications', placeholder: 'e.g. DSLR with kit lens, wireless headphones' },
      { key: 'accessories', label: 'Included accessories', placeholder: 'e.g. lens, charger, case, or cables' },
    ],
  },
  {
    id: 'televisions',
    label: 'Televisions',
    fields: [
      { key: 'model', label: 'Brand and model', placeholder: 'e.g. Sony Bravia' },
      { key: 'size', label: 'Screen size', placeholder: 'e.g. 55 inches' },
      { key: 'display', label: 'Type / resolution', placeholder: 'e.g. 4K Smart TV' },
    ],
  },
  {
    id: 'washing-machines',
    label: 'Washing machines',
    fields: [
      { key: 'model', label: 'Brand and model', placeholder: 'e.g. Samsung EcoBubble' },
      { key: 'capacity', label: 'Capacity and type', placeholder: 'e.g. 8 kg, front load' },
      { key: 'age', label: 'Approximate age', placeholder: 'e.g. 2 years' },
    ],
  },
  {
    id: 'fridges-freezers',
    label: 'Fridges & freezers',
    fields: [
      { key: 'model', label: 'Brand and model', placeholder: 'e.g. Ramtons RF/248' },
      { key: 'capacity', label: 'Capacity and type', placeholder: 'e.g. 250 L, double door' },
      { key: 'age', label: 'Approximate age', placeholder: 'e.g. 3 years' },
    ],
  },
  {
    id: 'home-appliances',
    label: 'Other home appliances',
    fields: [
      { key: 'item', label: 'Appliance type', placeholder: 'e.g. microwave, cooker, dishwasher' },
      { key: 'model', label: 'Brand and model', placeholder: 'Enter the brand and model' },
      { key: 'specifications', label: 'Capacity / key specifications', placeholder: 'Size, capacity, or other key specs' },
    ],
  },
  {
    id: 'machinery-tools',
    label: 'Machinery & tools',
    fields: [
      { key: 'item', label: 'Machine / tool type', placeholder: 'e.g. generator, power tool, compressor' },
      { key: 'model', label: 'Brand and model', placeholder: 'Enter the brand and model' },
      { key: 'specifications', label: 'Power / capacity / key specifications', placeholder: 'e.g. 3.5 kVA, petrol' },
    ],
  },
  {
    id: 'other',
    label: 'Other asset',
    fields: [
      { key: 'item', label: 'Asset type', placeholder: 'What item would you like assessed?' },
      { key: 'model', label: 'Brand and model', placeholder: 'Enter the brand and model, if known' },
      { key: 'specifications', label: 'Size / capacity / key specifications', placeholder: 'Add the most useful details' },
    ],
  },
]

const loanValueGuide = [
  { category: 'Phones & tablets', model: 'iPhone 14 Pro Max (256GB)', gradeA: 45000, gradeB: 35000 },
  { category: 'Phones & tablets', model: 'iPhone 13 (128GB)', gradeA: 28000, gradeB: 20000 },
  { category: 'Phones & tablets', model: 'Samsung Galaxy S23', gradeA: 38000, gradeB: 28000 },
  { category: 'Laptops & computers', model: 'HP EliteBook 840 G8 (i5/8GB)', gradeA: 45000, gradeB: 32000 },
  { category: 'Washing machines', model: 'Samsung 8 kg washing machine', gradeA: 25000, gradeB: 15000 },
  { category: 'Televisions', model: 'Sony 55-inch 4K Smart TV', gradeA: 35000, gradeB: 22000 },
]

function readThemePreference(): Theme {
  return localStorage.getItem(themeStorageKey) === 'orange' ? 'orange' : 'purple'
}

function pageFromPath(pathname: string): Page {
  if (pathname === '/admin/login') return 'admin-login'
  if (pathname === '/admin' && sessionStorage.getItem('admin_token')) return 'admin'
  if (pathname === '/loans') return 'loans'
  if (pathname === '/partner') return 'expert'
  return publicPageLinks.find((item) => item.path === pathname)?.page ?? 'market'
}

function isPublicInfoPage(page: Page): page is PublicPage {
  return publicPageLinks.some((item) => item.page === page)
}

function PublicInfoPage(props: {
  page: PublicPage
  monthlyRate: number | null
  whatsappNumber: string
  onNavigate: (page: PublicPage) => void
  onLoans: () => void
  onExpert: () => void
}) {
  const pageContent: Record<PublicPage, { eyebrow: string; title: string; highlight: string; description: string }> = {
    about: {
      eyebrow: 'ABOUT A+ LOANS & INVESTMENTS',
      title: 'Good finds,',
      highlight: 'fair deals.',
      description: 'We connect customers with inspected pre-owned listings and provide a straightforward way to request an asset finance estimate.',
    },
    rates: {
      eyebrow: 'ASSET FINANCE & VALUE GUIDE',
      title: 'Know the range',
      highlight: 'before you visit.',
      description: 'Use these indicative examples as a starting point. The asset and its condition are reviewed before a final amount or terms are confirmed.',
    },
    terms: {
      eyebrow: 'IMPORTANT INFORMATION',
      title: 'Clear information.',
      highlight: 'Informed choices.',
      description: 'A preliminary inquiry is not an approval or a contract. Review the final written terms and ask questions before proceeding.',
    },
    contact: {
      eyebrow: 'CONTACT & APPOINTMENTS',
      title: 'Talk to our',
      highlight: 'team.',
      description: 'Ask about a listing or request a preliminary asset quote. The team can discuss next steps and arrange an inspection appointment.',
    },
  }
  const content = pageContent[props.page]
  const cleanWhatsappNumber = props.whatsappNumber.replace(/\D/g, '')
  const whatsappReady = cleanWhatsappNumber.length >= 10 && cleanWhatsappNumber !== '254700000000'
  const whatsappUrl = whatsappReady
    ? `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent('Hi A+ Loans & Investments, I have a question about asset finance or a marketplace listing.')}`
    : undefined

  return (
    <main className="subpage public-info-page">
      <section className="page-intro public-info-intro">
        <div className="eyebrow eyebrow-light"><Info size={14} /> {content.eyebrow}</div>
        <h1>{content.title}<br /><span>{content.highlight}</span></h1>
        <p>{content.description}</p>
      </section>

      <div className="public-info-content content-width">
        <nav className="public-info-nav" aria-label="Public information">
          {publicPageLinks.map((item) => (
            <button
              key={item.page}
              type="button"
              className={props.page === item.page ? 'public-info-nav-link active' : 'public-info-nav-link'}
              aria-current={props.page === item.page ? 'page' : undefined}
              onClick={() => props.onNavigate(item.page)}
            >
              {item.page === 'about' && <Info size={15} />}
              {item.page === 'rates' && <Percent size={15} />}
              {item.page === 'terms' && <FileText size={15} />}
              {item.page === 'contact' && <PhoneCall size={15} />}
              {item.label}
            </button>
          ))}
        </nav>

        {props.page === 'about' && (
          <section className="public-info-grid" aria-label="About our services">
            <article className="panel public-info-card">
              <Package size={22} />
              <h2>Pre-owned marketplace</h2>
              <p>Browse available electronics and other listed goods, review their descriptions and prices, then contact the team to confirm availability and arrange a purchase.</p>
            </article>
            <article className="panel public-info-card">
              <Scale size={22} />
              <h2>Asset finance inquiries</h2>
              <p>Share basic details about an asset to request a preliminary estimate. No account is needed to start the quote inquiry.</p>
              <button className="text-link" onClick={props.onLoans}>Request an asset estimate <ArrowRight size={14} /></button>
            </article>
            <article className="panel public-info-card">
              <ShieldCheck size={22} />
              <h2>Clear next steps</h2>
              <p>Any estimate is preliminary. The team discusses inspection, eligibility, and final terms with you before you decide whether to proceed.</p>
            </article>
          </section>
        )}

        {props.page === 'rates' && (
          <>
            <section className="panel public-info-card public-rate-setting">
              <div><Percent size={21} /><div><h2>Monthly rate setting</h2><p>This is the current indicative setting shown by the application, not a binding offer.</p></div></div>
              <strong>{props.monthlyRate === null ? 'Confirm with the team' : `${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 2 }).format(props.monthlyRate)}% per month`}</strong>
            </section>
            <section className="panel public-info-card public-rate-guide">
              <div className="panel-title-row"><div><span className="eyebrow eyebrow-light">INDICATIVE VALUES</span><h2>Example asset ranges</h2></div><Package size={21} /></div>
              <p className="panel-intro">Guide figures vary by model, condition, completeness, and inspection results. The actual amount is confirmed by the team.</p>
              <div className="loan-guide-table-wrap">
                <table className="loan-guide-table">
                  <thead><tr><th>Category</th><th>Example model</th><th>Grade A</th><th>Grade B</th></tr></thead>
                  <tbody>{loanValueGuide.map((entry) => (
                    <tr key={`${entry.category}-${entry.model}`}>
                      <td>{entry.category}</td>
                      <th scope="row">{entry.model}</th>
                      <td>{money(entry.gradeA)}</td>
                      <td>{money(entry.gradeB)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="loan-guide-disclaimer"><ShieldCheck size={15} /> Examples only—not an offer, approval, or guaranteed valuation. Final terms are shared for review before any agreement.</p>
            </section>
          </>
        )}

        {props.page === 'terms' && (
          <section className="public-info-grid" aria-label="Terms and disclosures">
            <article className="panel public-info-card">
              <FileText size={22} />
              <h2>Preliminary estimates</h2>
              <p>Website figures and WhatsApp estimates are preliminary and may change after the asset is inspected. They do not guarantee approval, a specific amount, or a transaction.</p>
            </article>
            <article className="panel public-info-card">
              <ShieldCheck size={22} />
              <h2>Before an inspection</h2>
              <p>Only offer an asset you are authorized to present. Do not send passwords, account PINs, or unredacted sensitive identifiers in screenshots or messages.</p>
            </article>
            <article className="panel public-info-card">
              <Info size={22} />
              <h2>Review final terms</h2>
              <p>Ask the team to provide the applicable amount, fees, dates, and other terms in writing. Read and understand them before handing over an asset or accepting an offer.</p>
            </article>
          </section>
        )}

        {props.page === 'contact' && (
          <section className="public-info-grid" aria-label="Contact options">
            <article className="panel public-info-card">
              <MessageCircle size={22} />
              <h2>WhatsApp desk</h2>
              <p>{whatsappReady ? `Contact the team at +${cleanWhatsappNumber} to ask about a listing or quote.` : 'The WhatsApp contact is not configured yet. You can still prepare an asset quote inquiry on the website.'}</p>
              {whatsappUrl && <a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Open WhatsApp <ArrowUpRight size={15} /></a>}
            </article>
            <article className="panel public-info-card">
              <PhoneCall size={22} />
              <h2>Arrange an inspection</h2>
              <p>Start with the asset details. If an in-person inspection is appropriate, the team will coordinate the location and time with you.</p>
              <button className="button button-outline" onClick={props.onLoans}>Request a quote <ArrowRight size={15} /></button>
            </article>
            <article className="panel public-info-card">
              <HeartHandshake size={22} />
              <h2>Partner inquiries</h2>
              <p>Partners can access their referral links and activity from the partner area.</p>
              <button className="button button-outline" onClick={props.onExpert}>Partner sign in <ArrowRight size={15} /></button>
            </article>
          </section>
        )}

        <section className="panel public-info-referral">
          <div><HeartHandshake size={21} /><div><h2>Interested in referring customers?</h2><p>Use the partner area to get your referral link and track eligible activity.</p></div></div>
          <button className="button button-dark" onClick={props.onExpert}>Visit partner area <ArrowRight size={15} /></button>
        </section>
      </div>
    </main>
  )
}

function readReferralAttribution(): string | null {
  const searchParams = new URLSearchParams(window.location.search)
  const queryCode = (searchParams.get('ref') ?? searchParams.get('partner') ?? searchParams.get('rf'))
    ?.trim()
    .toUpperCase()
  if (queryCode && referralCodePattern.test(queryCode)) {
    localStorage.setItem(referralAttributionKey, JSON.stringify({
      code: queryCode,
      expiresAt: Date.now() + referralAttributionLifetime,
    }))
    return queryCode
  }

  const savedAttribution = localStorage.getItem(referralAttributionKey)
  if (!savedAttribution) return null
  try {
    const attribution: { code?: unknown; expiresAt?: unknown } = JSON.parse(savedAttribution)
    if (
      typeof attribution.code === 'string'
      && referralCodePattern.test(attribution.code)
      && typeof attribution.expiresAt === 'number'
      && attribution.expiresAt > Date.now()
    ) {
      return attribution.code
    }
  } catch {
    localStorage.removeItem(referralAttributionKey)
    return null
  }
  localStorage.removeItem(referralAttributionKey)
  return null
}

function App() {
  const [theme, setTheme] = useState<Theme>(readThemePreference)
  const [store, setStore] = useState<StoreData | null>(null)
  const [apiError, setApiError] = useState('')
  const [attributedReferralCode] = useState(readReferralAttribution)
  const [linkedProductId] = useState(() => new URLSearchParams(window.location.search).get('item'))
  const productLinkHandled = useRef(false)
  const [page, setPage] = useState<Page>(() => {
    return pageFromPath(window.location.pathname)
  })
  const [profile, setProfile] = useState<Profile | null>(() => {
    const raw = localStorage.getItem('repo-fier-profile')
    if (!raw) return null
    try {
      const savedProfile = JSON.parse(raw) as Profile
      if (savedProfile.role === 'admin' && !sessionStorage.getItem('admin_token')) {
        localStorage.removeItem('repo-fier-profile')
        return null
      }
      return savedProfile
    } catch {
      return null
    }
  })
  const [notice, setNotice] = useState<Notice | null>(null)
  const [authRole, setAuthRole] = useState<'freelancer' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [bidProduct, setBidProduct] = useState<Product | null>(null)

  const navigatePublicPage = (destination: PublicPage) => {
    const route = publicPageLinks.find((item) => item.page === destination)
    if (!route) return
    setPage(destination)
    setMenuOpen(false)
    window.history.pushState({}, '', route.path)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  useEffect(() => {
    setApiError('')
    const bootstrapRequest = profile?.role === 'admin' ? api.adminBootstrap() : api.bootstrap()
    if (page === 'expert' && profile?.role === 'freelancer') {
      Promise.all([bootstrapRequest, api.partnerReferrals(profile.referralCode)])
        .then(([data, referrals]) => setStore({ ...data, referrals }))
        .catch((error: unknown) => setApiError(apiErrorMessage(error)))
    } else {
      bootstrapRequest.then(setStore).catch((error: unknown) => setApiError(apiErrorMessage(error)))
    }
  }, [profile?.role])

  useEffect(() => {
    if (!store || !linkedProductId || page !== 'market' || productLinkHandled.current) return
    productLinkHandled.current = true
    const linkedProduct = store.products.find((product) => product.id === linkedProductId)
    if (linkedProduct) setSelectedProduct(linkedProduct)
  }, [store, linkedProductId, page])

  useEffect(() => {
    const handleAdminAuthExpired = () => {
      api.logoutAdmin()
      localStorage.removeItem('repo-fier-profile')
      setProfile(null)
      setPage('admin-login')
      window.history.replaceState({}, '', '/admin/login')
      setNotice({ title: 'Please sign in again', text: 'Your admin session has expired.', kind: 'error' })
    }
    const handlePopState = () => {
      setPage(pageFromPath(window.location.pathname))
    }
    window.addEventListener('admin-auth-expired', handleAdminAuthExpired)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('admin-auth-expired', handleAdminAuthExpired)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [page])

  const refreshStore = async () => {
    const updated = await api.bootstrap()
    setStore(updated)
    setApiError('')
  }

  const openPortal = (destination: 'expert' | 'admin') => {
    setMenuOpen(false)
    if (destination === 'admin' && profile?.role !== 'admin') {
      setPage('admin-login')
      window.history.pushState({}, '', '/admin/login')
      return
    }
    if ((destination === 'admin' && profile?.role === 'admin') || (destination === 'expert' && profile?.role === 'freelancer')) {
      if (destination === 'admin') {
        api.adminBootstrap()
          .then((updated) => { setStore(updated); setPage(destination); window.history.replaceState({}, '', '/admin') })
          .catch((error: unknown) => setNotice({ title: 'Admin data is unavailable', text: apiErrorMessage(error), kind: 'error' }))
      } else if (profile?.role === 'freelancer') {
        api.partnerReferrals(profile.referralCode)
          .then((referrals) => {
            setStore((current) => current ? { ...current, referrals } : current)
            setPage(destination)
            window.history.pushState({}, '', '/partner')
          })
          .catch((error: unknown) => setNotice({ title: 'Partner data is unavailable', text: apiErrorMessage(error), kind: 'error' }))
      } else {
        setPage(destination)
      }
    } else {
      setAuthRole('freelancer')
    }
  }

  const signIn = async (name: string, phone: string) => {
    const normalizedPhone = normalizeKenyanPhone(phone)
    if (!normalizedPhone) {
      setNotice({ title: 'Check your phone number', text: 'Use a Kenyan number, for example 0712 345 678.', kind: 'error' })
      return false
    }
    const referralCode = `RF${normalizedPhone.slice(-6)}`
    const nextProfile: Profile = { name: name.trim() || 'A+ Loans & Investments partner', phone: normalizedPhone, role: 'freelancer', referralCode }
    try {
      const referrals = await api.partnerReferrals(referralCode)
      setStore((current) => current ? { ...current, referrals } : current)
    } catch (error) {
      setNotice({ title: 'Could not open your portal', text: apiErrorMessage(error), kind: 'error' })
      return false
    }
    localStorage.setItem('repo-fier-profile', JSON.stringify(nextProfile))
    setProfile(nextProfile)
    setAuthRole(null)
    setPage('expert')
    window.history.pushState({}, '', '/partner')
    setNotice({ title: 'Your expert portal is ready', text: 'Partner sign-in is a local demo profile.' })
    return true
  }

  const refreshPartnerReferrals = async () => {
    if (profile?.role !== 'freelancer') return
    try {
      const referrals = await api.partnerReferrals(profile.referralCode)
      setStore((current) => current ? { ...current, referrals } : current)
    } catch (error) {
      setNotice({ title: 'Could not refresh your referral ledger', text: apiErrorMessage(error), kind: 'error' })
    }
  }

  const signOut = () => {
    api.logoutAdmin()
    localStorage.removeItem('repo-fier-profile')
    setProfile(null)
    setStore(null)
    setPage('market')
    window.history.replaceState({}, '', '/')
    setMenuOpen(false)
  }

  const loginAdmin = async (email: string, password: string) => {
    const { access_token: token } = await api.adminLogin(email, password)
    sessionStorage.setItem('admin_token', token)
    try {
      const updatedStore = await api.adminBootstrap()
      const adminProfile: Profile = { name: email, phone: '', role: 'admin', referralCode: '' }
      localStorage.setItem('repo-fier-profile', JSON.stringify(adminProfile))
      setProfile(adminProfile)
      setStore(updatedStore)
      setPage('admin')
      window.history.replaceState({}, '', '/admin')
      setNotice({ title: 'Welcome to your control room', text: 'Admin access is authenticated by the API.' })
    } catch (error) {
      api.logoutAdmin()
      throw error
    }
  }

  const recordBid = async (bid: Bid) => {
    try {
      const savedBid = await api.createBid(bid)
      setStore((current) => current ? { ...current, bids: [savedBid, ...current.bids] } : current)
      setNotice({ title: 'Hold request recorded', text: 'Your bid is saved by the API. Continue in WhatsApp to confirm with the team.' })
    } catch (error) {
      setNotice({ title: 'Could not place that bid', text: apiErrorMessage(error), kind: 'error' })
      throw error
    }
  }

  const resolveBid = async (bidId: string, action: 'confirm' | 'reject') => {
    try {
      await api.resolveBid(bidId, action)
      await refreshStore()
      setNotice({ title: action === 'confirm' ? 'Hold confirmed' : 'Bid declined', text: action === 'confirm' ? 'The item is now reserved and other open bids were closed.' : 'The bid is now closed.' })
    } catch (error) {
      setNotice({ title: 'Could not resolve bid', text: apiErrorMessage(error), kind: 'error' })
    }
  }

  const sellProduct = async (productId: string, referralCode?: string) => {
    try {
      await api.sellProduct(productId, referralCode)
      await refreshStore()
      setNotice({
        title: 'Sale recorded',
        text: referralCode
          ? `Partner ${referralCode} is linked. A KSh 1,500 commission is now pending in the ledger.`
          : 'The listing is marked sold. No partner commission was allocated.',
      })
    } catch (error) {
      setNotice({ title: 'Unable to update listing', text: apiErrorMessage(error), kind: 'error' })
      throw error
    }
  }

  const updateLoanStatus = async (loanId: string, status: LoanApplication['status']) => {
    try {
      await api.updateLoan(loanId, status)
      await refreshStore()
      setNotice({ title: 'Application updated', text: status === 'disbursed' ? 'The loan is marked disbursed. Any referral commission is now queued.' : `Status changed to ${status}.` })
    } catch (error) {
      setNotice({ title: 'Could not update application', text: apiErrorMessage(error), kind: 'error' })
    }
  }

  const addProduct = async (product: Product) => {
    try {
      const savedProduct = await api.createProduct(product)
      setStore((current) => current ? { ...current, products: [savedProduct, ...current.products] } : current)
      setNotice({ title: 'Listing published', text: `${product.title} is now visible in the market.` })
    } catch (error) {
      setNotice({ title: 'Could not publish listing', text: apiErrorMessage(error), kind: 'error' })
      throw error
    }
  }

  const updateProduct = async (product: Product) => {
    try {
      const savedProduct = await api.updateProduct(product)
      setStore((current) => current
        ? { ...current, products: current.products.map((item) => item.id === savedProduct.id ? savedProduct : item) }
        : current)
      setNotice({ title: 'Listing updated', text: `${savedProduct.title} changes have been saved.` })
    } catch (error) {
      setNotice({ title: 'Could not update listing', text: apiErrorMessage(error), kind: 'error' })
      throw error
    }
  }

  const saveSettings = async (monthlyRate: number | null, whatsappNumber = store?.whatsappNumber ?? '254700000000') => {
    try {
      const updated = await api.updateSettings({ monthlyRate, whatsappNumber })
      setStore((current) => current ? { ...current, monthlyRate: updated.monthlyRate, whatsappNumber: updated.whatsappNumber } : current)
    } catch (error) {
      setNotice({ title: 'Could not save settings', text: apiErrorMessage(error), kind: 'error' })
      throw error
    }
  }

  const markReferralPaid = async (referralId: string) => {
    try {
      await api.payReferral(referralId)
      await refreshStore()
      setNotice({ title: 'Payout marked complete', text: 'The referral ledger has been updated.' })
    } catch (error) {
      setNotice({ title: 'Could not update payout', text: apiErrorMessage(error), kind: 'error' })
    }
  }

  const resetDemo = () => {
    if (!window.confirm('Reset the demo database to its original sample listings? This permanently removes demo bids, applications and payouts.')) return
    api.resetDemo()
      .then((updated) => {
        setStore(updated)
        setNotice({ title: 'Demo data restored', text: 'The original sample listings are back in the API database.' })
      })
      .catch((error: unknown) => setNotice({ title: 'Could not reset demo data', text: apiErrorMessage(error), kind: 'error' }))
  }

  if (page === 'admin-login') {
    return <div className="app-shell" data-theme={theme}><div key={page} className="page-transition"><AdminLoginPage onLogin={loginAdmin} onBack={() => { setPage('market'); window.history.pushState({}, '', '/') }} /></div></div>
  }
  if (isPublicInfoPage(page)) {
    return (
      <div className="app-shell" data-theme={theme}>
        <Header
          page={page}
          profile={profile}
          theme={theme}
          menuOpen={menuOpen}
          onThemeToggle={() => setTheme((current) => current === 'purple' ? 'orange' : 'purple')}
          onMenu={() => setMenuOpen((open) => !open)}
          onMarket={() => { setPage('market'); setMenuOpen(false); window.history.pushState({}, '', '/') }}
          onLoans={() => { setPage('loans'); setMenuOpen(false); window.history.pushState({}, '', '/loans') }}
          onExpert={() => openPortal('expert')}
          onAdmin={() => openPortal('admin')}
          onSignOut={signOut}
        />
        <div key={page} className="page-transition">
          <PublicInfoPage
            page={page}
            monthlyRate={store?.monthlyRate ?? null}
            whatsappNumber={store?.whatsappNumber ?? ''}
            onNavigate={navigatePublicPage}
            onLoans={() => { setPage('loans'); window.history.pushState({}, '', '/loans') }}
            onExpert={() => openPortal('expert')}
          />
        </div>
        <Footer
          onMarket={() => { setPage('market'); window.history.pushState({}, '', '/') }}
          onLoans={() => { setPage('loans'); window.history.pushState({}, '', '/loans') }}
          onExpert={() => openPortal('expert')}
          onAdmin={() => openPortal('admin')}
          onPublicPage={navigatePublicPage}
        />
        {notice && <Toast notice={notice} onClose={() => setNotice(null)} />}
      </div>
    )
  }
  if (apiError && !store) {
    return <ApiState title="We couldn’t reach the marketplace." text={`${apiError} Start the FastAPI backend and try again.`} onRetry={() => { setApiError(''); (profile?.role === 'admin' ? api.adminBootstrap() : api.bootstrap()).then(setStore).catch((error: unknown) => setApiError(apiErrorMessage(error))) }} />
  }
  if (!store) return <ApiState title="Getting the good finds ready…" text="Connecting to A+ Loans & Investments." />

  return (
    <div className="app-shell" data-theme={theme}>
      <Header
        page={page}
        profile={profile}
        theme={theme}
        menuOpen={menuOpen}
        onThemeToggle={() => setTheme((current) => current === 'purple' ? 'orange' : 'purple')}
        onMenu={() => setMenuOpen((open) => !open)}
        onMarket={() => { setPage('market'); setMenuOpen(false); window.history.replaceState({}, '', '/') }}
        onLoans={() => { setPage('loans'); setMenuOpen(false); window.history.pushState({}, '', '/loans') }}
        onExpert={() => openPortal('expert')}
        onAdmin={() => openPortal('admin')}
        onSignOut={signOut}
      />

      <div key={page} className="page-transition">
        {page === 'market' && (
          <MarketPage
            products={store.products}
            bids={store.bids}
            onProduct={setSelectedProduct}
            onBid={setBidProduct}
            onLoans={() => { setPage('loans'); window.history.pushState({}, '', '/loans') }}
          />
        )}
        {page === 'loans' && (
          <LoansPage
            whatsappNumber={store.whatsappNumber}
            referralCode={attributedReferralCode ?? undefined}
          />
        )}
        {page === 'expert' && profile && (
          <ExpertPage profile={profile} store={store} onRefresh={refreshPartnerReferrals} />
        )}
        {page === 'admin' && profile?.role === 'admin' && (
          <AdminPage
            store={store}
            onResolveBid={resolveBid}
            onSell={sellProduct}
            onLoanStatus={updateLoanStatus}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onSetRate={(rate) => saveSettings(rate)}
            onPaid={markReferralPaid}
            onReset={resetDemo}
            onWhatsAppNumber={(value) => saveSettings(store.monthlyRate, value)}
            onNotice={setNotice}
          />
        )}
        {page === 'expert' && !profile && (
          <PortalPrompt onClick={() => setAuthRole('freelancer')} />
        )}
      </div>

      <Footer
        onMarket={() => { setPage('market'); window.history.pushState({}, '', '/') }}
        onLoans={() => { setPage('loans'); window.history.pushState({}, '', '/loans') }}
        onExpert={() => openPortal('expert')}
        onAdmin={() => openPortal('admin')}
        onPublicPage={navigatePublicPage}
      />

      {selectedProduct && (
        <ProductDialog
          product={store.products.find((item) => item.id === selectedProduct.id) ?? selectedProduct}
          bids={store.bids}
          onClose={() => setSelectedProduct(null)}
          onBid={(product) => { setSelectedProduct(null); setBidProduct(product) }}
        />
      )}
      {bidProduct && (
        <BidDialog
          product={store.products.find((item) => item.id === bidProduct.id) ?? bidProduct}
          bids={store.bids}
          referralCode={attributedReferralCode ?? undefined}
          whatsappNumber={store.whatsappNumber}
          onClose={() => setBidProduct(null)}
          onSubmit={recordBid}
          onNotice={setNotice}
        />
      )}
      {authRole && <SignInDialog onClose={() => setAuthRole(null)} onSignIn={signIn} />}
      {notice && <Toast notice={notice} onClose={() => setNotice(null)} />}
    </div>
  )
}

function ApiState(props: { title: string; text: string; onRetry?: () => void }) {
  return (
    <main className="api-state">
      <span className="brand-mark"><Package size={19} /></span>
      <div className="eyebrow eyebrow-light">REPO-FIER MARKETPLACE</div>
      <h1>{props.title}</h1>
      <p>{props.text}</p>
      {props.onRetry && <button className="button button-dark" onClick={props.onRetry}>Try again <ArrowRight size={16} /></button>}
    </main>
  )
}

function Header(props: {
  page: Page
  profile: Profile | null
  theme: Theme
  menuOpen: boolean
  onThemeToggle: () => void
  onMenu: () => void
  onMarket: () => void
  onLoans: () => void
  onExpert: () => void
  onAdmin: () => void
  onSignOut: () => void
}) {
  const { page, profile } = props
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <button className="brand" onClick={props.onMarket} aria-label="A+ Loans & Investments home">
          <span className="brand-mark"><Package size={19} strokeWidth={2.6} /></span>
          <span className="brand-name"><AnimatedBrandName /><span className="brand-name-secondary"><span>&amp;</span> Inv.</span></span>
        </button>
        <nav className={`main-nav ${props.menuOpen ? 'nav-open' : ''}`}>
          <button className={page === 'market' ? 'nav-link active' : 'nav-link'} onClick={props.onMarket}>Marketplace</button>
          <button className={page === 'loans' ? 'nav-link active' : 'nav-link'} onClick={props.onLoans}>Asset finance</button>
          <button className={page === 'expert' ? 'nav-link active' : 'nav-link'} onClick={props.onExpert}>Earn with us</button>
          {profile?.role === 'admin' && <button className={page === 'admin' ? 'nav-link active' : 'nav-link'} onClick={props.onAdmin}>Control room</button>}
          <div className="nav-mobile-actions">
            {profile ? <button className="button button-outline button-small" onClick={props.onSignOut}><LogOut size={15} /> Sign out</button> : null}
          </div>
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={props.onThemeToggle}
            aria-label={`Switch to ${props.theme === 'purple' ? 'orange-and-black' : 'purple-and-black'} theme`}
            aria-pressed={props.theme === 'orange'}
            title={`Switch to ${props.theme === 'purple' ? 'orange-and-black' : 'purple-and-black'} theme`}
          >
            <Palette size={16} />
            <span>{props.theme === 'purple' ? 'Orange' : 'Purple'}</span>
          </button>
          {profile ? (
            <button className="profile-chip" onClick={profile.role === 'admin' ? props.onAdmin : props.onExpert}>
              <span className="avatar"><PartnerIconCarousel className="profile-avatar-carousel" /></span>
              <span>{profile.name.split(' ')[0]}</span>
              <ChevronDown size={14} />
            </button>
          ) : (
            <button className="button button-dark button-small" onClick={props.onExpert}>
              <PartnerIconCarousel />
              Partner sign in
              <ArrowRight size={15} />
            </button>
          )}
        </div>
        <button className="menu-toggle" onClick={props.onMenu} aria-label="Toggle navigation">
          {props.menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  )
}

function PartnerIconCarousel(props: { className?: string }) {
  const icons = [UserRound, Package, ShoppingBag]
  const [activeIcon, setActiveIcon] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      setActiveIcon((current) => (current + 1) % icons.length)
    }, 1700)

    return () => window.clearInterval(timer)
  }, [icons.length])

  const Icon = icons[activeIcon]

  return (
    <span className={`partner-icon-carousel ${props.className ?? ''}`} aria-hidden="true">
      <span key={activeIcon} className="partner-icon-slide">
        <Icon size={14} strokeWidth={2.2} />
      </span>
    </span>
  )
}

function AnimatedBrandName() {
  const brandName = 'A+ Loans'
  const [displayedText, setDisplayedText] = useState(() => (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? brandName : ''
  ))

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(brandName)
      return
    }

    let characterIndex = 0
    let deleting = false
    let timer = 0
    const animateText = () => {
      if (deleting) {
        characterIndex -= 1
      } else {
        characterIndex += 1
      }

      setDisplayedText(brandName.slice(0, characterIndex))
      if (characterIndex >= brandName.length) deleting = true
      if (characterIndex === 0) deleting = false

      const delay = characterIndex === brandName.length ? 1300 : characterIndex === 0 ? 450 : deleting ? 45 : 85
      timer = window.setTimeout(animateText, delay)
    }
    timer = window.setTimeout(animateText, 85)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <span className="brand-name-primary brand-typewriter" aria-label={brandName}>
      <span className="brand-typewriter-measure" aria-hidden="true">{brandName}</span>
      <span className="brand-typewriter-content" aria-hidden="true">
        {displayedText}<span className="brand-typewriter-cursor" />
      </span>
    </span>
  )
}

function MarketPage(props: {
  products: Product[]
  bids: Bid[]
  onProduct: (product: Product) => void
  onBid: (product: Product) => void
  onLoans: () => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Everything')
  const visibleProducts = useMemo(() => props.products.filter((product) => {
    const searchText = `${product.title} ${product.category} ${product.location} ${product.description}`.toLowerCase()
    return product.status !== 'sold'
      && (category === 'Everything' || product.category === category)
      && searchText.includes(query.trim().toLowerCase())
  }), [props.products, query, category])
  const availableCount = props.products.filter((item) => item.status === 'available').length
  const availableProducts = useMemo(
    () => props.products.filter((product) => product.status === 'available'),
    [props.products],
  )
  const [previewHour, setPreviewHour] = useState(() => Math.floor(Date.now() / hourInMilliseconds))
  useEffect(() => {
    let timer = 0
    const scheduleNextHour = () => {
      const delay = hourInMilliseconds - (Date.now() % hourInMilliseconds)
      timer = window.setTimeout(() => {
        setPreviewHour(Math.floor(Date.now() / hourInMilliseconds))
        scheduleNextHour()
      }, delay)
    }
    scheduleNextHour()
    return () => window.clearTimeout(timer)
  }, [])
  const featured = availableProducts.length > 0
    ? availableProducts[previewHour % availableProducts.length]
    : undefined

  return (
    <main>
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> THE SMARTER WAY TO FIND VALUE</div>
            <div className="hero-transparency-badge"><RefreshCw size={13} /> PRE-OWNED <span>·</span> FAIRLY PRICED <span>·</span> INSPECTED</div>
            <h1>Good finds.<br /><span>Fair deals.</span></h1>
            <p className="hero-description">
              Quality-checked repossessed electronics, <strong>pre-owned and fairly priced</strong>.
              Every listing includes clear condition details, so you can find your next favourite thing with confidence.
            </p>
            <div className="hero-actions">
              <a className="button button-lime" href="#market">Explore the market <ArrowRight size={17} /></a>
              <button className="button button-quiet" onClick={props.onLoans}>Need asset finance? <ArrowUpRight size={16} /></button>
            </div>
            <div className="trust-row">
              <span><ShieldCheck size={16} /> Every item inspected</span>
              <span><MapPin size={16} /> Local pickup available</span>
            </div>
          </div>
          <div className="hero-visual">
            {featured && (
              <>
                <div key={featured.id} className="hero-product-image" style={{ backgroundImage: `url("${featured.image}")` }} />
                <div className="hero-image-wash" />
                <div className="hero-sticker"><Sparkles size={15} /> IN THE SPOTLIGHT</div>
                <button key={featured.id} className="hero-product-card" onClick={() => props.onProduct(featured)}>
                  <span className="hero-product-category">HOURLY FEATURE <span>·</span> {featured.condition} GRADE</span>
                  <span className="hero-product-title">{featured.title}</span>
                  <span className="hero-product-price">{money(featured.price)} <span className="old-price">{money(featured.originalValue)}</span></span>
                  <span className="hero-product-link">Take a closer look <ArrowRight size={15} /></span>
                </button>
                <div className="hero-seal"><BadgeCheck size={21} /><span>Verified<br />& ready</span></div>
              </>
            )}
            {!featured && <div className="hero-empty-state">No available items right now. Check back soon.</div>}
          </div>
        </div>
        <div className="hero-bottom">
          <div className="hero-stat"><strong>{availableCount.toString().padStart(2, '0')}</strong><span>good finds live</span></div>
          <div className="hero-stat"><strong>300–500</strong><span>KSh bid steps</span></div>
          <div className="hero-stat"><strong>100%</strong><span>human-reviewed holds</span></div>
          <span className="hero-bottom-note">A little less waste. A lot more value.</span>
        </div>
      </section>

      <section id="market" className="market-section content-width">
        <div className="section-heading">
          <div>
            <div className="eyebrow eyebrow-light">THE LIQUIDATION EDIT</div>
            <h2>Find your next <span>good thing.</span></h2>
            <p>Inspected, honestly described, and ready for a new home.</p>
          </div>
          <div className="market-count"><span className="live-indicator" /> {visibleProducts.length} items to explore</div>
        </div>
        <div className="market-tools">
          <div className="search-box">
            <Search size={19} />
            <input aria-label="Search listings" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search laptops, cameras, audio..." />
            <span className="search-shortcut">⌘ K</span>
          </div>
          <div className="filter-label"><SlidersHorizontal size={16} /> Browse:</div>
          <div className="category-list" role="group" aria-label="Filter by category">
            {categories.map((item) => (
              <button key={item} className={category === item ? 'category-chip selected' : 'category-chip'} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </div>
        {visibleProducts.length > 0 ? (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                bidCount={props.bids.filter((bid) => bid.productId === product.id && bid.status === 'pending').length}
                onOpen={() => props.onProduct(product)}
                onBid={() => props.onBid(product)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={26} />
            <h3>No finds under that filter.</h3>
            <p>Try another search or category to see what is available.</p>
            <button className="button button-dark button-small" onClick={() => { setQuery(''); setCategory('Everything') }}>Clear filters</button>
          </div>
        )}
        <div className="market-note"><ShieldCheck size={18} /><span><strong>Good to know:</strong> A hold bid starts a conversation with our team; it does not guarantee a purchase until we confirm it with you.</span></div>
      </section>

      <section className="finance-banner content-width">
        <div className="finance-icon"><HeartHandshake size={25} /></div>
        <div className="finance-copy"><span>FOR THE NEXT BIG THING</span><h3>Looking for a little capital to move forward?</h3><p>Tell us what you need. Our team will walk you through the assessment and terms before you decide.</p></div>
        <button className="button button-dark" onClick={props.onLoans}>Explore asset finance <ArrowRight size={16} /></button>
      </section>
    </main>
  )
}

function ProductCard(props: { product: Product; bidCount: number; onOpen: () => void; onBid: () => void }) {
  const { product } = props
  const discount = Math.max(0, Math.round((1 - product.price / product.originalValue) * 100))
  const reserved = product.status === 'reserved'
  const handleCardPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    event.currentTarget.style.setProperty('--tilt-x', `${((bounds.height / 2 - y) / bounds.height) * 5}deg`)
    event.currentTarget.style.setProperty('--tilt-y', `${((x - bounds.width / 2) / bounds.width) * 5}deg`)
    event.currentTarget.style.setProperty('--pointer-x', `${x}px`)
    event.currentTarget.style.setProperty('--pointer-y', `${y}px`)
  }
  const resetCardPointer = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg')
    event.currentTarget.style.setProperty('--tilt-y', '0deg')
  }
  const handleButtonPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--magnetic-x', `${(event.clientX - bounds.left - bounds.width / 2) * 0.12}px`)
    event.currentTarget.style.setProperty('--magnetic-y', `${(event.clientY - bounds.top - bounds.height / 2) * 0.12}px`)
  }
  const resetButtonPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--magnetic-x', '0px')
    event.currentTarget.style.setProperty('--magnetic-y', '0px')
  }
  return (
    <article className="product-card" onPointerMove={handleCardPointerMove} onPointerLeave={resetCardPointer}>
      <button className="product-image-wrap" onClick={props.onOpen} aria-label={`View ${product.title}`}>
        <img src={product.image} alt="" className="product-image" loading="lazy" />
        <span className="grade-badge">GRADE {product.condition}</span>
        <span className="discount-badge">−{discount}%</span>
        <span className="checked-badge"><ShieldCheck size={13} /> INSPECTED</span>
        {reserved && <span className="reserved-overlay">ON HOLD</span>}
      </button>
      <div className="product-body">
        <div className="product-meta"><span>{product.category}</span><span><MapPin size={12} /> {product.location}</span></div>
        <button className="product-name" onClick={props.onOpen}>{product.title}</button>
        <p className="product-blurb">{product.description}</p>
        <div className="product-price-row"><strong>{money(product.price)}</strong><span>{money(product.originalValue)}</span></div>
        <div className="product-bottom">
          <span className="bid-count">{props.bidCount > 0 ? `${props.bidCount} open ${props.bidCount === 1 ? 'hold' : 'holds'}` : 'Freshly listed'}</span>
          <button
            className={reserved ? 'product-cta reserved-cta' : 'product-cta'}
            onClick={props.onBid}
            onPointerMove={handleButtonPointerMove}
            onPointerLeave={resetButtonPointer}
            disabled={product.status !== 'available'}
          >
            {reserved ? 'Reserved' : 'Place a hold'} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductDialog(props: { product: Product; bids: Bid[]; onClose: () => void; onBid: (product: Product) => void }) {
  const { product } = props
  const galleryImages = [...new Set([product.image, ...(product.images ?? [])].filter(Boolean))]
  const [activeImage, setActiveImage] = useState(product.image)
  useEffect(() => setActiveImage(product.image), [product.id, product.image])
  const highestBid = props.bids.filter((bid) => bid.productId === product.id && bid.status !== 'rejected').reduce((highest, bid) => Math.max(highest, bid.amount), product.price)
  const discount = Math.max(0, Math.round((1 - product.price / product.originalValue) * 100))
  return (
    <Modal onClose={props.onClose} className="product-modal">
      <button
        type="button"
        className="product-modal-close"
        onClick={props.onClose}
        aria-label="Close product details"
        title="Close"
      >
        <X size={20} />
      </button>
      <div className="product-media">
        <div className="product-detail-image">
          <img src={galleryImages.includes(activeImage) ? activeImage : product.image} alt={product.title} />
          <span className="checked-badge"><ShieldCheck size={13} /> INSPECTED BY OUR TEAM</span>
        </div>
        {galleryImages.length > 1 && (
          <div className="product-gallery" aria-label="More product photos">
            <span><Images size={14} /> More photos</span>
            <div>
              {galleryImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={image === activeImage ? 'gallery-thumbnail selected' : 'gallery-thumbnail'}
                  onClick={() => setActiveImage(image)}
                  aria-label={`View product photo ${index + 1}`}
                  aria-pressed={image === activeImage}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          </div>
        )}
        <section className="inspection-video">
          <h3><Film size={15} /> Inspection video</h3>
          {product.inspectionVideoUrl ? (
            <video controls preload="metadata" playsInline aria-label={`${product.title} inspection video`}>
              <source src={product.inspectionVideoUrl} />
              Your browser does not support video playback.
            </video>
          ) : (
            <p>No inspection video is available for this item.</p>
          )}
        </section>
      </div>
      <div className="product-detail-content">
        <div className="product-meta"><span>{product.category}</span><span>ASSET {product.id}</span></div>
        <h2>{product.title}</h2>
        <p className="product-detail-description">{product.description}</p>
        <div className="detail-price"><div><strong>{money(product.price)}</strong><del>{money(product.originalValue)}</del></div><span className="discount-badge">SAVE {discount}%</span></div>
        <div className="detail-highlights"><div><ShieldCheck size={17} /><span><strong>Checked and cleared</strong><small>Our team has inspected this item.</small></span></div><div><MapPin size={17} /><span><strong>Pickup in {product.location}</strong><small>Ask our team about delivery.</small></span></div></div>
        <div className="diagnostic-box"><span>TECHNICIAN NOTES</span><p>{product.diagnosticNotes}</p></div>
        {product.status === 'available' ? <div className="bid-range"><span>Current leading offer</span><strong>{money(highestBid)}</strong><small>Next valid hold: {money(highestBid + 300)} – {money(highestBid + 500)}</small></div> : <div className="status-banner">{product.status === 'reserved' ? 'This find is currently on hold.' : 'This find has found a new home.'}</div>}
        <button className="button button-coral full-button" disabled={product.status !== 'available'} onClick={() => props.onBid(product)}>{product.status === 'available' ? 'Place a hold bid' : 'Not available'} <ArrowRight size={17} /></button>
        <p className="fine-print">A bid is an expression of interest. Our team will confirm availability before any sale is final.</p>
      </div>
    </Modal>
  )
}

function BidDialog(props: {
  product: Product
  bids: Bid[]
  referralCode?: string
  whatsappNumber: string
  onClose: () => void
  onSubmit: (bid: Bid) => Promise<void>
  onNotice: (notice: Notice) => void
}) {
  const { product } = props
  const highestBid = props.bids.filter((bid) => bid.productId === product.id && bid.status !== 'rejected').reduce((highest, bid) => Math.max(highest, bid.amount), product.price)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState(String(highestBid + 300))
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const minimum = highestBid + 300
  const maximum = highestBid + 500

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const parsedAmount = Number(amount)
    const normalizedPhone = normalizeKenyanPhone(phone)
    if (!Number.isFinite(parsedAmount) || parsedAmount < minimum || parsedAmount > maximum) {
      setError(`Choose an amount from ${money(minimum)} to ${money(maximum)}.`)
      return
    }
    if (!normalizedPhone) {
      setError('Enter a valid Kenyan mobile number, such as 0712 345 678.')
      return
    }
    const bid: Bid = {
      id: makeId('BID'),
      productId: product.id,
      bidderPhone: normalizedPhone,
      amount: parsedAmount,
      status: 'pending',
      referralCode: props.referralCode,
      createdAt: new Date().toISOString(),
    }
    const whatsappWindow = window.open('about:blank', '_blank')
    setIsSubmitting(true)
    try {
      await props.onSubmit(bid)
      const cleanNumber = props.whatsappNumber.replace(/\D/g, '')
      const productParams = new URLSearchParams({ item: product.id })
      if (bid.referralCode) productParams.set('ref', bid.referralCode)
      const productUrl = `${window.location.origin}/?${productParams.toString()}#market`
      const referralNote = bid.referralCode ? `\n\nReferral partner code: ${bid.referralCode}` : ''
      const message = `Hi A+ Loans & Investments team, I am interested in a hold bid of ${money(parsedAmount)} on ${product.title} (asset ${product.id}). My phone number is ${normalizedPhone}. Please confirm availability.\n\nOpen this item: ${productUrl}${referralNote}`
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
      if (whatsappWindow) whatsappWindow.location.href = whatsappUrl
      else window.location.assign(whatsappUrl)
      props.onClose()
    } catch (submitError) {
      whatsappWindow?.close()
      setError(apiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal onClose={props.onClose} className="form-modal">
      <div className="modal-heading"><div className="modal-icon coral-icon"><Package size={20} /></div><button className="icon-button" onClick={props.onClose} aria-label="Close"><X size={20} /></button></div>
      <div className="eyebrow eyebrow-light">A GOOD FIND: {product.id}</div>
      <h2>Make it yours?</h2>
      <p className="modal-subtitle">Place a hold bid and our team will help you take it from here.</p>
      <div className="bid-product-summary"><img src={product.image} alt="" /><div><strong>{product.title}</strong><span>Listed at {money(product.price)}</span></div></div>
      <div className="bid-guide"><div><span>Current leading offer</span><strong>{money(highestBid)}</strong></div><div><span>Your bid range</span><strong>{money(minimum)} – {money(maximum)}</strong></div></div>
      <form onSubmit={submit} className="form-stack">
        <label className="field-label">Your offer (KSh)<input type="number" min={minimum} max={maximum} step="100" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
        <label className="field-label">Mobile number<input type="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
        {error && <p className="form-error">{error}</p>}
        <button disabled={isSubmitting} className="button button-coral full-button" type="submit">{isSubmitting ? 'Saving your bid…' : 'Save bid & open WhatsApp'} <ArrowRight size={16} /></button>
      </form>
      <p className="fine-print">Your bid will be shared with our team. Only an admin-confirmed hold reserves the item.</p>
    </Modal>
  )
}

function LoansPage(props: { whatsappNumber: string; referralCode?: string }) {
  const [categoryId, setCategoryId] = useState<AssetCategoryId>('phones-tablets')
  const [specifications, setSpecifications] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    grade: '',
    conditionNotes: '',
    preferredVisit: '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [error, setError] = useState('')
  const [handoffStarted, setHandoffStarted] = useState(false)
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const activeCategory = assetCategories.find((category) => category.id === categoryId) ?? assetCategories[0]
  const updateSpecification = (key: string, value: string) => setSpecifications((current) => ({ ...current, [key]: value }))
  const guideEntry = loanValueGuide.find((entry) => (
    entry.category === activeCategory.label
    && entry.model.toLowerCase() === (specifications.model ?? '').trim().toLowerCase()
  ))
  const estimate = guideEntry && form.grade === 'A'
    ? guideEntry.gradeA
    : guideEntry && form.grade === 'B'
      ? guideEntry.gradeB
      : null

  useEffect(() => {
    const previews = photos.map((photo) => URL.createObjectURL(photo))
    setPhotoPreviews(previews)
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview))
  }, [photos])

  const selectPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (selected.length > 3) {
      setError('Choose up to 3 system-information photos.')
      return
    }
    if (selected.some((photo) => !photo.type.startsWith('image/'))) {
      setError('Choose image files only.')
      return
    }
    if (selected.some((photo) => photo.size > 10 * 1024 * 1024)) {
      setError('Each image must be 10 MB or smaller.')
      return
    }
    setError('')
    setPhotos(selected)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const phoneNumber = props.whatsappNumber.replace(/\D/g, '')
    if (!phoneNumber) {
      setError('The WhatsApp contact is unavailable right now. Please try again later.')
      return
    }
    const quoteText = estimate === null
      ? 'Indicative amount: please assess and advise.'
      : `Indicative guide amount: ${money(estimate)} (subject to inspection).`
    const referralLine = props.referralCode ? `\nReferral partner: ${props.referralCode}` : ''
    const photoNames = photos.length > 0
      ? photos.map((photo) => photo.name).join(', ')
      : 'No screenshot selected yet.'
    const message = [
      'Hi A+ Loans & Investments team. I would like a preliminary asset-finance quote and to arrange an onsite inspection.',
      '',
      `Asset category: ${activeCategory.label}`,
      ...activeCategory.fields.map((field) => `${field.label}: ${(specifications[field.key] ?? '').trim()}`),
      `Condition: ${form.grade === 'A' ? 'Grade A - like new' : form.grade === 'B' ? 'Grade B - light use' : 'Needs inspection'}`,
      `Additional details: ${form.conditionNotes.trim() || 'None provided'}`,
      quoteText,
      `Preferred inspection time: ${form.preferredVisit.trim() || 'Please suggest an available time.'}`,
      `System-info photo(s) selected on this device: ${photoNames}`,
      'I will attach the selected screenshot/photo(s) in this WhatsApp chat before sending.',
      'Please confirm the inspection location, appointment time, and final assessed amount. I understand this is not a loan offer.',
      referralLine,
    ].filter(Boolean).join('\n')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    const whatsappWindow = window.open(whatsappUrl, '_blank')
    if (whatsappWindow) whatsappWindow.opener = null
    else window.location.assign(whatsappUrl)
    setHandoffStarted(true)
  }

  return (
    <main className="subpage loan-hub">
      <section className="page-intro">
        <div className="eyebrow eyebrow-light"><HeartHandshake size={14} /> ASSET FINANCE & INSPECTION</div>
        <h1>Know the range before<br /><span>you visit.</span></h1>
        <p>From phones and computers to appliances, televisions, and machinery. Share the details relevant to your asset and request a preliminary quote without creating an account.</p>
      </section>

      <section className="loan-layout content-width">
        <form className="panel loan-form quote-form" onSubmit={submit}>
          <div className="panel-title-row"><div><span className="eyebrow eyebrow-light">PRELIMINARY QUOTE</span><h2>Tell us about your asset.</h2></div><span className="quote-step">No account needed</span></div>
          <p className="panel-intro">Choose the asset type so we can ask for relevant details. No name, national ID, or phone number is needed for this quote inquiry.</p>
          {props.referralCode && <div className="terms-pending referral-attribution-note"><ShieldCheck size={18} /><span>Your referral is linked automatically; no code or signup is needed.</span></div>}
          <div className="form-grid">
            <label className="field-label field-wide">Asset category
              <select value={categoryId} onChange={(event) => {
                const nextCategory = assetCategories.find((category) => category.id === event.target.value)
                if (!nextCategory) return
                setCategoryId(nextCategory.id)
                setSpecifications({})
                update('grade', '')
              }} required>
                {assetCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
            </label>
            {activeCategory.fields.map((field) => {
              const knownModels = loanValueGuide
                .filter((entry) => entry.category === activeCategory.label)
                .map((entry) => entry.model)
              const datalistId = `asset-models-${categoryId}`
              return (
                <label key={`${categoryId}-${field.key}`} className={`field-label ${activeCategory.fields.length === 1 ? 'field-wide' : ''}`}>
                  {field.label}
                  <input
                    list={field.key === 'model' && knownModels.length > 0 ? datalistId : undefined}
                    value={specifications[field.key] ?? ''}
                    onChange={(event) => updateSpecification(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    required
                  />
                  {field.key === 'model' && knownModels.length > 0 && (
                    <datalist id={datalistId}>{knownModels.map((model) => <option key={model} value={model} />)}</datalist>
                  )}
                </label>
              )
            })}
            <label className="field-label field-wide">Condition grade
              <select value={form.grade} onChange={(event) => update('grade', event.target.value)} required>
                <option value="">Choose the closest match</option>
                <option value="A">Grade A - like new</option>
                <option value="B">Grade B - light use</option>
                <option value="C">Needs inspection / other</option>
              </select>
            </label>
            <label className="field-label field-wide">Other useful details
              <textarea value={form.conditionNotes} onChange={(event) => update('conditionNotes', event.target.value)} placeholder="Any faults, repairs, included accessories, or other details" rows={3} />
            </label>
          </div>

          <div className="quote-estimate" aria-live="polite">
            <div><span>Preliminary guide amount</span><strong>{estimate === null ? 'Needs team review' : money(estimate)}</strong></div>
            <p>{estimate === null
              ? 'This asset or condition is not listed in the guide. The team can review your details and advise in WhatsApp.'
              : 'Based on the selected asset model and grade only. Final amount depends on checks and onsite inspection.'}</p>
          </div>

          <label className="field-label photo-upload-label">System information screenshot or clear asset photo
            <span className="photo-upload-control"><Camera size={18} /><span>{photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'} selected` : 'Choose up to 3 images'}</span><input type="file" accept="image/*" multiple onChange={selectPhotos} /></span>
          </label>
          {photoPreviews.length > 0 && <div className="quote-photo-list">{photoPreviews.map((preview, index) => (
            <div className="quote-photo" key={preview}><img src={preview} alt={`Selected device information ${index + 1}`} /><span>{photos[index]?.name}</span><button type="button" onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} aria-label={`Remove ${photos[index]?.name}`}><X size={15} /></button></div>
          ))}</div>}
          <p className="photo-privacy-note">Photos stay in this browser; they are not uploaded by this site or automatically attached to WhatsApp. After WhatsApp opens, attach them in the chat. Hide passwords and redact IMEI/serial numbers before sharing.</p>

          <label className="field-label quote-visit-field">Preferred day/time for an onsite inspection
            <input value={form.preferredVisit} onChange={(event) => update('preferredVisit', event.target.value)} placeholder="e.g. weekday afternoon, or suggest a time" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button button-dark full-button"><MessageCircle size={17} /> Inquire quote & arrange inspection <ArrowRight size={17} /></button>
          <p className="fine-print">WhatsApp opens with your asset details and any matching guide amount. The team will confirm the location and appointment; this request does not reserve a meeting or guarantee financing.</p>
          {handoffStarted && <div className="terms-pending quote-handoff-note"><MessageCircle size={17} /><span>WhatsApp should be open with your quote request. Attach your selected screenshot/photo(s) in that chat, then send the message to the team.</span></div>}
        </form>

        <aside className="loan-aside">
          <div className="aside-top"><span>WHAT HAPPENS NEXT</span><div className="aside-illustration"><Wallet size={26} /><ArrowDownRight size={19} /></div></div>
          <h3>A clear estimate.<br />A human inspection.</h3>
          <div className="loan-steps">
            <div className="loan-step"><span>01</span><div><strong>Share asset details</strong><p>Specifications adapt to the asset you select; include a photo or screenshot if useful.</p></div></div>
            <div className="loan-step"><span>02</span><div><strong>Get a preliminary response</strong><p>The team reviews your details and discusses a possible amount in WhatsApp.</p></div></div>
            <div className="loan-step"><span>03</span><div><strong>Confirm an inspection visit</strong><p>Agree on a location and time with the team. The physical check determines any final offer.</p></div></div>
          </div>
          <div className="responsible-note"><ShieldCheck size={17} /><span>No account or identity documents are required for this initial quote inquiry. Do not send passwords, PINs, or unredacted serial/IMEI details.</span></div>
        </aside>
      </section>

      <section className="loan-value-directory content-width" aria-labelledby="loan-guide-heading">
        <div className="panel-title-row">
          <div><span className="eyebrow eyebrow-light">VALUE GUIDE</span><h2 id="loan-guide-heading">Indicative asset ranges</h2></div>
          <Package size={22} />
        </div>
        <p className="panel-intro">Examples for selected phones, laptops, washing machines, and televisions. Other appliances, fridges, freezers, and machinery are welcome; ask the team for an estimate.</p>
        <div className="loan-guide-table-wrap">
          <table className="loan-guide-table">
            <thead><tr><th>Asset category</th><th>Example model</th><th>Grade A · Like new</th><th>Grade B · Light use</th></tr></thead>
            <tbody>{loanValueGuide.map((entry) => (
              <tr key={`${entry.category}-${entry.model}`}>
                <td>{entry.category}</td>
                <th scope="row">{entry.model}</th>
                <td>{money(entry.gradeA)}</td>
                <td>{money(entry.gradeB)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="loan-guide-disclaimer"><ShieldCheck size={15} /> These are preliminary guide figures, not a loan offer or approval. The team confirms any amount and terms after inspection.</p>
      </section>
    </main>
  )
}

function ExpertPage(props: { profile: Profile; store: StoreData; onRefresh: () => Promise<void> }) {
  const [copied, setCopied] = useState(false)
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const referrals = props.store.referrals.filter((item) => item.referralCode === props.profile.referralCode)
  const pendingTotal = referrals.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
  const totalEarned = referrals.reduce((sum, item) => sum + item.amount, 0)
  const link = `${window.location.origin}/?ref=${encodeURIComponent(props.profile.referralCode)}`
  const makeProductLink = (product: Product) =>
    `${window.location.origin}/?ref=${encodeURIComponent(props.profile.referralCode)}&item=${encodeURIComponent(product.id)}#market`
  const copyToClipboard = async (value: string, fallbackLabel: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      window.prompt(fallbackLabel, value)
    }
  }
  const copyLink = async () => {
    await copyToClipboard(link, 'Copy your referral link:')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }
  const copyProductLink = async (product: Product) => {
    await copyToClipboard(makeProductLink(product), `Copy your link for ${product.title}:`)
    setCopiedProductId(product.id)
    window.setTimeout(() => setCopiedProductId(null), 2200)
  }
  const refreshLedger = async () => {
    setRefreshing(true)
    try {
      await props.onRefresh()
    } finally {
      setRefreshing(false)
    }
  }
  const referralsWithName = referrals.map((referral) => ({
    ...referral,
    label: referral.kind === 'buy'
      ? props.store.products.find((product) => product.id === referral.referenceId)?.title ?? 'Product sale'
      : props.store.loans.find((loan) => loan.id === referral.referenceId)?.borrowerName ?? 'Loan referral',
  }))
  const promotableProducts = props.store.products.filter((product) => product.status === 'available')
  return (
    <main className="dashboard-page content-width">
      <div className="dashboard-welcome"><div><div className="eyebrow eyebrow-light">YOUR PARTNER SPACE</div><h1>Good to have you, <span>{props.profile.name.split(' ')[0]}.</span></h1><p>Your network can open doors. Here’s how your referrals are doing.</p></div><div className="partner-id"><span>YOUR PARTNER CODE</span><strong>{props.profile.referralCode}</strong></div></div>
      <div className="stat-grid">
        <StatCard label="Total earned" value={money(totalEarned)} icon={<TrendingUp size={19} />} detail="All-time commissions" />
        <StatCard label="Pending payout" value={money(pendingTotal)} icon={<Wallet size={19} />} detail="Queued for settlement" accent />
        <StatCard label="Successful referrals" value={String(referrals.length)} icon={<HeartHandshake size={19} />} detail="Sales + disbursed loans" />
      </div>
      <div className="dashboard-columns">
        <div className="affiliate-column">
          <section className="panel referral-panel">
            <div className="panel-title-row"><div><span className="eyebrow eyebrow-light">GROW YOUR NETWORK</span><h2>Your referral link</h2></div><div className="link-icon"><ArrowUpRight size={18} /></div></div>
            <p>Share your link in WhatsApp, social posts or directly with customers. Their item hold or loan request will carry your partner code, and the WhatsApp handoff includes it for the team.</p>
            <div className="copy-link"><span>{link}</span><button className="button button-dark button-small" onClick={copyLink}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy link'}</button></div>
            <div className="commission-info"><div><Package size={17} /><span><strong>KSh 1,500</strong><small>for each referred item sale after it is completed</small></span></div><div><CircleDollarSign size={17} /><span><strong>3% of principal</strong><small>when a referred loan is disbursed</small></span></div></div>
            <div className="affiliate-steps">
              <h3>How affiliate tracking works</h3>
              <ol>
                <li>Share your partner link or a link to a specific available item.</li>
                <li>The customer’s referral code is saved for 30 days and attached when they place a hold or request a loan.</li>
                <li>When the referred item is marked sold, KSh 1,500 is added to your ledger as pending. Admin marks it paid after settlement.</li>
              </ol>
              <p>For a sale arranged outside the website, ask the customer to mention your partner code. Staff can enter it when recording the sale.</p>
            </div>
          </section>
          <section className="panel affiliate-products">
            <div className="panel-title-row"><div><span className="eyebrow eyebrow-light">PROMOTE WHAT'S AVAILABLE</span><h2>Share an item</h2></div><span className="count-pill">{promotableProducts.length} available</span></div>
            <p>These links open the selected item and include your partner code for attribution.</p>
            {promotableProducts.length === 0 ? <EmptyInline icon={<Package size={20} />} title="No available items to share." text="Check back when new listings are published." /> : (
              <div className="affiliate-product-list">
                {promotableProducts.map((product) => (
                  <div className="affiliate-product" key={product.id}>
                    <img src={product.image} alt="" />
                    <div><strong>{product.title}</strong><span>{product.id} · {money(product.price)}</span></div>
                    <button className="button button-outline button-small" onClick={() => copyProductLink(product)} aria-label={`Copy referral link for ${product.title}`}>
                      {copiedProductId === product.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedProductId === product.id ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <section className="panel referral-activity">
          <div className="panel-title-row"><div><span className="eyebrow eyebrow-light">YOUR ACTIVITY</span><h2>Referral ledger</h2></div><div className="ledger-controls"><span className="count-pill">{referrals.length} total</span><button className="button button-outline button-small" onClick={refreshLedger} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button></div></div>
          {referralsWithName.length === 0 ? <EmptyInline icon={<HeartHandshake size={20} />} title="Your first referral starts here." text="Share your link to start building your ledger." /> : <div className="ledger-list">{referralsWithName.map((item) => <div className="ledger-row" key={item.id}><div className="ledger-symbol">{item.kind === 'buy' ? <Package size={17} /> : <CircleDollarSign size={17} />}</div><div className="ledger-info"><strong>{item.label}</strong><span>{item.kind === 'buy' ? `Item ${item.referenceId} · completed sale` : 'Disbursed loan'} · {new Date(item.createdAt).toLocaleDateString()}</span></div><div className="ledger-amount"><strong>+{money(item.amount)}</strong><span className={item.status === 'paid' ? 'paid-label' : 'pending-label'}>{item.status}</span></div></div>)}</div>}
        </section>
      </div>
      <div className="portal-note"><ShieldCheck size={18} /><p>Commissions are recorded when a sale is completed or a referred loan is disbursed. Payout timing and verification are handled by the A+ Loans & Investments team.</p></div>
    </main>
  )
}

function AdminPage(props: {
  store: StoreData
  onResolveBid: (id: string, action: 'confirm' | 'reject') => Promise<void>
  onSell: (id: string, referralCode?: string) => Promise<void>
  onLoanStatus: (id: string, status: LoanApplication['status']) => Promise<void>
  onAddProduct: (product: Product) => Promise<void>
  onUpdateProduct: (product: Product) => Promise<void>
  onSetRate: (rate: number | null) => Promise<void>
  onPaid: (id: string) => Promise<void>
  onReset: () => void
  onWhatsAppNumber: (value: string) => Promise<void>
  onNotice: (notice: Notice) => void
}) {
  const [tab, setTab] = useState<'overview' | 'inventory' | 'holds' | 'loans' | 'payouts' | 'settings'>('overview')
  const available = props.store.products.filter((product) => product.status === 'available').length
  const pendingBids = props.store.bids.filter((bid) => bid.status === 'pending')
  const openLoans = props.store.loans.filter((loan) => ['submitted', 'reviewing', 'approved'].includes(loan.status))
  const pendingPayouts = props.store.referrals.filter((item) => item.status === 'pending')
  const [showAdd, setShowAdd] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  return (
    <main className="admin-page content-width">
      <div className="admin-heading"><div><div className="eyebrow eyebrow-light"><LayoutDashboard size={14} /> ADMIN CONTROL ROOM</div><h1>Everything, <span>in one place.</span></h1><p>Manage listings, resolve holds and stay on top of applications.</p></div><div className="admin-mark"><ShieldCheck size={20} /><span>ADMIN<br /><strong>DEMO MODE</strong></span></div></div>
      <div className="admin-layout">
        <aside className="admin-sidebar"><span className="sidebar-caption">WORKSPACE</span>{([
          ['overview', 'Overview', <LayoutDashboard size={17} />],
          ['inventory', 'Inventory', <Package size={17} />],
          ['holds', 'Hold bids', <ClipboardList size={17} />, pendingBids.length],
          ['loans', 'Loan requests', <HeartHandshake size={17} />, openLoans.length],
          ['payouts', 'Commissions', <Wallet size={17} />, pendingPayouts.length],
          ['settings', 'Settings', <SlidersHorizontal size={17} />],
        ] as const).map(([key, label, icon, count]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? 'sidebar-link selected' : 'sidebar-link'}>{icon}<span>{label}</span>{count !== undefined && count > 0 && <b>{count}</b>}</button>)}<div className="sidebar-flag"><span /> Demo changes are stored by the API.</div></aside>
        <section className="admin-main">
          {tab === 'overview' && <AdminOverview store={props.store} available={available} pendingBids={pendingBids.length} openLoans={openLoans.length} onNavigate={setTab} />}
          {tab === 'inventory' && <InventoryPanel products={props.store.products} bids={props.store.bids} onAdd={() => setShowAdd(true)} onEdit={setEditingProduct} onSell={props.onSell} onResolve={props.onResolveBid} />}
          {tab === 'holds' && <HoldsPanel bids={props.store.bids} products={props.store.products} onResolve={props.onResolveBid} />}
          {tab === 'loans' && <LoansAdminPanel loans={props.store.loans} onStatus={props.onLoanStatus} />}
          {tab === 'payouts' && <PayoutsPanel referrals={props.store.referrals} products={props.store.products} loans={props.store.loans} onPaid={props.onPaid} />}
          {tab === 'settings' && <SettingsPanel monthlyRate={props.store.monthlyRate} whatsappNumber={props.store.whatsappNumber} onSetRate={props.onSetRate} onWhatsAppNumber={props.onWhatsAppNumber} onReset={props.onReset} onNotice={props.onNotice} />}
        </section>
      </div>
      {showAdd && <ProductFormDialog onClose={() => setShowAdd(false)} onSave={async (product) => { await props.onAddProduct(product); setShowAdd(false) }} />}
      {editingProduct && <ProductFormDialog product={editingProduct} onClose={() => setEditingProduct(null)} onSave={async (product) => { await props.onUpdateProduct(product); setEditingProduct(null) }} />}
    </main>
  )
}

function AdminOverview(props: { store: StoreData; available: number; pendingBids: number; openLoans: number; onNavigate: (tab: 'inventory' | 'holds' | 'loans') => void }) {
  return (
    <>
      <div className="admin-section-title">
        <div><span className="eyebrow eyebrow-light">TODAY AT A GLANCE</span><h2>Welcome back.</h2></div>
        <span className="date-label">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>
      <div className="stat-grid admin-stat-grid">
        <StatCard label="Available listings" value={String(props.available)} icon={<Package size={19} />} detail="Ready for a new owner" />
        <StatCard label="Open hold bids" value={String(props.pendingBids)} icon={<ClipboardList size={19} />} detail="Needs your attention" accent />
        <StatCard label="Loan requests" value={String(props.openLoans)} icon={<HeartHandshake size={19} />} detail="Awaiting next steps" />
      </div>
      <div className="admin-overview-grid">
        <div className="panel">
          <div className="panel-title-row">
            <div><span className="eyebrow eyebrow-light">YOUR INVENTORY</span><h2>Recent listings</h2></div>
            <button className="text-link" onClick={() => props.onNavigate('inventory')}>View all <ArrowRight size={14} /></button>
          </div>
          <div className="mini-product-list">
            {props.store.products.slice(0, 4).map((product) => (
              <div className="mini-product-row" key={product.id}>
                <img src={product.image} alt="" />
                <div><strong>{product.title}</strong><span>{product.id} · {product.location}</span></div>
                <span className={`status-pill ${product.status}`}>{product.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="quick-actions">
          <span className="eyebrow eyebrow-light">QUICK ACTIONS</span>
          <button onClick={() => props.onNavigate('holds')}><span className="quick-action-icon coral-icon"><ClipboardList size={18} /></span><span><strong>Review hold bids</strong><small>Check offers and confirm a hold</small></span><ArrowRight size={16} /></button>
          <button onClick={() => props.onNavigate('loans')}><span className="quick-action-icon green-icon"><HeartHandshake size={18} /></span><span><strong>Review loan requests</strong><small>Keep each applicant moving</small></span><ArrowRight size={16} /></button>
        </div>
      </div>
      <InventoryActivity products={props.store.products} />
    </>
  )
}

function InventoryActivity(props: { products: Product[] }) {
  const total = props.products.length
  const statuses = [
    { label: 'Available', status: 'available', count: props.products.filter((product) => product.status === 'available').length },
    { label: 'Reserved', status: 'reserved', count: props.products.filter((product) => product.status === 'reserved').length },
    { label: 'Sold', status: 'sold', count: props.products.filter((product) => product.status === 'sold').length },
  ] as const

  return (
    <section className="panel inventory-activity">
      <div className="panel-title-row">
        <div><span className="eyebrow eyebrow-light">LIVE INVENTORY</span><h2>Inventory status</h2></div>
        <span className="count-pill">{total} total</span>
      </div>
      <div
        className="inventory-progress-track"
        role="img"
        aria-label={statuses.map(({ label, count }) => `${label}: ${count}`).join(', ')}
      >
        {statuses.map(({ label, status, count }) => (
          <span
            key={status}
            className={`inventory-progress-segment ${status}`}
            style={{ width: `${total === 0 ? 0 : (count / total) * 100}%` }}
            title={`${label}: ${count}`}
          />
        ))}
      </div>
      <div className="inventory-status-legend">
        {statuses.map(({ label, status, count }) => (
          <div key={status} className="inventory-status-item">
            <span className={`inventory-status-dot ${status}`} />
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function InventoryPanel(props: { products: Product[]; bids: Bid[]; onAdd: () => void; onEdit: (product: Product) => void; onSell: (id: string, referralCode?: string) => Promise<void>; onResolve: (id: string, action: 'confirm' | 'reject') => void }) {
  const [saleProduct, setSaleProduct] = useState<Product | null>(null)
  const [saleReferralCode, setSaleReferralCode] = useState('')
  const [saleError, setSaleError] = useState('')
  const [isSavingSale, setIsSavingSale] = useState(false)
  const confirmedBid = saleProduct && props.bids.find((bid) => bid.productId === saleProduct.id && bid.status === 'confirmed')
  const beginSale = (product: Product, confirmed: Bid | undefined) => {
    setSaleProduct(product)
    setSaleReferralCode(confirmed?.referralCode ?? '')
    setSaleError('')
  }
  const confirmSale = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const referralCode = saleReferralCode.trim().toUpperCase()
    if (referralCode && !referralCodePattern.test(referralCode)) {
      setSaleError('Enter a valid partner code in the format RF123456, or leave it blank.')
      return
    }
    if (!saleProduct) return
    setIsSavingSale(true)
    setSaleError('')
    try {
      await props.onSell(saleProduct.id, referralCode || undefined)
      setSaleProduct(null)
    } catch (error) {
      setSaleError(apiErrorMessage(error))
    } finally {
      setIsSavingSale(false)
    }
  }
  return <>
    <div className="admin-section-title"><div><span className="eyebrow eyebrow-light">WHAT'S ON THE SHELF</span><h2>Inventory</h2></div><button className="button button-dark button-small" onClick={props.onAdd}><Plus size={16} /> Add a listing</button></div>
    <div className="inventory-list">{props.products.map((product) => { const bids = props.bids.filter((bid) => bid.productId === product.id); const pending = bids.filter((bid) => bid.status === 'pending').sort((a, b) => b.amount - a.amount); const confirmed = bids.find((bid) => bid.status === 'confirmed'); return <article className="inventory-card" key={product.id}><img src={product.image} alt="" /><div className="inventory-main"><div className="inventory-title-line"><strong>{product.title}</strong><span className={`status-pill ${product.status}`}>{product.status}</span></div><span>{product.id} · {product.category} · {product.location}</span><b>{money(product.price)} <small>· {bids.length} bids</small></b></div><div className="inventory-actions"><button className="text-link" onClick={() => props.onEdit(product)}><Pencil size={13} /> Edit</button>{product.status === 'available' && pending.length > 0 && <button className="button button-outline button-small" onClick={() => props.onResolve(pending[0].id, 'confirm')}>Confirm top hold</button>}{product.status !== 'sold' && <button className="text-link" onClick={() => beginSale(product, confirmed)}>Mark sold <ArrowRight size={14} /></button>}{confirmed && <span className="confirmed-caption">Winner: {confirmed.bidderPhone}{confirmed.referralCode ? ` · ${confirmed.referralCode}` : ''}</span>}</div></article>})}</div>
    {saleProduct && <Modal onClose={() => { if (!isSavingSale) setSaleProduct(null) }} className="form-modal">
      <div className="modal-heading"><div className="modal-icon yellow-icon"><Tag size={20} /></div><button className="icon-button" onClick={() => setSaleProduct(null)} aria-label="Close" disabled={isSavingSale}><X size={20} /></button></div>
      <div className="eyebrow eyebrow-light">COMPLETE A SALE · {saleProduct.id}</div>
      <h2>Mark this item sold?</h2>
      <p className="modal-subtitle">{saleProduct.title}</p>
      <form className="form-stack" onSubmit={confirmSale}>
        <label className="field-label">User / partner referral code
          <input value={saleReferralCode} onChange={(event) => setSaleReferralCode(event.target.value)} placeholder="Optional, e.g. RF123456" autoComplete="off" disabled={Boolean(confirmedBid?.referralCode) || isSavingSale} />
        </label>
        <p className="fine-print">{saleReferralCode.trim()
          ? 'Confirming this sale will link the partner and queue a KSh 1,500 commission as pending.'
          : 'Enter the code from the WhatsApp message to allocate a commission. Leave blank if there was no referral.'}</p>
        {saleError && <p className="form-error">{saleError}</p>}
        <button type="submit" className="button button-dark full-button" disabled={isSavingSale}>
          {isSavingSale ? 'Recording sale…' : 'Confirm sale'} <Check size={16} />
        </button>
      </form>
    </Modal>}
  </>
}

function HoldsPanel(props: { bids: Bid[]; products: Product[]; onResolve: (id: string, action: 'confirm' | 'reject') => void }) {
  const sortedBids = [...props.bids].sort((a, b) => b.amount - a.amount)
  return <><div className="admin-section-title"><div><span className="eyebrow eyebrow-light">BUYER INTEREST</span><h2>Hold bids</h2></div><span className="count-pill">{props.bids.filter((bid) => bid.status === 'pending').length} open</span></div>{sortedBids.length === 0 ? <EmptyInline icon={<ClipboardList size={20} />} title="No hold bids yet." text="New buyer offers will appear here." /> : <div className="admin-card-list">{sortedBids.map((bid) => { const product = props.products.find((item) => item.id === bid.productId); return <div className="admin-record" key={bid.id}><div className="record-leading"><div className="record-icon coral-icon"><Package size={18} /></div><div><strong>{product?.title ?? 'Listing removed'}</strong><span>{bid.bidderPhone} · {new Date(bid.createdAt).toLocaleString()}</span><small>Asset {bid.productId}{bid.referralCode ? ` · referred by ${bid.referralCode}` : ''}</small></div></div><div className="record-trailing"><strong>{money(bid.amount)}</strong><span className={`status-pill ${bid.status}`}>{bid.status}</span>{bid.status === 'pending' && <div className="record-buttons"><button className="button button-success button-small" onClick={() => props.onResolve(bid.id, 'confirm')}><Check size={14} /> Confirm & reserve</button><button className="button button-reject button-small" onClick={() => props.onResolve(bid.id, 'reject')}>Decline</button></div>}</div></div>})}</div>}</>
}

function LoansAdminPanel(props: { loans: LoanApplication[]; onStatus: (id: string, status: LoanApplication['status']) => void }) {
  const nextStatus: Record<LoanApplication['status'], LoanApplication['status'] | null> = { submitted: 'reviewing', reviewing: 'approved', approved: 'disbursed', disbursed: null, declined: null, settled: null }
  const actionLabel: Partial<Record<LoanApplication['status'], string>> = { submitted: 'Start review', reviewing: 'Approve', approved: 'Mark disbursed' }
  return <><div className="admin-section-title"><div><span className="eyebrow eyebrow-light">BORROWER DESK</span><h2>Loan requests</h2></div><span className="count-pill">{props.loans.length} total</span></div>{props.loans.length === 0 ? <EmptyInline icon={<HeartHandshake size={20} />} title="No applications just yet." text="New asset finance requests will arrive here." /> : <div className="admin-card-list">{props.loans.map((loan) => <div className="admin-record loan-record" key={loan.id}><div className="record-leading"><div className="record-icon green-icon"><UserRound size={18} /></div><div><strong>{loan.borrowerName} <span className="record-id">{loan.id}</span></strong><span>{loan.phone} · ID {loan.nationalId}</span><small>Collateral: {loan.collateral}</small><small>{loan.termMonths} month{loan.termMonths === 1 ? '' : 's'} requested{loan.referralCode ? ` · referred by ${loan.referralCode}` : ''}</small></div></div><div className="record-trailing"><strong>{money(loan.principal)}</strong><span className={`status-pill ${loan.status}`}>{loan.status}</span>{nextStatus[loan.status] && <button className="button button-dark button-small" onClick={() => props.onStatus(loan.id, nextStatus[loan.status]!)}>{actionLabel[loan.status]} <ArrowRight size={14} /></button>}{loan.status !== 'declined' && loan.status !== 'disbursed' && loan.status !== 'settled' && <button className="text-link decline-link" onClick={() => props.onStatus(loan.id, 'declined')}>Decline request</button>}</div></div>)}</div>}</>
}

function PayoutsPanel(props: { referrals: StoreData['referrals']; products: Product[]; loans: LoanApplication[]; onPaid: (id: string) => void }) {
  const ordered = [...props.referrals].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return <><div className="admin-section-title"><div><span className="eyebrow eyebrow-light">PARTNER COMMISSIONS</span><h2>Payout ledger</h2></div><span className="count-pill">{props.referrals.filter((item) => item.status === 'pending').length} pending</span></div>{ordered.length === 0 ? <EmptyInline icon={<Wallet size={20} />} title="The payout ledger is clear." text="Commissions appear when a referred sale completes or a loan is disbursed." /> : <div className="admin-card-list">{ordered.map((referral) => { const label = referral.kind === 'buy' ? props.products.find((item) => item.id === referral.referenceId)?.title ?? 'Product sale' : props.loans.find((item) => item.id === referral.referenceId)?.borrowerName ?? 'Loan referral'; return <div className="admin-record" key={referral.id}><div className="record-leading"><div className="record-icon yellow-icon"><Wallet size={18} /></div><div><strong>{label}</strong><span>Partner {referral.referralCode} · {referral.kind === 'buy' ? 'sale commission' : 'loan origination'} </span><small>{new Date(referral.createdAt).toLocaleDateString()}</small></div></div><div className="record-trailing"><strong>{money(referral.amount)}</strong><span className={`status-pill ${referral.status}`}>{referral.status}</span>{referral.status === 'pending' && <button className="button button-success button-small" onClick={() => props.onPaid(referral.id)}><Check size={14} /> Mark paid</button>}</div></div>})}</div>}</>
}

function SettingsPanel(props: { monthlyRate: number | null; whatsappNumber: string; onSetRate: (rate: number | null) => Promise<void>; onWhatsAppNumber: (value: string) => Promise<void>; onReset: () => void; onNotice: (notice: Notice) => void }) {
  const [rate, setRate] = useState(props.monthlyRate === null ? '' : String(props.monthlyRate))
  const [phone, setPhone] = useState(props.whatsappNumber)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const saveRate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!rate) {
      setSaving(true)
      try {
        await props.onSetRate(null)
        props.onNotice({ title: 'Loan estimate disabled', text: 'The borrower form will not display an estimated interest amount.' })
      } catch (saveError) {
        setError(apiErrorMessage(saveError))
      } finally {
        setSaving(false)
      }
      return
    }
    const parsed = Number(rate)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) { setError('Use a monthly rate from 0 to 100 percent.'); return }
    setSaving(true)
    try {
      await props.onSetRate(parsed)
      props.onNotice({ title: 'Loan terms updated', text: 'The borrower form now shows an illustrative estimate at this flat monthly rate.' })
    } catch (saveError) {
      setError(apiErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }
  const savePhone = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const normalized = normalizeKenyanPhone(phone)
    if (!normalized) { setError('Use a valid Kenyan number, such as 0712 345 678.'); return }
    setSaving(true)
    try {
      await props.onWhatsAppNumber(normalized)
      setPhone(normalized)
      props.onNotice({ title: 'WhatsApp contact updated', text: 'Hold bid messages will use this number.' })
    } catch (saveError) {
      setError(apiErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <div className="admin-section-title"><div><span className="eyebrow eyebrow-light">MAKE IT YOURS</span><h2>Workspace settings</h2></div></div>
      <div className="settings-stack">
        <form className="panel settings-panel" onSubmit={saveRate}>
          <div className="settings-icon green-icon"><CircleDollarSign size={19} /></div>
          <div className="settings-copy">
            <h3>Illustrative loan rate</h3>
            <p>Flat monthly rate for a non-binding estimate on the borrower request form. Leave blank until your actual terms are agreed and approved.</p>
            <label className="field-label">Monthly rate (%)<input type="number" min="0" max="100" step="0.1" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Not configured" /></label>
            <small className="settings-warning">{props.monthlyRate === null ? 'No rate configured. The application form will not estimate a repayment amount.' : `Current setting: ${props.monthlyRate}% flat per month. Confirm legal and consumer disclosure requirements before use.`}</small>
            <button className="button button-dark button-small" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save rate'}</button>
          </div>
        </form>
        <form className="panel settings-panel" onSubmit={savePhone}>
          <div className="settings-icon coral-icon"><Smartphone size={19} /></div>
          <div className="settings-copy">
            <h3>WhatsApp business number</h3>
            <p>Used to open a pre-filled message after a buyer submits a hold bid.</p>
            <label className="field-label">Kenyan mobile number<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0712 345 678" /></label>
            <small className="settings-warning">Current number: {props.whatsappNumber}</small>
            <button className="button button-dark button-small" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save number'}</button>
          </div>
        </form>
        {error && <p className="form-error">{error}</p>}
        <div className="panel settings-panel reset-panel">
          <div className="settings-icon coral-icon"><SlidersHorizontal size={19} /></div>
          <div className="settings-copy">
            <h3>Reset demo data</h3>
            <p>Restore the sample inventory and remove demo bids, applications and commissions from the API database.</p>
            <button className="button button-reject button-small" onClick={props.onReset}>Restore starter data</button>
          </div>
        </div>
      </div>
    </>
  )
}

function ProductFormDialog(props: { product?: Product; onClose: () => void; onSave: (product: Product) => Promise<void> }) {
  const [form, setForm] = useState(() => ({
    title: props.product?.title ?? '',
    category: props.product?.category ?? 'Laptops',
    price: props.product ? String(props.product.price) : '',
    originalValue: props.product ? String(props.product.originalValue) : '',
    condition: props.product?.condition ?? 'B' as Product['condition'],
    location: props.product?.location ?? 'Nairobi CBD',
    image: props.product?.image ?? '',
    additionalImages: (props.product?.images ?? []).filter((image) => image !== props.product?.image).join('\n'),
    inspectionVideoUrl: props.product?.inspectionVideoUrl ?? '',
    description: props.product?.description ?? '',
    diagnosticNotes: props.product?.diagnosticNotes ?? '',
  }))
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (Number(form.price) <= 0 || Number(form.originalValue) < Number(form.price)) { setError('Enter a valid price, and make sure original value is at least the listed price.'); return }
    const images = form.additionalImages.split(/\r?\n/).map((image) => image.trim()).filter(Boolean)
    if (images.length > 5) { setError('Add no more than five additional image URLs.'); return }
    setIsSubmitting(true)
    try {
      await props.onSave({
        id: props.product?.id ?? makeId('RF'),
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        diagnosticNotes: form.diagnosticNotes.trim(),
        originalValue: Number(form.originalValue),
        price: Number(form.price),
        condition: form.condition,
        status: props.product?.status ?? 'available',
        location: form.location,
        image: form.image.trim() || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85',
        images,
        inspectionVideoUrl: form.inspectionVideoUrl.trim() || null,
        createdAt: props.product?.createdAt ?? new Date().toISOString(),
      })
    } catch (submitError) {
      setError(apiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Modal onClose={props.onClose} className="form-modal add-product-modal">
      <div className="modal-heading"><div className="modal-icon green-icon"><ImagePlus size={20} /></div><button className="icon-button" onClick={props.onClose} aria-label="Close"><X size={20} /></button></div>
      <div className="eyebrow eyebrow-light">{props.product ? `EDIT LISTING · ${props.product.id}` : 'ADD TO THE MARKET'}</div>
      <h2>{props.product ? 'Update this listing.' : 'List a good find.'}</h2>
      <form className="form-stack" onSubmit={submit}>
        <div className="form-grid">
          <label className="field-label">Product name<input value={form.title} onChange={(event) => update('title', event.target.value)} required /></label>
          <label className="field-label">Category<select value={form.category} onChange={(event) => update('category', event.target.value)}>{!categories.slice(1).includes(form.category) && <option>{form.category}</option>}{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="field-label">Listed price (KSh)<input type="number" min="1" value={form.price} onChange={(event) => update('price', event.target.value)} required /></label>
          <label className="field-label">Original value (KSh)<input type="number" min="1" value={form.originalValue} onChange={(event) => update('originalValue', event.target.value)} required /></label>
          <label className="field-label">Condition grade<select value={form.condition} onChange={(event) => update('condition', event.target.value as Product['condition'])}><option>A</option><option>B</option><option>C</option></select></label>
          <label className="field-label">Pickup location<input value={form.location} onChange={(event) => update('location', event.target.value)} required /></label>
          <label className="field-label field-wide">Image URL<input type="url" value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="Optional — paste a hosted image URL" /></label>
          <label className="field-label field-wide">Additional image URLs<textarea rows={3} value={form.additionalImages} onChange={(event) => update('additionalImages', event.target.value)} placeholder="One image URL per line (up to 5)" /></label>
          <label className="field-label field-wide">Inspection video URL<input type="url" value={form.inspectionVideoUrl} onChange={(event) => update('inspectionVideoUrl', event.target.value)} placeholder="Optional — direct MP4 or WebM video URL" /></label>
          <label className="field-label field-wide">Short description<textarea rows={2} value={form.description} onChange={(event) => update('description', event.target.value)} required /></label>
          <label className="field-label field-wide">Inspection notes<textarea rows={3} value={form.diagnosticNotes} onChange={(event) => update('diagnosticNotes', event.target.value)} required /></label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="button button-dark full-button">
          {props.product ? <Check size={16} /> : <Plus size={16} />}
          {isSubmitting ? (props.product ? 'Saving changes…' : 'Publishing…') : (props.product ? 'Save changes' : 'Publish listing')}
        </button>
      </form>
    </Modal>
  )
}

function AdminLoginPage(props: { onLogin: (email: string, password: string) => Promise<void>; onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await props.onLogin(email.trim(), password)
    } catch (loginError) {
      setError(apiErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <button className="admin-login-back" onClick={props.onBack}><ArrowLeft size={15} /> Back to marketplace</button>
      <section className="admin-login-card">
        <div className="admin-login-brand"><span className="brand-mark"><Package size={19} /></span><span className="brand-name"><span className="brand-name-primary">A+ Loans</span><span className="brand-name-secondary"><span>&amp;</span> Inv.</span></span></div>
        <div className="admin-login-icon"><ShieldCheck size={22} /></div>
        <div className="eyebrow eyebrow-light">AUTHORIZED PERSONNEL</div>
        <h1>Platform control center</h1>
        <p className="admin-login-copy">Sign in with your administrator account to manage listings, applications and payouts.</p>
        <form className="form-stack admin-login-form" onSubmit={submit}>
          <label className="field-label">Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="field-label">Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark full-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Authenticating…' : 'Secure log in'} <ArrowRight size={16} /></button>
        </form>
        <p className="admin-login-note"><ShieldCheck size={15} /> Admin access is verified by the FastAPI backend.</p>
      </section>
    </main>
  )
}

function SignInDialog(props: { onClose: () => void; onSignIn: (name: string, phone: string) => Promise<boolean> }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) { setError('Enter your name to continue.'); return }
    setError('')
    setIsSubmitting(true)
    try {
      const signedIn = await props.onSignIn(name, phone)
      if (!signedIn) setError('Enter a valid Kenyan phone number.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return <Modal onClose={props.onClose} className="form-modal signin-modal"><div className="modal-heading"><div className="modal-icon green-icon"><UserRound size={20} /></div><button className="icon-button" onClick={props.onClose} aria-label="Close"><X size={20} /></button></div><div className="eyebrow eyebrow-light">PARTNER PORTAL</div><h2>Let’s get you started.</h2><p className="modal-subtitle">Create a partner profile to get your personal referral link.</p><form className="form-stack" onSubmit={submit}><label className="field-label">Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Brian Mwangi" required /></label><label className="field-label">Mobile number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0712 345 678" required /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark full-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Opening your portal…' : 'Create partner profile'} <ArrowRight size={16} /></button></form><p className="demo-disclaimer"><ShieldCheck size={15} /> Partner profile is a local demo and does not authenticate identity.</p></Modal>
}

function PortalPrompt(props: { onClick: () => void }) {
  return <main className="portal-prompt content-width"><div className="prompt-symbol"><UserRound size={26} /></div><div className="eyebrow eyebrow-light">PARTNER SPACE</div><h1>A little extra, <span>for the connectors.</span></h1><p>Sign in to create your referral link and see commissions from completed sales and disbursed loans.</p><button className="button button-dark" onClick={props.onClick}>Open expert portal <ArrowRight size={16} /></button><span className="demo-disclaimer"><ShieldCheck size={15} /> Demo mode — partner details are saved only in this browser.</span></main>
}

function Footer(props: {
  onMarket: () => void
  onLoans: () => void
  onExpert: () => void
  onAdmin: () => void
  onPublicPage: (page: PublicPage) => void
}) {
  return (
    <footer className="site-footer"><div className="footer-inner content-width"><div><button className="brand footer-brand" onClick={props.onMarket} aria-label="A+ Loans & Investments home"><span className="brand-mark"><Package size={19} strokeWidth={2.6} /></span><span className="brand-name"><span className="brand-name-primary">A+ Loans</span><span className="brand-name-secondary"><span>&amp;</span> Inv.</span></span></button><p>Good finds, fair deals, and a little more life in the things we use.</p></div><div className="footer-links"><button onClick={props.onLoans}>Asset finance</button><button onClick={props.onExpert}>Partner with us</button><button onClick={props.onAdmin}>Staff sign in</button><button onClick={props.onMarket}>Browse the market</button>{publicPageLinks.map((item) => <button key={item.page} onClick={() => props.onPublicPage(item.page)}>{item.label}</button>)}</div><div className="footer-bottom"><span>Made for the next chapter.</span><span>© {new Date().getFullYear()} A+ Loans & Investments · Demonstration build</span></div></div></footer>
  )
}

function Modal(props: { children: React.ReactNode; onClose: () => void; className?: string }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') props.onClose() }
    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [props.onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose() }}><section className={`modal-card ${props.className ?? ''}`} role="dialog" aria-modal="true">{props.children}</section></div>
}

function Toast(props: { notice: Notice; onClose: () => void }) {
  return <div className={`toast ${props.notice.kind === 'error' ? 'toast-error' : ''}`} role="status"><span className="toast-icon">{props.notice.kind === 'error' ? <X size={16} /> : <Check size={17} />}</span><span><strong>{props.notice.title}</strong>{props.notice.text && <small>{props.notice.text}</small>}</span><button onClick={props.onClose} aria-label="Dismiss"><X size={16} /></button></div>
}

function StatCard(props: { label: string; value: string; icon: React.ReactNode; detail: string; accent?: boolean }) {
  return <article className={`stat-card ${props.accent ? 'stat-accent' : ''}`}><div className="stat-top"><span>{props.label}</span><span className="stat-icon">{props.icon}</span></div><strong><AnimatedMetric value={props.value} /></strong><small>{props.detail}</small></article>
}

function AnimatedMetric(props: { value: string }) {
  const numericValue = /^\d+$/.test(props.value) ? Number(props.value) : null
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (numericValue === null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(numericValue)
      return
    }

    setCount(0)
    const duration = 700
    let startTime: number | null = null
    let frame = 0
    const animate = (time: number) => {
      startTime ??= time
      const progress = Math.min((time - startTime) / duration, 1)
      setCount(Math.round(numericValue * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = window.requestAnimationFrame(animate)
    }
    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [numericValue])

  return <>{numericValue === null ? props.value : count.toLocaleString()}</>
}

function EmptyInline(props: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="empty-inline"><span>{props.icon}</span><strong>{props.title}</strong><p>{props.text}</p></div>
}

export default App
