"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured, nimEmail } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import Planner from "@/components/Planner";
import AdminPanel from "@/components/AdminPanel";
import { FiEye, FiEyeOff, FiHash, FiLogOut, FiMoon, FiSun, FiUsers } from "react-icons/fi";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme_pref") || "dark";
    setTheme(saved); document.documentElement.dataset.theme = saved;
    return onAuthStateChanged(auth, async (current) => {
      if (!current) { setUser(null); setProfile(null); setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", current.uid));
        const data = snap.data() as UserProfile | undefined;
        if (!data?.active) { await signOut(auth); setLoading(false); return; }
        setUser(current); setProfile(data); setLoading(false);
      } catch (error) {
        console.error("Profil Firestore tidak dapat dibaca. Periksa security rules.", error);
        await signOut(auth); setLoading(false);
      }
    });
  }, []);

  const toggleTheme = () => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem("theme_pref", next); document.documentElement.dataset.theme = next; };
  if (loading) return <div className="login-wrap">Memuat...</div>;
  if (!user || !profile) return <Login />;
  return <main className="container">
    <header>
      <div className="brand"><FiHash size={24}/><h1>IPK Planner</h1><span className="badge">Cloud Save</span></div>
      <div className="flex">
        <div className="top-user hide-mobile"><strong>{profile.name}</strong><span className="muted">{profile.nim}</span></div>
        {profile.role === "admin" && <button className="btn ghost" onClick={() => setAdminOpen(!adminOpen)}><FiUsers/> Admin</button>}
        <button aria-label="Ganti tema" className="btn ghost icon" onClick={toggleTheme}>{theme === "dark" ? <FiMoon/> : <FiSun/>}</button>
        <button className="btn danger" onClick={() => signOut(auth)}><FiLogOut/> Keluar</button>
      </div>
    </header>
    {adminOpen && profile.role === "admin" ? <AdminPanel user={user}/> : <Planner uid={user.uid} theme={theme}/>} 
  </main>;
}

function Login() {
  const [nim, setNim] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setError(""); if(!firebaseConfigured){setError("Firebase belum dikonfigurasi. Buat dan isi file .env.local terlebih dahulu.");setBusy(false);return} try { await signInWithEmailAndPassword(auth, nimEmail(nim), password); } catch { setError("NIM atau password salah, akun belum dibuat, atau akun tidak aktif."); } finally { setBusy(false); } };
  return <main className="login-wrap"><section className="card login"><div className="brand"><FiHash size={28}/><h1>IPK Planner</h1></div><p className="muted">Masuk menggunakan akun mahasiswa yang terdaftar.</p><form onSubmit={submit}><label>NIM<input autoFocus required value={nim} onChange={e=>setNim(e.target.value)} placeholder="Masukkan NIM"/></label><label>Password<div className="password-field"><input required minLength={6} type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password"/><button type="button" aria-label={showPassword?"Sembunyikan password":"Lihat password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<FiEyeOff/>:<FiEye/>}</button></div></label>{error && <div className="error">{error}</div>}<button className="btn primary" disabled={busy}>{busy ? "Memeriksa..." : "Masuk"}</button></form></section></main>;
}
