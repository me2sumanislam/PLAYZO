 import { useState } from "react";
 
 // ✅ Admin panel থেকে এই number change করতে পারবেন — DB/API থেকে আনুন
 const PAYMENT_NUMBER = "01567868517";
 
 const METHODS = [
   {
     id: "bkash",
     label: "bKash",
     initial: "b",
     color: "#E2136E",
     bg: "#fff0f6",
     border: "#E2136E55",
   },
   {
     id: "nagad",
     label: "Nagad",
     initial: "N",
     color: "#F05A22",
     bg: "#fff5f0",
     border: "#F05A2255",
   },
   {
     id: "rocket",
     label: "Rocket",
     initial: "R",
     color: "#8C1A6A",
     bg: "#fdf0fa",
     border: "#8C1A6A55",
   },
 ];
 
 export default function AddMoneyModal({ isOpen, onClose, onSubmit }) {
   const [selected, setSelected] = useState(null);
   const [amount, setAmount] = useState("");
   const [trxId, setTrxId] = useState("");
   const [copied, setCopied] = useState(false);
   const [submitted, setSubmitted] = useState(false);
   const [error, setError] = useState("");
 
   const method = METHODS.find((m) => m.id === selected);
 
   const handleCopy = () => {
     navigator.clipboard.writeText(PAYMENT_NUMBER).then(() => {
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
     });
   };
 
   const handleConfirm = () => {
     setError("");
     if (!selected) return setError("Payment method বেছে নিন।");
     if (!amount || parseFloat(amount) <= 0) return setError("সঠিক Amount দিন।");
     if (!trxId.trim()) return setError("TrxID দিন।");
 
     // parent-এ data পাঠান (API call এখানে বা onSubmit-এ করুন)
     onSubmit?.({ method: selected, amount: parseFloat(amount), trxId: trxId.trim() });
     setSubmitted(true);
   };
 
   const handleClose = () => {
     setSelected(null);
     setAmount("");
     setTrxId("");
     setCopied(false);
     setSubmitted(false);
     setError("");
     onClose();
   };
 
   if (!isOpen) return null;
 
   return (
     <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
       <div style={styles.modal}>
         {/* Header */}
         <div style={styles.header}>
           <span style={styles.title}>Add Money</span>
           <button style={styles.closeBtn} onClick={handleClose}>×</button>
         </div>
 
         {/* Body */}
         <div style={styles.body}>
           {submitted ? (
             /* ✅ Success Screen */
             <div style={styles.successBox}>
               <div style={{ ...styles.successIcon, background: method.bg, color: method.color }}>✓</div>
               <p style={styles.successTitle}>Request Submitted!</p>
               <p style={styles.successSub}>Payment verify হলে wallet-এ যোগ হবে।</p>
               <div style={styles.summaryBox}>
                 {[
                   ["Method", method.label],
                   ["Amount", `৳${parseFloat(amount).toFixed(0)}`],
                   ["TrxID", trxId],
                 ].map(([k, v]) => (
                   <div key={k} style={styles.summaryRow}>
                     <span style={styles.summaryKey}>{k}</span>
                     <span style={{ ...styles.summaryVal, fontFamily: k === "TrxID" ? "monospace" : "inherit" }}>{v}</span>
                   </div>
                 ))}
               </div>
               <button style={styles.closeOutlineBtn} onClick={handleClose}>Close</button>
             </div>
           ) : (
             <>
               {/* Step 1 — Select Method */}
               <p style={styles.stepLabel}>১. Payment method বেছে নিন</p>
               <div style={styles.methodGrid}>
                 {METHODS.map((m) => (
                   <button
                     key={m.id}
                     onClick={() => setSelected(m.id)}
                     style={{
                       ...styles.methodCard,
                       borderColor: selected === m.id ? m.color : "#e0e0e0",
                       background: selected === m.id ? m.bg : "#fff",
                       borderWidth: selected === m.id ? 2 : 1.5,
                     }}
                   >
                     <div style={{ ...styles.methodIcon, background: m.color }}>{m.initial}</div>
                     <span style={styles.methodName}>{m.label}</span>
                   </button>
                 ))}
               </div>
 
               {/* Step 2 — Number + Copy */}
               {method && (
                 <>
                   <p style={styles.stepLabel}>২. এই নম্বরে Send Money করুন</p>
                   <div style={{ ...styles.sendBox, background: method.bg, borderColor: method.border }}>
                     <p style={{ ...styles.sendBoxLabel, color: method.color }}>{method.label} Number</p>
                     <div style={styles.sendRow}>
                       <span style={styles.sendNumber}>{PAYMENT_NUMBER}</span>
                       <button
                         onClick={handleCopy}
                         style={{ ...styles.copyBtn, borderColor: method.color, color: method.color }}
                       >
                         {copied ? "✓ Copied!" : "⎘ Copy"}
                       </button>
                     </div>
                   </div>
 
                   {/* Step 3 — Amount + TrxId */}
                   <p style={styles.stepLabel}>৩. Payment details দিন</p>
                   <div style={styles.formGroup}>
                     <label style={styles.formLabel}>Amount (টাকা)</label>
                     <input
                       style={styles.input}
                       type="number"
                       min="1"
                       placeholder="কত টাকা পাঠিয়েছেন?"
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                     />
                   </div>
                   <div style={styles.formGroup}>
                     <label style={styles.formLabel}>Transaction ID (TrxID)</label>
                     <input
                       style={styles.input}
                       type="text"
                       placeholder="যেমন: 8K9J2T4XYZ"
                       value={trxId}
                       onChange={(e) => setTrxId(e.target.value)}
                     />
                   </div>
 
                   {error && <p style={styles.errorText}>{error}</p>}
 
                   <button
                     onClick={handleConfirm}
                     style={{ ...styles.confirmBtn, background: method.color }}
                   >
                     Confirm Payment
                   </button>
                 </>
               )}
             </>
           )}
         </div>
       </div>
     </div>
   );
 }
 
 /* ---- Styles ---- */
 const styles = {
   overlay: {
     position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
     display: "flex", alignItems: "center", justifyContent: "center",
     zIndex: 1000, padding: 16,
   },
   modal: {
     background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
     boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden",
   },
   header: {
     padding: "16px 20px", borderBottom: "1px solid #f0f0f0",
     display: "flex", alignItems: "center", justifyContent: "space-between",
   },
   title: { fontSize: 16, fontWeight: 600, color: "#1a1a1a" },
   closeBtn: {
     width: 28, height: 28, borderRadius: "50%", border: "1px solid #ddd",
     background: "transparent", cursor: "pointer", fontSize: 18, lineHeight: 1,
     display: "flex", alignItems: "center", justifyContent: "center", color: "#666",
   },
   body: { padding: "18px 20px" },
   stepLabel: { fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 10, letterSpacing: "0.03em" },
   methodGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 },
   methodCard: {
     border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "12px 8px",
     cursor: "pointer", display: "flex", flexDirection: "column",
     alignItems: "center", gap: 6, transition: "all 0.15s",
   },
   methodIcon: {
     width: 40, height: 40, borderRadius: "50%", color: "#fff",
     display: "flex", alignItems: "center", justifyContent: "center",
     fontSize: 16, fontWeight: 600,
   },
   methodName: { fontSize: 12, fontWeight: 600, color: "#333" },
   sendBox: {
     borderRadius: 10, padding: "12px 14px", marginBottom: 16,
     border: "1px solid",
   },
   sendBoxLabel: { fontSize: 11, fontWeight: 600, marginBottom: 6 },
   sendRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
   sendNumber: { fontSize: 17, fontWeight: 600, color: "#1a1a1a", letterSpacing: "0.02em" },
   copyBtn: {
     padding: "5px 12px", borderRadius: 8, border: "1.5px solid",
     cursor: "pointer", fontSize: 12, fontWeight: 600, background: "transparent",
   },
   formGroup: { marginBottom: 12 },
   formLabel: { display: "block", fontSize: 12, color: "#666", marginBottom: 5 },
   input: {
     width: "100%", border: "1px solid #ddd", borderRadius: 8,
     padding: "9px 12px", fontSize: 14, color: "#1a1a1a", outline: "none",
   },
   errorText: { fontSize: 12, color: "#E24B4A", marginBottom: 8 },
   confirmBtn: {
     width: "100%", padding: 12, borderRadius: 8, border: "none",
     color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4,
   },
   successBox: { textAlign: "center", padding: "8px 0 4px" },
   successIcon: {
     width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
     display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
   },
   successTitle: { fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 },
   successSub: { fontSize: 13, color: "#888", marginBottom: 16 },
   summaryBox: {
     background: "#f7f7f7", borderRadius: 10, padding: "12px 16px",
     textAlign: "left", marginBottom: 16,
   },
   summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
   summaryKey: { fontSize: 13, color: "#888" },
   summaryVal: { fontSize: 13, fontWeight: 600, color: "#1a1a1a" },
   closeOutlineBtn: {
     padding: "8px 28px", borderRadius: 8, border: "1px solid #ddd",
     background: "transparent", cursor: "pointer", fontSize: 13, color: "#333",
   },
 };
 