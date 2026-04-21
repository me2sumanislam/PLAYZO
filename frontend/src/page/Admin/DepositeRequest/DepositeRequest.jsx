 import React from "react";

const DepositRequests = () => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h3 className="font-black mb-4">Deposit Requests</h3>

      <div className="border rounded-xl p-3 mb-3">
        <p>User: Rahim</p>
        <p>Amount: ৳500</p>
        <p>TRX: ABC12345</p>

        <div className="flex gap-2 mt-3">
          <button className="flex-1 bg-green-500 text-white py-2 rounded-xl">
            Approve
          </button>
          <button className="flex-1 bg-red-500 text-white py-2 rounded-xl">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositRequests;