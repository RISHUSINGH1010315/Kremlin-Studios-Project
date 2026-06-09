"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line
} from "recharts";
import { 
  Sparkles, 
  ShieldAlert, 
  Lock, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Sliders, 
  LogOut, 
  Trash2, 
  Mail, 
  Phone, 
  Building,
  CheckCircle,
  Eye,
  Calendar,
  X
} from "lucide-react";

// API Base URL (Dynamic for local dev & production deployment)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const prefix = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard stats and data
  const [stats, setStats] = useState<any>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected inquiry for detail modal
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

  // Check if token exists on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("kremlin_admin_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchDashboardData(savedToken);
    } else {
      setLoadingData(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("kremlin_admin_token", data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        fetchDashboardData(data.token);
      } else {
        setLoginError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setLoginError("Could not connect to authentication services.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kremlin_admin_token");
    setToken("");
    setIsAuthenticated(false);
    setStats(null);
    setInquiries([]);
  };

  const fetchDashboardData = async (jwtToken: string) => {
    setLoadingData(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/analytics`, {
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsData);
      }

      // Fetch inquiries
      const inquiriesRes = await fetch(`${API_URL}/inquiries`, {
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      const inquiriesData = await inquiriesRes.json();
      if (inquiriesRes.ok) {
        setInquiries(inquiriesData.inquiries);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const updateInquiryStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_URL}/inquiries/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setInquiries((prev) => prev.map((inq) => inq.id === id ? { ...inq, status } : inq));
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteInquiry = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reservation inquiry?")) return;
    try {
      const response = await fetch(`${API_URL}/inquiries/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        setSelectedInquiry(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convert date helper
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 px-6 py-12 relative overflow-hidden">
        {/* Abstract Glow shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl relative z-10">
          <div className="text-center mb-8">
            <img src={`${prefix}/images/Logo.png`} alt="Kremlin Host Portal" className="w-16 h-16 object-contain mx-auto mb-4" />
            <span className="text-sm font-bold tracking-widest uppercase text-blue-600 font-sans">Host Portal</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-2 font-serif">Kremlin Host login</h2>
            <p className="text-xs text-gray-400 mt-1">Manage guest stay dates and reservations</p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex gap-2 items-center mb-6">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Host Email</label>
              <input 
                type="email" 
                required 
                placeholder="admin@kremlinstudios.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 transition-colors text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 transition-colors text-gray-800"
              />
            </div>

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:opacity-95 shadow-md shadow-blue-500/10 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? "Verifying host token..." : "Open Host Dashboard"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 min-h-screen pb-16">
      
      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-18 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={`${prefix}/images/Logo.png`} alt="Kremlin Host" className="w-9 h-9 object-contain" />
            <span className="font-extrabold text-gray-900 tracking-tight font-sans">KREMLIN HOST</span>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold text-gray-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main stats layout */}
      <main className="max-w-7xl mx-auto px-6 mt-10">
        
        {loadingData ? (
          <div className="text-center py-24 text-gray-400 font-bold animate-pulse">
            Loading Kremlin stay analytics...
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Numerical metrics */}
            {stats && (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: "Total Views", val: stats.summary.totalViews, icon: Eye, color: "text-blue-600 bg-blue-50" },
                  { label: "Stay Inquiries", val: stats.summary.totalInquiries, icon: Calendar, color: "text-purple-600 bg-purple-50" },
                  { label: "Chat Sessions", val: stats.summary.totalChatSessions, icon: MessageSquare, color: "text-cyan-600 bg-cyan-50" },
                  { label: "Qualified Chats", val: stats.summary.qualifiedChats, icon: CheckCircle, color: "text-green-600 bg-green-50" }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">{card.label}</span>
                        <span className="text-xl font-bold text-gray-900 mt-1 block">{card.val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Graphs and Charts */}
            {stats && stats.viewsByDay && stats.viewsByDay.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Traffic Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm md:col-span-2">
                  <h3 className="text-sm font-bold tracking-tight text-gray-900 uppercase mb-6 font-sans">Guest Traffic (Last 7 Days)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.viewsByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" })} stroke="#94A3B8" fontSize={10} />
                        <YAxis stroke="#94A3B8" fontSize={10} />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Source breakdown */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-sm font-bold tracking-tight text-gray-900 uppercase mb-6 font-sans">Inquiries Source Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.inquiriesBySource}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="source" stroke="#94A3B8" fontSize={10} />
                        <YAxis stroke="#94A3B8" fontSize={10} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {/* Inquiries Table */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900 font-serif">Stay Reservation Inquiries</h3>
                <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">{inquiries.length} Inquiries</span>
              </div>

              {inquiries.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  No reservation inquiries submitted to PostgreSQL yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-8 py-4">Guest</th>
                        <th className="px-6 py-4">Source</th>
                        <th className="px-6 py-4">Check-In</th>
                        <th className="px-6 py-4">Check-Out</th>
                        <th className="px-6 py-4">Guests</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="font-bold text-gray-900">{inq.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{inq.email}</div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold">
                            <span className={`px-2.5 py-1 rounded-full ${
                              inq.source === 'concierge_chat' 
                                ? 'bg-purple-50 text-purple-600' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {inq.source}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-semibold">{formatDate(inq.check_in_date)}</td>
                          <td className="px-6 py-4 text-gray-600 font-semibold">{formatDate(inq.check_out_date)}</td>
                          <td className="px-6 py-4 font-bold text-gray-700">{inq.guests}</td>
                          <td className="px-6 py-4">
                            <select 
                              value={inq.status}
                              onChange={(e) => updateInquiryStatus(inq.id, e.target.value)}
                              className={`text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none border-0 cursor-pointer ${
                                inq.status === 'new' 
                                  ? 'bg-blue-50 text-blue-600' 
                                  : inq.status === 'contacting' 
                                  ? 'bg-yellow-50 text-yellow-600' 
                                  : inq.status === 'confirmed' 
                                  ? 'bg-green-50 text-green-600' 
                                  : 'bg-red-50 text-red-500'
                              }`}
                            >
                              <option value="new">new</option>
                              <option value="contacting">contacting</option>
                              <option value="confirmed">confirmed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                          </td>
                          <td className="px-8 py-4 text-right flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedInquiry(inq)}
                              className="p-1.5 border rounded-lg text-gray-500 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteInquiry(inq.id)}
                              className="p-1.5 border rounded-lg text-gray-500 hover:text-red-500 hover:bg-slate-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border rounded-full p-1.5" 
              onClick={() => setSelectedInquiry(null)}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 pb-6 border-b border-slate-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Inquiry Details</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1 font-serif">{selectedInquiry.name}</h3>
              <p className="text-xs text-gray-400 mt-1">Submitted {formatDateTime(selectedInquiry.created_at)} via {selectedInquiry.source}</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-bold block">Email Address</span>
                  <a href={`mailto:${selectedInquiry.email}`} className="font-semibold text-gray-800 flex items-center gap-1.5 mt-1 hover:text-blue-600">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedInquiry.email}</span>
                  </a>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-bold block">Phone Number</span>
                  {selectedInquiry.phone ? (
                    <a href={`tel:${selectedInquiry.phone}`} className="font-semibold text-gray-800 flex items-center gap-1.5 mt-1 hover:text-blue-600">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedInquiry.phone}</span>
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-400 block mt-1">Not provided</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-bold block">Check In</span>
                  <span className="font-semibold text-gray-800 block mt-1">{formatDate(selectedInquiry.check_in_date)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-bold block">Check Out</span>
                  <span className="font-semibold text-gray-800 block mt-1">{formatDate(selectedInquiry.check_out_date)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-bold block">Guests Count</span>
                  <span className="font-bold text-gray-850 block mt-1">{selectedInquiry.guests}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-bold block mb-2">Guest Message / Special Requests</span>
                <p className="bg-slate-50 text-gray-750 p-4 rounded-xl text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line border border-slate-100">
                  {selectedInquiry.message || "No special requests included."}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold font-sans">Status:</span>
                  <select 
                    value={selectedInquiry.status}
                    onChange={(e) => updateInquiryStatus(selectedInquiry.id, e.target.value)}
                    className="text-xs font-bold rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none bg-white"
                  >
                    <option value="new">new</option>
                    <option value="contacting">contacting</option>
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
                <button 
                  onClick={() => deleteInquiry(selectedInquiry.id)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
