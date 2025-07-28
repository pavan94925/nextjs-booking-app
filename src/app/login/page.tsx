'use client';

import { useState } from "react";
import { loginUser } from "@/actions/authActions";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  const res = await loginUser({ email, password });

  if (res.success) {
    // ✅ Save the user to localStorage
    localStorage.setItem("user", JSON.stringify(res.user));
    
    setMsg("✅ Login successful");
    router.push("/dashboard");
  } else {
    setMsg("❌ " + res.message);
  }
};

    return (
  <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
    <h2 className="text-2xl font-bold mb-6 text-center">🔐 Login</h2>
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        className="w-full px-4 py-2 border rounded"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value.toLowerCase())}
        required
      />
      <input
        type="password"
        className="w-full px-4 py-2 border rounded"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Login
      </button>

      <p className="text-sm text-gray-600 text-center">
        Forgot your password?{" "}
        <a href="/forgot-password" className="text-blue-600 underline">
          Reset here
        </a>
      </p>

      <p className="text-sm text-center">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-600 underline">
          Create Account
        </a>
      </p>

      {msg && <p className="text-center text-red-600">{msg}</p>}
    </form>
  </div>
);
}
