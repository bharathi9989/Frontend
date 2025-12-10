export default function ProductCard({ product, onEdit, onDelete }) {
  const sellerId = product.seller && (product.seller._id || product.seller);
  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/10 shadow-lg text-white">
      {/* Image */}
      <div className="h-40 w-full rounded-lg overflow-hidden mb-3 bg-black/20 flex items-center justify-center">
        {product.images?.length ? (
          <img src={product.images[0]} className="object-cover h-full w-full" />
        ) : (
          <p className="text-white/40">No Image</p>
        )}
      </div>

      <h3 className="text-xl font-semibold">{product.title}</h3>
      <p className="text-white/70 text-sm">{product.category}</p>
      <p className="text-white/50 text-xs line-clamp-2 mt-1">
        {product.description}
      </p>

      <div className="flex justify-between items-center mt-4">
        <span className="text-white/70 text-sm">
          Stock: <b>{product.inventoryCount}</b>
        </span>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 bg-yellow-500 text-black rounded-md"
          >
            Edit
          </button>
          {product.status === "unsold" && (
            <button
              onClick={() => onRelist(product)}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Re-List Product
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-500 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
