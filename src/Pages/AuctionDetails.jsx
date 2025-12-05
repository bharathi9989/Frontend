import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { initSocket, getSocket } from "../utils/socket";

export default function AuctionDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [newBid, setNewBid] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/auctions/${id}`);
        setAuction(res.data.auction || res.data);
        setBids(res.data.bids || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // socket init & listeners
  useEffect(() => {
    initSocket(); // connect
    const socket = getSocket();
    if (!socket) return;

    socket.emit("joinAuction", id);

    const onNewBid = (payload) => {
      if (payload.auctionId === id) {
        // refresh bids depending on auction type/sealed rules
        setBids((prev) => [payload, ...prev]);
      }
    };

    const onAuctionClosed = (payload) => {
      if (payload.auctionId === id) {
        // update auction status
        setAuction((a) => ({ ...a, status: "closed" }));
      }
    };

    socket.on("newBid", onNewBid);
    socket.on("auctionClosed", onAuctionClosed);

    return () => {
      socket.emit("leaveAuction", id);
      socket.off("newBid", onNewBid);
      socket.off("auctionClosed", onAuctionClosed);
    };
  }, [id]);

  const placeBid = async (e) => {
    e.preventDefault();
    if (!user) return alert("Login to bid");
    try {
      const res = await api.post("/bids", {
        auctionId: id,
        amount: Number(newBid),
      });
      // server will emit newBid; optimistic update optional
      setNewBid("");
    } catch (err) {
      alert(err.response?.data?.message || "Bid failed");
    }
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!auction) return <div className="p-6 text-white">Auction not found</div>;

  return (
    <div className="min-h-screen p-6 pt-28 text-white">
      <div className="max-w-4xl mx-auto bg-white/5 p-6 rounded-2xl">
        <h1 className="text-2xl font-bold">{auction.product?.title}</h1>
        <p className="text-sm text-white/70">{auction.product?.description}</p>

        <div className="mt-4">
          <strong>Status:</strong> {auction.status}
        </div>

        <div className="mt-6">
          <form onSubmit={placeBid} className="flex gap-2">
            <input
              type="number"
              value={newBid}
              onChange={(e) => setNewBid(e.target.value)}
              placeholder="Your bid amount"
              className="p-2 rounded bg-white/10 outline-none"
            />
            <button className="px-4 py-2 bg-green-600 rounded">
              Place Bid
            </button>
          </form>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Bids</h3>
          <ul className="space-y-2">
            {bids.length === 0 && (
              <li className="text-sm text-white/60">No public bids yet</li>
            )}
            {bids.map((b) => (
              <li
                key={b._id || b.time}
                className="flex justify-between bg-white/5 p-2 rounded"
              >
                <div>
                  {b.bidder?.name ||
                    b.bidder?.id ||
                    b.bidder?.email ||
                    "Sealed"}
                </div>
                <div className="font-semibold">₹{b.amount}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
