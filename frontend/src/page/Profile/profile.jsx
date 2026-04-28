 import React, { useState } from "react";
 import AddMoneyModal from "../../Component/Addmoney/AddMoney"; // ← same folder এ রাখলে এই path
 
 const Profile = ({ onLogout, onWallet, onWithdraw }) => {
   const [showAddMoney, setShowAddMoney] = useState(false);
 
   const menuItems = [
     { id: "wallet",      label: "Wallet",            icon: "👛" },
     { id: "withdraw",    label: "Withdraw",           icon: "💵" },
     { id: "my_profile",  label: "My Profile",         icon: "👤" },
     { id: "all_rules",   label: "All Rules",          icon: "📋" },
     { id: "top_players", label: "Top Players",        icon: "📈" },
     { id: "dev_profile", label: "Developer Profile",  icon: "📂" },
   ];
 
   const handleNavigate = (id) => {
     if (id === "wallet")   setShowAddMoney(true); // ← wallet click → modal open
     if (id === "withdraw") onWithdraw?.();
   };
 
   const handleAddMoneySubmit = async ({ method, amount, trxId }) => {
     try {
       const res = await fetch("http://localhost:5000/api/wallet/deposit", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ method, amount, trxId }),
       });
       const data = await res.json();
       if (!data.success) throw new Error(data.message);
     } catch (err) {
       console.error("Deposit error:", err);
     }
   };
 
   return (
     <div className="bg-white min-h-screen pb-10">
 
       {/* Header */}
       <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] pt-12 pb-8 text-center text-white">
         <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">
           👨‍💻
         </div>
         <h2 className="text-xl font-bold">sumon2233555</h2>
       </div>
 
       {/* Menu List */}
       <div className="mt-4 px-2">
         {menuItems.map((item) => (
           <button
             key={item.id}
             onClick={() => handleNavigate(item.id)}
             className="w-full flex justify-between p-4 border-b"
           >
             <div className="flex gap-4">
               <span>{item.icon}</span>
               <span className="font-bold text-sm">{item.label}</span>
             </div>
             <span>›</span>
           </button>
         ))}
       </div>
 
       {/* Logout */}
       <div className="px-8 mt-12">
         <button
           onClick={onLogout}
           className="w-full bg-blue-500 text-white py-3 rounded-full font-bold"
         >
           Logout
         </button>
       </div>
 
       {/* Add Money Modal */}
       <AddMoneyModal
         isOpen={showAddMoney}
         onClose={() => setShowAddMoney(false)}
         onSubmit={handleAddMoneySubmit}
       />
     </div>
   );
 };
 
 export default Profile;
 