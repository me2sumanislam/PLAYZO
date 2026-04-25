 import React, { useState } from "react";

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    username: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = isLogin
      ? "http://localhost:5000/api/auth/login"
      : "http://localhost:5000/api/auth/register";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // 🔥 DEBUG (must see in console)
      console.log("LOGIN RESPONSE:", data);

      if (data.success) {
        // save token + user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // admin check
        localStorage.setItem(
          "isAdmin",
          data?.user?.role === "admin" ? "true" : "false"
        );

        onLoginSuccess();
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.log("ERROR:", err);
      alert("Server error");
    }

    setLoading(false);
  };

  // ================= VALIDATION =================
  const isLoginValid =
    formData.phone.trim().length > 5 &&
    formData.password.trim().length > 3;

  const isRegisterValid =
    formData.phone.trim().length > 5 &&
    formData.password.trim().length > 3 &&
    formData.username.trim().length > 2;

  return (
    <div className="w-full max-w-[450px] mx-auto min-h-screen flex flex-col justify-center bg-white px-6">

      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black">
          GAME<span className="text-orange-500">ZONE</span>
        </h1>
        <p className="text-gray-500 mt-2">
          {isLogin ? "Login to continue" : "Create gaming account"}
        </p>
      </div>

      {/* TOGGLE */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 p-2 rounded-lg font-bold ${
            isLogin ? "bg-black text-white" : "text-gray-600"
          }`}
        >
          LOGIN
        </button>

        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 p-2 rounded-lg font-bold ${
            !isLogin ? "bg-green-600 text-white" : "text-gray-600"
          }`}
        >
          REGISTER
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* PHONE */}
        <input
          type="text"
          placeholder="Phone Number"
          className="w-full p-4 border rounded-2xl"
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          required
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 border rounded-2xl"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />

        {/* USERNAME */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Gaming Username"
            className="w-full p-4 border rounded-2xl"
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        )}

        {/* EMAIL */}
        {!isLogin && (
          <input
            type="email"
            placeholder="Email (optional)"
            className="w-full p-4 border rounded-2xl"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={isLogin ? !isLoginValid : !isRegisterValid}
          className={`w-full p-4 rounded-2xl font-bold text-white transition-all ${
            (isLogin ? isLoginValid : isRegisterValid)
              ? "bg-black active:scale-95"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "LOGIN"
            : "CREATE ACCOUNT"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        🎮 Mobile Gaming Tournament System
      </p>
    </div>
  );
};

export default Auth;