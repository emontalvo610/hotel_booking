export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hotel Booking
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Welcome to your hotel booking application
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">🏨 Browse Hotels</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Discover amazing hotels around the world
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">📅 Easy Booking</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Book your stay in just a few clicks
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">💰 Best Prices</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Get the best deals on your bookings
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

