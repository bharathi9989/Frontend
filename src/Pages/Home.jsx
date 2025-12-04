export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800 
    flex items-center justify-center p-6 animate-fadeIn">

      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-xl">
          Welcome to the Auction Platform 🔥
        </h1>

        <p className="text-lg text-white/80 mb-6">
          Buy, Sell, and Bid in Real-Time.  
          Join Thousands of Smart Buyers & Sellers.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <a
            href="/register"
            className="px-6 py-3 rounded-xl bg-white/20 border border-white/30 
            hover:bg-white/30 transition shadow-lg"
          >
            Get Started
          </a>

          <a
            href="/login"
            className="px-6 py-3 rounded-xl bg-white/20 border border-white/30 
            hover:bg-white/30 transition shadow-lg"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}