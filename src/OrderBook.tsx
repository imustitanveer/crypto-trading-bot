import { ScrollArea } from "@/components/ui/scroll-area";
import { useAutoTradeContext } from "./AutoTradeContext";

function OrderBook() {
  const { orders } = useAutoTradeContext();

  // Sort orders descending by tradeStartTime.
  const sortedOrders = [...orders].sort(
    (a, b) => Number(b.tradeStartTime) - Number(a.tradeStartTime)
  );

  return (
    <div>
      <ScrollArea className="h-[150px] w-full rounded-md text-white p-4 bg-gray-800">
        {sortedOrders.length === 0 ? (
          <div className="text-gray-500">No orders yet.</div>
        ) : (
          sortedOrders.map((order) => (
            <div key={order.id} className="mb-2 border-b pb-2">
              <div>
                <strong>Position:</strong> {order.position}
              </div>
              <div>
                <strong>Leverage:</strong> {order.leverage}
              </div>
              <div>
                <strong>Entry Price:</strong> ${order.entryPrice.toFixed(2)}
              </div>
              <div>
                <strong>Amount:</strong> ${order.tradeAmount}
              </div>
              {order.status === "closed" ? (
                <div>
                  <strong>P/L:</strong>{" "}
                  <span
                    className={
                      order.pnl && order.pnl > 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    ${order.pnl?.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="text-green-500">Open</span>
                </div>
              )}
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
}

export default OrderBook;
