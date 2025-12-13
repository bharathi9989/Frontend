import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { HiLightningBolt, HiCash, HiClock, HiTrendingUp } from "react-icons/hi";
import FeaturedAuctions from "../components/FeaturedAuctions";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Magnetic Button Effect
export const useMagnetic = () => {
  useEffect(() => {
    
    const buttons = document.querySelectorAll(".magnetic-btn");

    const activateMagnet = (e, btn) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    };

    const resetMagnet = (btn) => {
      btn.style.transform = `translate(0,0)`;
    };

    buttons.forEach((btn) => {
      btn.addEventListener("mousemove", (e) => activateMagnet(e, btn));
      btn.addEventListener("mouseleave", () => resetMagnet(btn));
    });

    return () => {
      buttons.forEach((btn) => {
        btn.removeEventListener("mousemove", activateMagnet);
        btn.removeEventListener("mouseleave", resetMagnet);
      });
    };
  }, []);
};

export default function Home() {
  useMagnetic();
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[#0F1117] text-white overflow-hidden">
      {/* ========================== HERO SECTION ========================== */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        {/* 🔥 SMOKE LAYER */}
        <div className="smoke-layer"></div>

        {/* 🔥 WATERFALL EFFECT */}
        <div className="waterfall"></div>

        {/* ✨ PARTICLES */}
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}

        {/* ⚡ NEON STREAKS */}
        <div className="neon-streak" style={{ top: "20%" }} />
        <div
          className="neon-streak"
          style={{ top: "50%", animationDelay: "1s" }}
        />
        <div
          className="neon-streak"
          style={{ top: "75%", animationDelay: "2s" }}
        />

        {/* 🌀 3D ROTATING GLASS CUBE */}
        <div className="absolute top-32">
          <div className="cube">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="cube-face" />
            ))}
          </div>
        </div>

        {/* HERO TEXT */}
        <h1 className="text-6xl md:text-7xl font-extrabold drop-shadow-xl mt-56">
          The Future of <span className="text-yellow-300">Auctions</span> is
          Here ⚡
        </h1>

        <p className="text-white/70 text-xl mt-6 max-w-3xl mx-auto">
          Real-time bidding. Futuristic UI. Cinematic effects. Welcome to the
          next-gen auction experience.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex gap-6 mt-10">
          <Link
            to="/buyer/auctions"
            className="liquid-btn magnetic-btn px-8 py-3 bg-red-400 text-black font-bold rounded-xl shadow-xl hover:bg-blue-400 transition"
          >
            🔥 Explore Auctions
          </Link>

          {!user && (
            <Link
              to="/register"
              className="liquid-btn magnetic-btn px-8 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition"
            >
              Create Account
            </Link>
          )}

          {user && (
            <Link
              to={
                user.role === "seller" ? "/seller/dashboard" : "/buyer/profile"
              }
              className="liquid-btn magnetic-btn px-8 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* ========================== FEATURES SECTION ========================== */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-5xl font-extrabold text-center mb-16 tracking-tight">
          Why Choose <span className="text-yellow-300">Auction Pro?</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
          {/* CARD 1 */}
          <div
            className="group bg-white/5 border border-white/10 p-10 rounded-2xl 
                    shadow-xl backdrop-blur-xl relative overflow-hidden
                    transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 
                      group-hover:opacity-20 transition"
            ></div>

            <HiLightningBolt
              className="text-yellow-400 text-6xl mx-auto mb-5 
                                  group-hover:scale-110 transition-transform"
            />

            <h3 className="text-2xl font-bold mb-3">Real-Time Bidding</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Lightning-fast updates through advanced WebSocket technology.
            </p>
          </div>

          {/* CARD 2 */}
          <div
            className="group bg-white/5 border border-white/10 p-10 rounded-2xl 
                    shadow-xl backdrop-blur-xl relative overflow-hidden
                    transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 
                      group-hover:opacity-20 transition"
            ></div>

            <HiCash
              className="text-green-400 text-6xl mx-auto mb-5 
                         group-hover:scale-110 transition-transform"
            />

            <h3 className="text-2xl font-bold mb-3">Fair & Secure</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Total transparency with encrypted payment workflows.
            </p>
          </div>

          {/* CARD 3 */}
          <div
            className="group bg-white/5 border border-white/10 p-10 rounded-2xl 
                    shadow-xl backdrop-blur-xl relative overflow-hidden
                    transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 
                      group-hover:opacity-20 transition"
            ></div>

            <HiClock
              className="text-blue-400 text-6xl mx-auto mb-5 
                          group-hover:scale-110 transition-transform"
            />

            <h3 className="text-2xl font-bold mb-3">Timed Auctions</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Auto-start & auto-close handled by intelligent scheduler.
            </p>
          </div>

          {/* CARD 4 */}
          <div
            className="group bg-white/5 border border-white/10 p-10 rounded-2xl 
                    shadow-xl backdrop-blur-xl relative overflow-hidden
                    transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 
                      group-hover:opacity-20 transition"
            ></div>

            <HiTrendingUp
              className="text-pink-400 text-6xl mx-auto mb-5 
                              group-hover:scale-110 transition-transform"
            />

            <h3 className="text-2xl font-bold mb-3">Best Deals</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Win high-value premium products at unbelievable prices.
            </p>
          </div>
        </div>
      </section>

      {/* ========================== FLOATING AUCTION PREVIEW ========================== */}
      <FeaturedAuctions />
      {/* ========================== PARALLAX SECTION ========================== */}
      <section
        className="parallax-section h-[60vh] flex items-center justify-center text-white text-5xl font-bold"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d')",
        }}
      >
        Elevate Your Auction Experience 🚀
        
      </section>
    </div>
  );
}
