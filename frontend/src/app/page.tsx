"use client";

import { apiFetch as fetch } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Smartphone, Plus, Trash2, Edit3, MessageSquare, Activity, ChevronRight, Calendar, Clock, MapPin, MoreVertical, X, CheckCircle, XCircle, ChevronLeft, CalendarDays, Bell, Send, LogOut, Menu, UserPlus, Shield, Eye, EyeOff, Search } from "lucide-react";
import PatientSummaryModal from "./components/PatientSummaryModal";

interface Profile {
  id: number;
  patientName: string;
  phone: string;
  realAge: number | null;
  doesExercise: boolean;
  exerciseType: string | null;
  currentWeight: number | null;
  bmi: number | null;
  metabolicAge: number | null;
  createdAt: string;
  active: boolean;
  snapshots: Snapshot[];
  sleepHours: number | null;
  dailySteps: number | null;
  generalRecommendation: string | null;
  specificRecommendations: string[];
  _count?: { messages: number };
}

interface Snapshot {
  id: number;
  weight: number | null;
  bmi: number | null;
  bodyFatPercentage: number | null;
  muscleMassPercentage: number | null;
  metabolicAge: number | null;
  lostWeight: number | null;
  recordedAt: string;
}

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "whatsapp" | "messages" | "appointments" | "calendar" | "users">("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (profile: Profile) => {
    try {
      const newStatus = !profile.active;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiles/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newStatus }),
      });
      if (res.ok) {
        setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, active: newStatus } : p));
      }
    } catch (e) {
      console.error("Error al cambiar estado:", e);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesFilter = filter === "all" || (filter === "active" ? p.active : !p.active);
    const matchesSearch = p.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiles`);
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error("Error al obtener perfiles:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (id: number) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiles/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProfile(data);
      }
    } catch (e) {
      console.error("Error al obtener detalles:", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
    fetchProfiles();
    fetchCurrentUser();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el perfil de ${name}? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiles/${id}`, { method: "DELETE" });
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert("Error al eliminar el perfil.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden transition-colors bg-white dark:bg-slate-900">
      
      {/* Mobile Top Bar */}
      <div className="print:hidden md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm z-40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Alpamed</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (document.documentElement.classList.contains('dark')) {
              document.documentElement.classList.remove('dark');
              localStorage.setItem('theme', 'light');
            } else {
              document.documentElement.classList.add('dark');
              localStorage.setItem('theme', 'dark');
            }
          }} className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="block dark:hidden">🌙</span>
            <span className="hidden dark:block">☀️</span>
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Overlay para móviles */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`print:hidden fixed md:relative inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 md:bg-white dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col backdrop-blur-sm transition-all duration-300 ease-in-out shrink-0 overflow-y-visible ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 md:w-20 -translate-x-full md:translate-x-0"}`}>
        <div className="flex flex-col h-full relative">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="absolute top-6 -right-3 p-1 hidden md:flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-full transition-colors border border-slate-200 dark:border-slate-700 shadow-md z-10"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="absolute top-4 right-4 p-1.5 md:hidden flex items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-700 rounded-lg z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Logo */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 pt-7 flex items-center justify-center md:justify-start overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-slate-200 dark:border-slate-300 transition-all">
                <img src="/alpalogo.png" alt="Alpamed" className="w-full h-full object-contain" />
              </div>
              {/* Texto de Logo: Oculto cuando el sidebar está cerrado en desktop */}
              <div className={`whitespace-nowrap transition-all duration-300 ${!isSidebarOpen ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100 w-auto"}`}>
                <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">Alpamed</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Panel Administrativo</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
            <button
              onClick={() => { setView("dashboard"); setIsSidebarOpen(window.innerWidth >= 768 ? isSidebarOpen : false); }}
              title="Perfiles"
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                view === "dashboard"
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${!isSidebarOpen && "md:justify-center"}`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span className={`font-medium whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>Perfiles</span>
            </button>
            <button
              onClick={() => { setView("whatsapp"); setIsSidebarOpen(window.innerWidth >= 768 ? isSidebarOpen : false); }}
              title="WhatsApp"
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                view === "whatsapp"
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${!isSidebarOpen && "md:justify-center"}`}
            >
              <Smartphone className="w-5 h-5 shrink-0" />
              <span className={`font-medium whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>WhatsApp</span>
            </button>
            <button
              onClick={() => { setView("messages"); setIsSidebarOpen(window.innerWidth >= 768 ? isSidebarOpen : false); }}
              title="Mensajes"
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                view === "messages"
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${!isSidebarOpen && "md:justify-center"}`}
            >
              <Send className="w-5 h-5 shrink-0" />
              <span className={`font-medium whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>Mensajes</span>
            </button>
            <button
              onClick={() => { setView("appointments"); setIsSidebarOpen(window.innerWidth >= 768 ? isSidebarOpen : false); }}
              title="Citas"
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                view === "appointments"
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${!isSidebarOpen && "md:justify-center"}`}
            >
              <Calendar className="w-5 h-5 shrink-0" />
              <span className={`font-medium whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>Citas</span>
            </button>
            <button
              onClick={() => { setView("calendar"); setIsSidebarOpen(window.innerWidth >= 768 ? isSidebarOpen : false); }}
              title="Calendario"
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                view === "calendar"
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${!isSidebarOpen && "md:justify-center"}`}
            >
              <CalendarDays className="w-5 h-5 shrink-0" />
              <span className={`font-medium whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>Calendario</span>
            </button>
            {currentUser?.role === "admin" && (
              <button
                onClick={() => { setView("users"); setIsSidebarOpen(window.innerWidth >= 768 ? isSidebarOpen : false); }}
                title="Usuarios"
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                  view === "users"
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                } ${!isSidebarOpen && "md:justify-center"}`}
              >
                <Shield className="w-5 h-5 shrink-0" />
                <span className={`font-medium whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>Usuarios</span>
              </button>
            )}
          </nav>

          {/* Stats & Actions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {isSidebarOpen ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-slate-600 text-xs">Total Pacientes</p>
                <p className="text-slate-900 dark:text-white text-2xl font-bold">{profiles.length}</p>
              </div>
            ) : (
                <div className="md:flex hidden bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex-col items-center justify-center">
                     <Users className="w-4 h-4 text-slate-500 mb-1" />
                     <p className="text-slate-900 dark:text-white text-sm font-bold">{profiles.length}</p>
                </div>
            )}
            
            <button
               onClick={() => {
                 if (document.documentElement.classList.contains('dark')) {
                   document.documentElement.classList.remove('dark');
                   localStorage.setItem('theme', 'light');
                 } else {
                   document.documentElement.classList.add('dark');
                   localStorage.setItem('theme', 'dark');
                 }
               }}
               title="Cambiar Tema"
               className={`w-full flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium p-2.5 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm ${!isSidebarOpen ? "md:justify-center" : ""}`}
            >
               <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                 <span className="block dark:hidden text-lg leading-none">🌙</span>
                 <span className="hidden dark:block text-lg leading-none">☀️</span>
               </div>
               <span className={`text-sm whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>
                 Cambiar Tema
               </span>
            </button>

            <button
              onClick={() => {
                Cookies.remove("token");
                window.location.href = "/login";
              }}
              title="Cerrar Sesión"
              className={`w-full flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium p-2.5 rounded-xl transition-all border border-red-500/20 shadow-sm ${!isSidebarOpen ? "md:justify-center" : ""}`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={`text-sm whitespace-nowrap ${!isSidebarOpen ? "md:hidden" : "block"}`}>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

        {/* Main Content */}
        <main className="print:hidden flex-1 h-full overflow-y-auto w-full relative">
          <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}
              className="p-4 md:p-8"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Perfiles de Pacientes</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 sm:mt-0">Gestiona expedientes y mensajes con IA</p>
                </div>
                <Link
                  href="/profiles/new"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-slate-900 dark:text-white font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nuevo Perfil</span>
                </Link>
              </div>

              {/* Filters & Search */}
              {!loading && profiles.length > 0 && (
                <div className="flex flex-col lg:flex-row gap-4 mb-6 sm:mb-8 items-stretch lg:items-center justify-between">
                  {/* Status Tabs */}
                  <div className="flex gap-1 bg-slate-50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-300 dark:border-slate-700/50 w-full lg:w-fit overflow-x-auto no-scrollbar">
                    {(["active", "inactive", "all"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => { setFilter(f); }}
                        className={`flex-1 lg:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                          filter === f ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 hover:text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {f === "active" ? "Activos" : f === "inactive" ? "Inactivos" : "Todos"}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-24">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Empty */}
              {!loading && profiles.length === 0 && (
                <div className="text-center py-24">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-slate-600" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Sin perfiles aún</p>
                  <p className="text-slate-600 mt-2 mb-6">Crea el primer expediente de paciente para comenzar.</p>
                  <Link
                    href="/profiles/new"
                    className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-slate-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" /> Crear primer perfil
                  </Link>
                </div>
              )}

              {/* Grid */}
              {!loading && filteredProfiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProfiles.map((profile, i) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleCardClick(profile.id)}
                      className="bg-slate-50 dark:bg-slate-800/60 backdrop-blur border border-slate-300 dark:border-slate-700/50 rounded-2xl p-5 hover:border-primary/30 hover:bg-slate-50 dark:bg-slate-800/80 transition-all group cursor-pointer relative"
                    >
                      {loadingDetails && selectedProfile?.id === profile.id && (
                        <div className="absolute inset-0 bg-white dark:bg-slate-900/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-slate-900 dark:text-white text-xl font-bold">
                              {profile.patientName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${profile.active ? 'text-slate-900 dark:text-white' : 'text-slate-600 line-through'}`}>{profile.patientName}</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-slate-600 dark:text-slate-400 text-sm">+{profile.phone}</p>
                              {!profile.active && (
                                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Inactivo</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(profile); }}
                          className={`p-2 rounded-lg transition-all border z-20 ${
                            profile.active 
                              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                              : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 border-slate-300 dark:border-slate-700 hover:text-primary hover:bg-primary/10'
                          }`}
                          title={profile.active ? "Desactivar paciente" : "Activar paciente"}
                        >
                          {profile.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4">
                        {profile.realAge && (
                          <div className="bg-slate-200 dark:bg-slate-700/50 rounded-lg p-1.5 sm:p-2 text-center">
                            <p className="text-primary font-bold text-base sm:text-lg">{profile.realAge}</p>
                            <p className="text-slate-600 text-[10px]">Edad</p>
                          </div>
                        )}
                        {profile.currentWeight && (
                          <div className="bg-slate-200 dark:bg-slate-700/50 rounded-lg p-1.5 sm:p-2 text-center">
                            <p className="text-primary font-bold text-base sm:text-lg">{profile.currentWeight}</p>
                            <p className="text-slate-600 text-[10px]">Peso kg</p>
                          </div>
                        )}
                        {profile.bmi && (
                          <div className="bg-slate-200 dark:bg-slate-700/50 rounded-lg p-1.5 sm:p-2 text-center">
                            <p className="text-primary font-bold text-base sm:text-lg">{profile.bmi}</p>
                            <p className="text-slate-600 text-[10px]">IMC</p>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                        <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full whitespace-nowrap ${profile.doesExercise ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                          {profile.doesExercise ? `💪 ${profile.exerciseType || "Hace ejercicio"}` : "Sin ejercicio"}
                        </span>
                        {profile._count && (
                          <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap">
                            <MessageSquare className="w-3 h-3" />
                            {profile._count.messages}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-row gap-2 pt-3 border-t border-slate-300 dark:border-slate-700/50">
                        <Link
                          href={`/profiles/${profile.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm font-medium py-2 rounded-lg transition-all border border-primary/20"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Editar</span>
                        </Link>
                        <Link
                          href={`/profiles/${profile.id}/send`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white text-xs sm:text-sm font-medium py-2 rounded-lg transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Mensaje</span>
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(profile.id, profile.patientName); }}
                          disabled={deleting === profile.id}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20 disabled:opacity-50"
                        >
                          {deleting === profile.id
                            ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "whatsapp" && (
            <motion.div key="whatsapp" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
              <WhatsAppSection />
            </motion.div>
          )}

          {view === "messages" && (
            <motion.div key="messages" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
              <MessagesSection />
            </motion.div>
          )}

          {view === "appointments" && (
            <motion.div key="appointments" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="h-full">
              <AppointmentsSection 
                highlightId={highlightedAppointmentId} 
                onClearHighlight={() => setHighlightedAppointmentId(null)} 
              />
            </motion.div>
          )}

          {view === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="h-full">
              <CalendarSection onGoToAppointment={(id) => {
                setHighlightedAppointmentId(id);
                setView("appointments");
              }} />
            </motion.div>
          )}

          {view === "users" && (
            <motion.div key="users" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="h-full">
              <UsersSection />
            </motion.div>
          )}
          </AnimatePresence>
        </main>

        {/* Modal de Resumen */}
        {selectedProfile && (
          <PatientSummaryModal 
            profile={selectedProfile} 
            onClose={() => setSelectedProfile(null)} 
          />
        )}
    </div>
  );
}

// ============================================================
// COMPONENTE WHATSAPP (separado del dashboard)
// ============================================================
import { io, Socket } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Loader2, ShieldCheck } from "lucide-react";

function WhatsAppSection() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "qr" | "connected" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [sendMessageStatus, setSendMessageStatus] = useState<{ loading: boolean; success?: boolean; msg?: string }>({ loading: false });



  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const newSocket = io(apiUrl, {
      auth: { token: Cookies.get("token") },
      extraHeaders: { "ngrok-skip-browser-warning": "69420" }
    });
    setSocket(newSocket);

    newSocket.on("qr", (data: { qr: string }) => { 
        setQrCode(data.qr); 
        setStatus("qr"); 
    });
    newSocket.on("loading", (data: { message: string }) => {
        setStatus("loading");
    });
    newSocket.on("ready", (data: { status: string }) => {
        setStatus("connected"); 
    });
    newSocket.on("auth_failure", () => { 
        setStatus("error"); 
        setErrorMessage("Fallo la autenticación. Intenta de nuevo."); 
    });
    newSocket.on("disconnected", () => { 
        setStatus("idle"); 
        setQrCode(""); 
    });
    newSocket.on("message_sent", (data: { success: boolean, error?: string }) => {
        setSendMessageStatus({ loading: false, success: data.success, msg: data.success ? "✅ Mensaje enviado exitosamente" : `❌ ${data.error}` });
        setTimeout(() => setSendMessageStatus({ loading: false }), 5000);
    });

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiles`)
      .then(r => r.json())
      .then(setProfiles)
      .catch(console.error);

    return () => { newSocket.disconnect(); };
  }, []);

  const handleSendMessage = () => {
    if (socket && selectedProfileId) {
      setSendMessageStatus({ loading: true });
      socket.emit("send_message", { profileId: parseInt(selectedProfileId) });
    }
  };

  const handleStartConnection = () => {
      setStatus("loading");
      socket?.emit("start-connection");
  };



  return (
    <div className="p-4 sm:p-6 md:p-8 flex items-start justify-center">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">WhatsApp</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Vincula tu cuenta y envía mensajes personalizados con IA</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 backdrop-blur border border-slate-300 dark:border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r  to-primary p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <Smartphone className="w-8 h-8 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Alpamed Bot</h3>
            <p className="text-primary text-sm mt-1">Mensajería automática por IA</p>
          </div>

          <div className="p-6">
            {status === "idle" && (
              <div className="space-y-6">
                <div className="bg-slate-200 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-slate-800 dark:text-white">Conectar Dispositivo</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Escanea el código QR desde tu WhatsApp para conectar el bot a la plataforma.</p>
                  <button
                    onClick={() => handleStartConnection()}
                    className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/30"
                  >
                    Vincular WhatsApp
                  </button>
                </div>
              </div>
            )}

            {status === "loading" && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-700 dark:text-slate-300 font-medium animate-pulse">Generando código QR...</p>
              </div>
            )}

            {status === "qr" && (
              <div className="flex flex-col items-center space-y-4">
                <p className="text-slate-700 dark:text-slate-300 text-sm text-center">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
                <div className="p-4 bg-white rounded-2xl shadow-lg relative group">
                  <QRCodeSVG value={qrCode} size={220} level="H" includeMargin={false} className="rounded-lg" />
                  <button
                    onClick={() => { navigator.clipboard.writeText(qrCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-lg shadow border border-slate-200 text-slate-600 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {status === "connected" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 relative">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-slate-200 dark:border-slate-800" />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-semibold">¡Conexión Exitosa!</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">El bot está listo para enviar mensajes.</p>
                </div>

                <div className="bg-slate-200 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Paciente</label>
                  <select
                    value={selectedProfileId}
                    onChange={e => setSelectedProfileId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-600 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Selecciona un paciente --</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.patientName} (+{p.phone})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSendMessage}
                    disabled={!selectedProfileId || sendMessageStatus.loading}
                    className="w-full bg-primary hover:bg-primary disabled:bg-slate-600 disabled:text-slate-600 dark:text-slate-400 text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                  >
                    {sendMessageStatus.loading ? "Generando y enviando..." : "🤖 Enviar Mensaje con IA"}
                  </button>
                  {sendMessageStatus.msg && (
                    <p className={`text-sm text-center ${sendMessageStatus.success ? "text-primary" : "text-red-400"}`}>
                      {sendMessageStatus.msg}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => { setStatus("loading"); socket?.emit("logout"); }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition-all border border-red-500/30 shadow-sm"
                  >
                    <LogOut className="w-5 h-5" /> Desvincular WhatsApp
                  </button>
                </div>

                <button
                  onClick={() => { setStatus("idle"); }}
                  className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white font-medium py-2.5 px-6 rounded-xl transition-all"
                >
                  Regresar al Menú
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                  <p className="font-medium">{errorMessage}</p>
                </div>
                <button onClick={() => setStatus("idle")} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white font-medium py-3 px-6 rounded-xl transition-all">
                  Intentar Nuevamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE DE MENSAJES AUTOMÁTICOS
// ============================================================

function MessagesSection() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<{ 
    isBroadcasting: boolean; 
    current?: number; 
    total?: number; 
    latest?: any;
    complete?: boolean;
  }>({ isBroadcasting: false });

  const [reminderStatus, setReminderStatus] = useState({
    isSending: false,
    current: 0,
    total: 0,
    lastPatient: "",
    complete: false
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiles`)
      .then(r => r.json())
      .then(setProfiles)
      .catch(console.error);

    const apiUrl2 = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket = io(apiUrl2, {
      extraHeaders: { "ngrok-skip-browser-warning": "69420" }
    });

    const handleBroadcastProgress = (data: any) => {
      setBroadcastStatus({ 
        isBroadcasting: true, 
        current: data.current, 
        total: data.total, 
        latest: data.latest 
      });
    };

    const handleBroadcastComplete = (data: any) => {
      setBroadcastStatus(prev => ({ ...prev, isBroadcasting: false, complete: true }));
      setTimeout(() => setBroadcastStatus({ isBroadcasting: false }), 10000);
    };

    const handleReminderProgress = (data: any) => {
      setReminderStatus(prev => ({
        ...prev,
        isSending: true,
        current: data.current,
        total: data.total,
        lastPatient: data.lastPatient
      }));
    };

    const handleReminderComplete = (data: any) => {
      setReminderStatus(prev => ({ ...prev, isSending: false, complete: true }));
      setTimeout(() => setReminderStatus(p => ({ ...p, complete: false })), 5000);
    };

    socket.on("broadcast_progress", handleBroadcastProgress);
    socket.on("broadcast_complete", handleBroadcastComplete);
    socket.on('appointment_reminder_progress', handleReminderProgress);
    socket.on('appointment_reminder_complete', handleReminderComplete);

    return () => {
      socket.off("broadcast_progress", handleBroadcastProgress);
      socket.off("broadcast_complete", handleBroadcastComplete);
      socket.off('appointment_reminder_progress', handleReminderProgress);
      socket.off('appointment_reminder_complete', handleReminderComplete);
      socket.disconnect();
    };
  }, []);

  const handleBroadcast = async () => {
    if (confirm("Se enviará un mensaje personalizado CON IA a todos los pacientes registrados. ¿Continuar?")) {
      setBroadcastStatus({ isBroadcasting: true, current: 0, total: profiles.length });
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/messages/broadcast`, { method: "POST" });
        const data = await res.json();
        
        if (!res.ok) {
          alert(`⚠️ ${data.error || "Error al iniciar broadcast."}`);
          setBroadcastStatus({ isBroadcasting: false });
          return;
        }
      } catch (e) {
        alert("Error de conexión al iniciar broadcast.");
        setBroadcastStatus({ isBroadcasting: false });
      }
    }
  };

  const handleSendReminders = async () => {
    if (!confirm("Se enviará un recordatorio por WhatsApp a todos los pacientes con citas PENDIENTES. ¿Continuar?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/reminders`, { method: "POST" });
      const data = await res.json();
      
      if (res.status === 200 && data.message === "No hay citas pendientes para recordar") {
        alert("No hay citas pendientes agendadas para enviar recordatorios.");
        return;
      }

      if (res.ok) {
        setReminderStatus({ isSending: true, current: 0, total: data.total, lastPatient: "", complete: false });
      } else if (res.status === 503) {
        alert("⚠️ WhatsApp no está conectado. Por favor, ve a la pestaña de 'WhatsApp', escanea el código QR y espera a que el estado sea 'Conectado' antes de enviar recordatorios.");
      } else {
        alert(data.error || "Error al iniciar recordatorios");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Central de Mensajes</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Envía recordatorios de citas y recomendaciones masivas a tus pacientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recordatorios de Citas */}
        <div className="bg-slate-50 dark:bg-slate-800/60 backdrop-blur border border-slate-300 dark:border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recordatorios de Citas</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Citas pendientes en agenda</p>
            </div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm mb-6">Esta acción enviará un mensaje recordatorio automático a todos los pacientes que tienen una cita programada y en estado "pendiente".</p>
          
          <button
            onClick={handleSendReminders}
            disabled={reminderStatus.isSending}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary disabled:opacity-50 text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30"
          >
            <Bell className="w-5 h-5" /> Enviar Recordatorios
          </button>

          {reminderStatus.isSending && (
            <div className="mt-4 bg-white dark:bg-slate-900/50 rounded-xl p-4 animate-pulse">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                <span>Enviando a: <span className="text-primary">{reminderStatus.lastPatient}</span></span>
                <span className="font-bold">{reminderStatus.current} / {reminderStatus.total}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${(reminderStatus.current / (reminderStatus.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {reminderStatus.complete && (
            <p className="mt-4 text-primary text-sm text-center font-medium animate-bounce">
              ✨ ¡Recordatorios enviados con éxito!
            </p>
          )}
        </div>

        {/* Envío Masivo */}
        <div className="bg-slate-50 dark:bg-slate-800/60 backdrop-blur border border-slate-300 dark:border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recomendación Diaria</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Envío masivo con IA</p>
            </div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm mb-6">La Inteligencia Artificial redactará una recomendación personalizada única para cada paciente basándose en sus hábitos actuales.</p>
          
          <button
            onClick={handleBroadcast}
            disabled={broadcastStatus.isBroadcasting}
            className="w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition-all shadow-lg"
          >
            <MessageSquare className="w-5 h-5" /> Enviar a Todos
          </button>

          {broadcastStatus.isBroadcasting && (
            <div className="mt-4 bg-white dark:bg-slate-900/50 rounded-xl p-4 animate-pulse">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                <span>Procesando envíos...</span>
                <span className="font-bold">{broadcastStatus.current} / {broadcastStatus.total}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((broadcastStatus.current || 0) / (broadcastStatus.total || 1)) * 100}%` }}
                />
              </div>
              {broadcastStatus.latest && (
                <p className="text-[10px] text-slate-600 italic truncate mt-2">
                  Último: {broadcastStatus.latest.patientName} - {broadcastStatus.latest.status === 'sent' ? '✅' : '❌'}
                </p>
              )}
            </div>
          )}

          {broadcastStatus.complete && (
            <p className="mt-4 text-primary text-sm text-center font-medium animate-bounce">
              ✨ Envío masivo completado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE CITAS (CRUD)
// ============================================================

interface Appointment {
  id: number;
  profileId: number;
  date: string;
  reason: string;
  status: string;
  notes: string | null;
  profile: Profile;
}

function AppointmentsSection({ highlightId, onClearHighlight }: { highlightId: number | null; onClearHighlight: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  


  const [form, setForm] = useState({
    profileId: "",
    date: "",
    reason: "",
    notes: "",
    status: "pendiente"
  });

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments`);
      const data = await res.json();
      setAppointments(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/profiles`);
      const data = await res.json();
      setProfiles(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAppointments();
    fetchProfiles();


  }, []);

  useEffect(() => {
    if (highlightId && !loading && appointments.length > 0) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        const el = document.getElementById(`appointment-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Desvanecer el resaltado después de 3 segundos
        setTimeout(() => onClearHighlight(), 3000);
      }, 300);
    }
  }, [highlightId, loading, appointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.profileId || !form.date || !form.reason) return alert("Completa los campos obligatorios");
    
    setSaving(true);
    try {
      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments`;
      const payload = {
        ...form,
        date: new Date(form.date).toISOString()
      };

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchAppointments();
        resetForm();
      }
    } catch (e) { alert("Error al guardar la cita"); }
    finally { setSaving(false); }
  };

  const resetForm = () => {
    setForm({ profileId: "", date: "", reason: "", notes: "", status: "pendiente" });
    setEditingId(null);
    setShowForm(false);
  };

  const toLocalDatetimeString = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleEdit = (app: Appointment) => {
    setForm({
      profileId: app.profileId.toString(),
      date: toLocalDatetimeString(app.date),
      reason: app.reason,
      notes: app.notes || "",
      status: app.status
    });
    setEditingId(app.id);
    setShowForm(true);
  };



  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      }
    } catch (e) { alert("Error al actualizar estado"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta cita?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/${id}`, { method: "DELETE" });
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (e) { alert("Error al eliminar"); }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Citas</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Programa y organiza las consultas</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary text-slate-900 dark:text-white font-semibold px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl transition-all shadow-lg shadow-primary/30 text-sm sm:text-base"
          >
            <Plus className="w-5 h-5" /> Nueva Cita
          </button>
        </div>
      </div>



      {showForm && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg">{editingId ? "Editar Cita" : "Nueva Cita"}</h3>
              <button onClick={resetForm} className="text-slate-600 hover:text-slate-900 dark:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Paciente *</label>
                <select
                  value={form.profileId}
                  onChange={e => setForm(p => ({ ...p, profileId: e.target.value }))}
                  disabled={!!editingId}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">-- Selecciona un paciente --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.patientName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha y Hora *</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Motivo *</label>
                <input
                  type="text"
                  placeholder="Ej: Evaluación inicial, Seguimiento quincenal"
                  value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="caducada" disabled>Caducada (Auto)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notas adicionales</label>
                <textarea
                  placeholder="Instrucciones previas o recordatorios..."
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:bg-slate-700 transition-all">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-slate-900 dark:text-white font-semibold rounded-xl hover:bg-primary transition-all shadow-lg shadow-primary/20">
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-300 dark:border-slate-700/50">
          <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">No hay citas programadas</p>
          <p className="text-slate-600 mt-2">Personaliza tu agenda agendando la primera cita.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {appointments.map((app) => (
            <div 
              key={app.id} 
              id={`appointment-${app.id}`}
              className={`bg-slate-50 dark:bg-slate-800/60 backdrop-blur border rounded-2xl p-5 hover:border-primary/30 transition-all duration-500 ${
                highlightId === app.id 
                ? 'border-primary ring-2 ring-primary/50 scale-[1.02] bg-primary/10 shadow-2xl shadow-primary/20' 
                : 'border-slate-300 dark:border-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-primary font-bold border border-slate-600">
                    <span className="text-[10px] uppercase leading-none opacity-60">{new Date(app.date).toLocaleString('es-ES', { month: 'short' })}</span>
                    <span className="text-xl leading-none">{new Date(app.date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="text-slate-900 dark:text-white font-semibold leading-tight">{app.profile.patientName}</h3>
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(app.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={app.status} />
                  {(app as any).isNextDay && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/30">
                      Mañana
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-3 mb-4">
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Motivo:</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5 line-clamp-1">{app.reason}</p>
              </div>

              {app.notes && (
                <p className="text-[11px] text-slate-600 italic mb-4 line-clamp-2">📝 {app.notes}</p>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-300 dark:border-slate-700/50">
                <button
                  onClick={() => handleEdit(app)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium py-2 rounded-lg transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
                
                {app.status === 'pendiente' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'completada')}
                      title="Marcar como completada"
                      className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all border border-primary/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'cancelada')}
                      title="Cancelar cita"
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}

                {app.status !== 'pendiente' && (
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'pendiente')}
                    title="Re-abrir cita"
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-all border border-amber-500/20"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                )}

                {app.status === 'caducada' && (
                  <div className="flex-1 text-center py-2 bg-slate-200 dark:bg-slate-700/20 text-slate-600 text-[10px] uppercase font-bold rounded-lg border border-slate-300 dark:border-slate-700/50">
                    Cita Caducada
                  </div>
                )}

                <button
                  onClick={() => handleDelete(app.id)}
                  className="p-2 bg-slate-200 dark:bg-slate-700/30 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all border border-slate-300 dark:border-slate-700/50 hover:border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pendiente: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    completada: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    cancelada: "bg-red-500/20 text-red-500 border-red-500/30",
    caducada: "bg-rose-500/20 text-rose-500 border-rose-500/30",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${styles[status]}`}>
      {status === 'caducada' ? 'caducada' : status}
    </span>
  );
}

// ============================================================
// COMPONENTE CALENDARIO (VISTA MENSUAL)
// ============================================================

function CalendarSection({ onGoToAppointment }: { onGoToAppointment: (id: number) => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDayApps, setSelectedDayApps] = useState<Appointment[] | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments`)
      .then(r => r.json())
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Lógica del Calendario
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Ajustar para que Lunes sea 0 (JS por defecto: Domingo=0)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(currentDate);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = [];
  const startYear = 2000;
  const endYear = new Date().getFullYear() + 10;
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const handleMonthChange = (m: number) => setCurrentDate(new Date(year, m, 1));
  const handleYearChange = (y: number) => setCurrentDate(new Date(y, month, 1));

  const days = [];
  // Espacios vacíos para el inicio del mes
  for (let i = 0; i < startingDay; i++) days.push(null);
  // Días del mes
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  const getAppsForDay = (date: Date) => {
    return appointments.filter(a => {
      const aDate = new Date(a.date);
      return aDate.getDate() === date.getDate() &&
             aDate.getMonth() === date.getMonth() &&
             aDate.getFullYear() === date.getFullYear();
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
      {/* Header del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 bg-slate-50 dark:bg-slate-800/30 p-5 sm:p-4 rounded-3xl border border-slate-300 dark:border-slate-700/30 shadow-inner">
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <select 
              value={month}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              className="bg-transparent text-3xl font-bold text-primary capitalize outline-none cursor-pointer hover:text-primary transition-colors appearance-none"
            >
              {months.map((m, i) => (
                <option key={m} value={i} className="bg-white dark:bg-slate-900 text-base text-slate-900 dark:text-white">{m}</option>
              ))}
            </select>
            <select 
              value={year}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="bg-transparent text-3xl font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:text-slate-900 dark:text-white transition-colors appearance-none"
            >
              {years.map(y => (
                <option key={y} value={y} className="bg-white dark:bg-slate-900 text-base text-slate-900 dark:text-white">{y}</option>
              ))}
            </select>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Navega rápidamente por tu agenda</p>
        </div>
        
        <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700/50 shadow-lg w-full sm:w-auto">
          <button onClick={prevMonth} className="p-3 sm:p-2.5 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white rounded-xl transition-all group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <button onClick={goToToday} className="flex-1 sm:flex-none px-6 py-2.5 mx-2 text-xs font-bold text-slate-900 dark:text-white bg-primary hover:bg-primary rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95">
            HOY
          </button>
          <button onClick={nextMonth} className="p-3 sm:p-2.5 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white rounded-xl transition-all group">
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Grid del Calendario */}
      <div className="flex-1 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] uppercase font-bold tracking-widest text-slate-600">{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="border-b border-r border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/20" />;
            
            const isToday = date.toDateString() === new Date().toDateString();
            const dayApps = getAppsForDay(date);

            let dayStatus = null;
            if (dayApps.length > 0) {
              if (dayApps.some(a => a.status === 'pendiente')) dayStatus = 'pendiente';
              else if (dayApps.some(a => a.status === 'caducada')) dayStatus = 'caducada';
              else if (dayApps.some(a => a.status === 'completada')) dayStatus = 'completada';
              else dayStatus = 'cancelada';
            }

            let cellStyles = isToday ? 'bg-emerald-500/10' : 'hover:bg-slate-800/50';
            if (dayStatus === 'pendiente') cellStyles = 'bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 shadow-[inset_0_0_15px_rgba(245,158,11,0.15)]';
            else if (dayStatus === 'caducada') cellStyles = 'bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30';
            else if (dayStatus === 'completada') cellStyles = 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30';
            else if (dayStatus === 'cancelada') cellStyles = 'bg-slate-800/80 border-slate-700 hover:bg-slate-700';

            return (
              <div 
                key={date.toISOString()} 
                onClick={() => dayApps.length > 0 && setSelectedDayApps(dayApps)}
                className={`border-b border-r border-slate-200 dark:border-slate-800 p-2 transition-all cursor-pointer flex items-center justify-center ${cellStyles}`}
              >
                <span className={`text-lg font-bold ${
                  isToday && !dayStatus ? 'text-slate-900 dark:text-white bg-primary w-8 h-8 rounded-full flex items-center justify-center shadow-lg shadow-primary/40' : 
                  dayStatus === 'pendiente' ? 'text-amber-400' :
                  dayStatus === 'caducada' ? 'text-rose-400' :
                  dayStatus === 'completada' ? 'text-primary' :
                  'text-slate-600 dark:text-slate-400'
                }`}>
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalle de Día */}
      {selectedDayApps && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Citas del Día</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{new Date(selectedDayApps[0].date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={() => setSelectedDayApps(null)} className="text-slate-600 hover:text-slate-900 dark:text-white p-2 hover:bg-slate-50 dark:bg-slate-800 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-auto">
              {selectedDayApps.map(app => (
                <div 
                  key={app.id} 
                  onClick={() => onGoToAppointment(app.id)}
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20 group-hover:bg-primary/20">
                      {new Date(app.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-semibold group-hover:text-primary transition-colors">{app.profile.patientName}</h4>
                      <p className="text-slate-600 text-xs">{app.reason}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-center">
              <button 
                onClick={() => setSelectedDayApps(null)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm font-medium"
              >Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-primary font-bold text-lg leading-tight">{value}</p>
      <p className="text-slate-600 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, unit = "", highlight = false }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div className="bg-slate-200 dark:bg-slate-700/40 rounded-lg p-2 text-center">
      <p className={`font-bold text-base leading-tight ${highlight ? "text-primary" : "text-slate-200"}`}>{value}{value !== "—" ? unit : ""}</p>
      <p className="text-slate-600 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// ============================================================
// COMPONENTE DE USUARIOS (NUTRICIONISTAS)
// ============================================================
function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Error al obtener usuarios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setForm({ name: "", email: "", password: "", role: "user" });
        setShowModal(false);
        fetchUsers();
      } else {
        alert(data.error || "Error al crear usuario");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    if (!confirm(`¿Seguro que deseas cambiar los permisos de este usuario a ${newRole}?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      } else {
        const data = await res.json();
        alert(data.error || "Error al cambiar rol");
      }
    } catch (e) {
      alert("Error de red al cambiar rol.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar a este usuario?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/users/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert(data.error || "Error al eliminar usuario");
      }
    } catch (e) {
      alert("Error de red al eliminar.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Usuarios</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona los accesos al sistema y registra a otros usuarios</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary text-slate-900 dark:text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-105"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => (
            <div key={u.id} className="bg-slate-50 dark:bg-slate-800/60 backdrop-blur border border-slate-300 dark:border-slate-700/50 rounded-2xl p-5 hover:border-primary/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 text-primary rounded-xl flex items-center justify-center font-bold text-xl">
                    {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{u.name || "Sin nombre"}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 w-full break-all">{u.email}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-400">
                  Registrado el {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-700/50 flex items-center justify-between">
                <button
                  onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  {u.role === 'admin' ? 'Revocar Admin' : 'Hacer Admin'}
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={deleting === u.id}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 text-sm font-medium disabled:opacity-50"
                  title="Eliminar usuario"
                >
                  {deleting === u.id ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !saving && setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Usuario</h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleRegister} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre (Opcional)</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
                    placeholder="Ej. Dr. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600 pr-10"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nivel de Acceso</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="user">Usuario Normal (Personal)</option>
                    <option value="admin">Administrador (Dueño)</option>
                  </select>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary disabled:opacity-50 text-slate-900 dark:text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                  >
                    {saving ? "Registrando..." : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
