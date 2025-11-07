// src/App.js
import React, { useState } from "react";
import { auth, googleProvider, db } from "./firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import MapScreen from "./MapScreen";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    } catch (err) {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        setUser(res.user);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddTrip = async () => {
    await addDoc(collection(db, "trips"), {
      user: user.email,
      from: "Badin",
      to: "Karachi",
      date: new Date().toISOString(),
    });
    alert("Trip added successfully!");
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Safe Trip Share Login</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <button onClick={handleEmailLogin}>Login / Sign Up</button><br /><br />
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ textAlign: "center" }}>Welcome, {user.email}</h3>
      <button onClick={handleAddTrip}>Add Sample Trip</button>
      <MapScreen />
    </div>
  );
}

export default App;
