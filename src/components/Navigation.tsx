import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏨</span>
            <span className="text-xl font-bold text-gray-900">Hotel Booking</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Search
            </Link>
            <Link 
              href="/my-bookings" 
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              My Bookings
            </Link>
            <Link 
              href="/admin/inventory" 
              className="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

