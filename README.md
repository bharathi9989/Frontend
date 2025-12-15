🎯 Auction Platform – Frontend

A modern, real-time auction frontend built with React, Vite, TailwindCSS, and Socket.IO.
Designed for buyers and sellers, supporting live bidding, multiple auction types, dashboards, and a cinematic UI experience.

⸻

🚀 Tech Stack
• React (Vite)
• React Router DOM
• TailwindCSS
• Axios
• Socket.IO Client
• Context API (Auth State)
• Date-fns
• Framer Motion / CSS Animations

⸻

✨ Features

👤 User Authentication
• Login & Registration
• JWT-based session handling
• Role-based UI (Buyer / Seller)
• Auto session restore from localStorage

🏪 Buyer Features
• Browse live, upcoming, and closed auctions
• View detailed auction pages
• Place bids in:
• Traditional auctions
• Reverse auctions
• Sealed bid auctions
• Real-time bid updates (Socket.IO)
• Bid history dashboard
• Profile management & notification settings

🧑‍💼 Seller Features
• Seller dashboard with stats
• Product management (CRUD)
• Inventory tracking (unsold items)
• Create auctions from products
• Close auctions manually
• Re-list unsold items

⏱️ Real-Time UX
• Live bid updates without refresh
• Auction countdown timers
• Auction auto-close UI updates
• Optimistic UI for bidding
• Disabled actions based on auction state

🎨 UI / UX
• Fully responsive layout
• Amazon-inspired auction UX
• Cinematic landing page
• Animated cards & buttons
• Clean dashboard layouts

⸻

🗂️ Folder Structure

src/
├── components/
│ ├── Auth/
│ │ ├── Login.jsx
│ │ ├── Register.jsx
│ │ └── ProtectedRoute.jsx
│ ├── Auctions/
│ │ ├── AuctionCard.jsx
│ │ ├── AuctionDetails.jsx
│ │ ├── BidForm.jsx
│ │ └── AuctionList.jsx
│ ├── Buyer/
│ │ ├── BuyerDashboard.jsx
│ │ ├── BidHistory.jsx
│ │ └── Profile.jsx
│ ├── Seller/
│ │ ├── SellerDashboard.jsx
│ │ ├── ProductManagement.jsx
│ │ ├── CreateAuction.jsx
│ │ └── InventoryList.jsx
│ ├── Layout/
│ │ ├── Navbar.jsx
│ │ ├── Footer.jsx
│ │ └── Sidebar.jsx
│ └── Common/
│ ├── CountdownTimer.jsx
│ ├── Loading.jsx
│ └── Modal.jsx
├── pages/
│ ├── Home.jsx
│ ├── NotFound.jsx
│ └── Unauthorized.jsx
├── context/
│ ├── AuthContext.jsx
│ └── AuctionContext.jsx
├── hooks/
│ ├── useAuth.js
│ ├── useSocket.js
│ └── useFetch.js
├── services/
│ ├── api.js
│ └── socket.js
├── styles/
│ └── globals.css
├── utils/
│ ├── formatters.js
│ └── validators.js
├── App.jsx
└── main.jsx

🔌 Real-Time Events (Socket.IO)

Subscribed Events
• newBid
• auctionClosed

Emitted Events
• joinAuction
• leaveAuction

⸻

🧠 Key UX Decisions
• Live UI updates without refresh after bids
• Disable bid form when auction is not live
• Minimum bid auto-calculation
• Reverse auction logic handled client-side
• Graceful fallback when socket disconnects

⸻

🛡️ Error Handling
• API error messages shown inline
• Auth failures auto-logout user
• Defensive rendering for missing data
• Fallback UI when backend data is partial

⸻

📦 Build for Production

     npm run build

Deploy the dist/ folder to:
• Netlify
• Vercel

⸻

📌 Notes
• No company branding included
• Open-source compliant
• UI optimized for assessment review
• Built to mirror real-world production apps

⸻

👨‍💻 Author

Velubharathi Saravanan
Full-Stack MERN Developer
