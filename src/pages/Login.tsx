import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebaseConfig";

const Login: React.FC = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      alert(`Welcome ${result.user.displayName}`);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">SafeTripShare</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        onClick={handleGoogleLogin}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;