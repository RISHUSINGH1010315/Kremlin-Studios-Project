"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Smartphone, 
  Calendar,
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Send, 
  X, 
  Star, 
  Sliders, 
  Building,
  Menu,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Tv,
  Coffee,
  Key,
  Flame,
  Award,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// API Base URL (Dynamic for local dev & production deployment)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const prefix = process.env.NEXT_PUBLIC_BASE_PATH || "";

const ROOM_IMAGES = [
  { url: `${prefix}/images/hotel_new_5.jpg`, title: "The Balcony Suite", desc: "Plush double bed, backlit circular mirror, and direct balcony workspace" },
  { url: `${prefix}/images/hotel_new_4.jpg`, title: "The Kremlin Suite", desc: "Beautifully styled room with St. Basil's artwork, TV, and lounge area" },
  { url: `${prefix}/images/hotel_new_1.jpg`, title: "The Living Space", desc: "Modern open-concept living area with comfortable sofa and smart TV" },
  { url: `${prefix}/images/hotel_new_2.jpg`, title: "The Kitchenette Lounge", desc: "Fully equipped kitchenette, mini-fridge, and comfortable seating" },
];

const LiveBotAvatar = ({ isListening = false, isBlinking = false, size = "md" }: { isListening?: boolean; isBlinking?: boolean; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-10 h-10";
  return (
    <div className={`relative ${sizeClasses} rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden shadow-inner`}>
      <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
        {/* Cute Head Overlay */}
        <circle cx="50" cy="50" r="40" className="fill-white/10 stroke-white/25 stroke-2 animate-pulse" />
        
        {/* Eyes (Blinking + Wide Listening) */}
        <ellipse 
          cx="35" 
          cy="45" 
          rx="5.5" 
          ry={isBlinking ? 0.8 : (isListening ? 7.5 : 5.5)} 
          className="fill-white transition-all duration-150" 
        />
        <ellipse 
          cx="65" 
          cy="45" 
          rx="5.5" 
          ry={isBlinking ? 0.8 : (isListening ? 7.5 : 5.5)} 
          className="fill-white transition-all duration-150" 
        />
        
        {/* blushing cheeks */}
        <circle cx="28" cy="54" r="4.5" style={{ fill: 'rgba(244, 63, 94, 0.5)' }} />
        <circle cx="72" cy="54" r="4.5" style={{ fill: 'rgba(244, 63, 94, 0.5)' }} />

        {/* Smiling Mouth */}
        <path 
          d="M 38 60 Q 50 71 62 60" 
          fill="none" 
          stroke="white" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          className="transition-all duration-300"
        />

        {/* Listening antenna signal */}
        {isListening ? (
          <g>
            <circle cx="50" cy="18" r="3.5" className="fill-cyan-300 animate-ping" />
            <circle cx="50" cy="18" r="3.5" className="fill-cyan-300" />
            <path d="M 50 22 L 50 28" stroke="white" strokeWidth="2.5" />
          </g>
        ) : (
          <g>
            <circle cx="50" cy="22" r="2" className="fill-white/70" />
            <path d="M 50 25 L 50 28" stroke="white" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default function Home() {
  // --- STATE VARIABLES ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Stays & booking states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hello! Welcome to Kremlin Luxury Studios. I'm your Kremlin Concierge. Ask me anything about check-in rules, pricing, amenities, or local NCR attractions!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState("");
  const [isBlinking, setIsBlinking] = useState(false);

  // Booking Wizard states
  const [bookingQuery, setBookingQuery] = useState({
    checkInDate: "",
    checkOutDate: "",
    guests: "1"
  });

  // Validation Regexes for client-side sanitization
  const emailRegex = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}$/;
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    checkInDate: "",
    checkOutDate: "",
    guests: "1",
    message: ""
  });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Auto-slide Hero Images
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % ROOM_IMAGES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Initialize Session ID, log visit + blink timer
  useEffect(() => {
    setChatSessionId("session_" + Math.random().toString(36).substring(2, 11));
    logAnalyticsEvent("page_view", { path: "/" });

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  // --- API HELPER FUNCTIONS ---
  const logAnalyticsEvent = async (eventType: string, metadata?: any) => {
    try {
      await fetch(`${API_URL}/analytics/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, pagePath: "/", referrer: document.referrer || null, metadata })
      });
    } catch (err) {
      console.warn("Analytics event failed:", err);
    }
  };

  const handleBookingInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setFormError("");

    // Client-side validations
    const cleanEmail = contactForm.email.trim();
    if (!emailRegex.test(cleanEmail)) {
      setFormError("Please enter a valid email address format.");
      setContactLoading(false);
      return;
    }

    if (contactForm.phone) {
      const cleanPhone = contactForm.phone.trim();
      if (!phoneRegex.test(cleanPhone)) {
        setFormError("Please enter a valid phone number (7-20 digits).");
        setContactLoading(false);
        return;
      }
    }

    logAnalyticsEvent("cta_click", { action: "submit_booking_inquiry" });
    try {
      const response = await fetch(`${API_URL}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contactForm,
          source: "contact_form"
        })
      });
      if (response.ok) {
        setContactSuccess(true);
        setContactForm({
          name: "",
          email: "",
          phone: "",
          checkInDate: "",
          checkOutDate: "",
          guests: "1",
          message: ""
        });
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContactLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    logAnalyticsEvent("chat_message_sent");

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: chatSessionId,
          message: userMsg
        })
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Apologies, I encountered a connection issue. Please feel free to email us directly at kremlinluxurystudios@gmail.com!" }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSearchStay = (e: React.FormEvent) => {
    e.preventDefault();
    logAnalyticsEvent("date_check", bookingQuery);
    // Auto fill contact form with these dates and scroll down to booking contact
    setContactForm({
      ...contactForm,
      checkInDate: bookingQuery.checkInDate,
      checkOutDate: bookingQuery.checkOutDate,
      guests: bookingQuery.guests
    });
    setBookingModalOpen(true);
  };

  const roomSpaces = [
    { title: "The Kremlin Suite", img: `${prefix}/images/hotel_new_4.jpg`, desc: "A cozy king-sized bed featuring St. Basil's artwork, soft premium grey linens, and warm bedside controls." },
    { title: "Lounge & Seating Area", img: `${prefix}/images/hotel_new_1.jpg`, desc: "A plush teal couch, modern coffee table, and smart media console, ideal for lounging or creative work." },
    { title: "Fully Equipped Kitchenette", img: `${prefix}/images/hotel_new_2.jpg`, desc: "Equipped with a refrigerator, microwave, induction plate, kettle, and all essentials to prepare your meals." },
    { title: "Cozy Bedroom Retreat", img: `${prefix}/images/hotel_new_3.jpg`, desc: "An alternative double bed layout with grey drapes, air conditioning, and soft floor tiles." }
  ];

  const galleryImages = [
    { url: `${prefix}/images/hotel_new_5.jpg`, title: "Master Suite & Backlit Mirror" },
    { url: `${prefix}/images/hotel_new_4.jpg`, title: "Kremlin Art Decor Bed" },
    { url: `${prefix}/images/hotel_new_1.jpg`, title: "Living Lounge & Sofa" },
    { url: `${prefix}/images/hotel_new_2.jpg`, title: "Kitchenette & Entertainment" },
    { url: `${prefix}/images/hotel_new_3.jpg`, title: "Cozy Double Bed Layout" },
    { url: `${prefix}/images/IMG_20251002_163411.jpg`, title: "Master Bed Detail" },
    { url: `${prefix}/images/IMG_20251002_170139.jpg`, title: "Balcony Seating View" },
    { url: `${prefix}/images/IMG_20251002_174306.jpg`, title: "Gaur City Center Building" }
  ];

  const localGuides = [
    { title: "Iconic Delhi (35 Mins)", items: [
      { name: "India Gate", desc: "Majestic war memorial perfect for sunset strolls and photography.", img: `${prefix}/images/indiagate.jpg` },
      { name: "Humayun's Tomb", desc: "Stunning red sandstone Mughal architecture that inspired the Taj Mahal.", img: `${prefix}/images/humayuns.jpg` },
      { name: "Qutub Minar", desc: "Tallest brick minaret in the world, showcasing historical stone design.", img: `${prefix}/images/qutubminar.jpg` }
    ]},
    { title: "Greater Noida West (Local)", items: [
      { name: "Gaur City Mall", desc: "Steps from the studio, featuring a massive food court, movies, and shopping.", img: `${prefix}/images/gaurcitymall.jpeg` },
      { name: "Grand Venice Mall", desc: "Famous for its indoor canals, gondola rides, and Roman architecture.", img: `${prefix}/images/venicemall.avif` },
      { name: "Local Parks & Eateries", desc: "Beautiful green spaces and popular modern cafes right at Sector 4.", img: `${prefix}/images/eateries.jpeg` }
    ]}
  ];

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen relative text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- BACKGROUND GLOW EFFECT --- */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-blue-200/10 to-purple-200/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[400px] right-10 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-200/10 to-blue-200/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* --- HEADER NAVIGATION --- */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src={`${prefix}/images/Logo.png`} 
              alt="Kremlin Luxury Studios" 
              className="w-12 h-12 rounded-xl object-contain transition-transform group-hover:scale-105 shadow-md shadow-blue-500/5"
            />
            <div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900 font-sans">KREMLIN</span>
              <span className="text-xs block text-purple-600 font-bold tracking-widest mt-[-3px]">LUXURY STUDIOS</span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#rooms" className="hover:text-blue-600 transition-colors">The Studio</a>
            <a href="#amenities" className="hover:text-blue-600 transition-colors">Amenities</a>
            <a href="#guide" className="hover:text-blue-600 transition-colors">Local Guide</a>
            <a href="#gallery" className="hover:text-blue-600 transition-colors">Gallery</a>
            <a href="#reviews" className="hover:text-blue-600 transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={() => { setBookingModalOpen(true); logAnalyticsEvent("cta_click", { action: "header_book_now" }); }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold hover:opacity-95 shadow-md shadow-blue-500/10 transition-smooth hover:translate-y-[-1px]"
            >
              Book Your Stay
            </button>
          </div>

          <button className="lg:hidden p-2 text-gray-700 hover:text-gray-900" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* --- MOBILE NAVIGATION PANEL --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-0 z-50 bg-white flex flex-col p-6 sm:p-8 lg:hidden overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <img src={`${prefix}/images/Logo.png`} alt="Kremlin Luxury Studios" className="w-9 h-9 object-contain" />
                <span className="font-extrabold tracking-tight">KREMLIN LUXURY STUDIOS</span>
              </div>
              <button className="p-2 border rounded-full" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 text-xl font-bold text-gray-800">
              <a href="#rooms" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">The Studio</a>
              <a href="#amenities" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">Amenities</a>
              <a href="#guide" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">Local Guide</a>
              <a href="#gallery" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">Gallery</a>
              <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">Reviews</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">Contact</a>
            </nav>

            <button 
              onClick={() => { setMobileMenuOpen(false); setBookingModalOpen(true); }}
              className="mt-auto w-full text-center py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg shadow-blue-500/20"
            >
              Book Your Stay
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SLIDESHOW SECTION --- */}
      <section className="relative min-h-[85vh] md:min-h-[95vh] flex items-center justify-center pt-28 pb-12 sm:pb-16 overflow-hidden">
        {/* Slideshow images background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImageIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="w-full h-full relative"
            >
              <img 
                src={ROOM_IMAGES[activeImageIndex].url} 
                alt={ROOM_IMAGES[activeImageIndex].title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/45" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6 uppercase tracking-wider"
          >
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <span>Exquisite Luxury Retreat stayed in Gaur City</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-bold font-serif text-white tracking-tight leading-tight mb-4 sm:mb-6"
          >
            Experience Imperial Opulence
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed font-normal"
          >
            An exclusive sanctuary at Gaur City Centre where classic grandeur meets modern luxury. Your unforgettable NCR stay awaits.
          </motion.p>

          {/* Quick Dates selector booking box */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-3xl glass-card rounded-3xl p-4 sm:p-6 shadow-2xl"
          >
            <form onSubmit={handleSearchStay} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span>Check In</span>
                </label>
                <input 
                  type="date" 
                  required
                  value={bookingQuery.checkInDate}
                  onChange={(e) => setBookingQuery({...bookingQuery, checkInDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 text-gray-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span>Check Out</span>
                </label>
                <input 
                  type="date" 
                  required
                  value={bookingQuery.checkOutDate}
                  onChange={(e) => setBookingQuery({...bookingQuery, checkOutDate: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 text-gray-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-blue-600" />
                  <span>Guests</span>
                </label>
                <select 
                  value={bookingQuery.guests}
                  onChange={(e) => setBookingQuery({...bookingQuery, guests: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600 text-gray-800 font-semibold cursor-pointer"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                </select>
              </div>

              <div className="flex items-end">
                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-blue-500/10 transition-smooth hover:translate-y-[-1px]"
                >
                  Check Stay Availability
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* --- THE STUDIO / SPACES SECTION --- */}
      <section id="rooms" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-blue-600 font-bold mb-3">ROOM OVERVIEW</h2>
            <h3 className="text-3xl md:text-5xl font-bold font-serif text-gray-950">
              Curated Spaces in Kremlin Studios
            </h3>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Step inside our luxury studio apartment, meticulously conceptualized to blend stay comforts with a premium aesthetic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roomSpaces.map((space, idx) => (
              <div 
                key={idx}
                className="group border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-smooth flex flex-col bg-white cursor-pointer"
                onClick={() => { setLightboxImage(space.img); logAnalyticsEvent("cta_click", { action: "open_space_detail", space: space.title }); }}
              >
                <div className="h-56 sm:h-64 overflow-hidden relative w-full">
                  <img 
                    src={space.img} 
                    alt={space.title} 
                    className="w-full h-full object-cover transform group-hover:scale-103 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 font-sans group-hover:text-blue-600 transition-colors">{space.title}</h4>
                    <p className="text-xs leading-relaxed text-gray-500">{space.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase mt-6 tracking-wider inline-flex items-center gap-1">
                    <span>Inspect Space</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- AMENITIES GRID --- */}
      <section id="amenities" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-purple-600 font-bold mb-3">CONVENIENCE DETAILS</h2>
            <h3 className="text-3xl md:text-5xl font-bold font-serif text-gray-950">
              Curated for Absolute Comfort
            </h3>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              We&apos;ve integrated modern amenities to ensure your Greater Noida stay is convenient and seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              { title: "High-Speed Wi-Fi", icon: Wifi, desc: "150 Mbps fiber connectivity, perfect for streaming, uploads, or workspace calls." },
              { title: "Smart TV with Netflix", icon: Tv, desc: "Ultra HD TV setup complete with Netflix, YouTube, and active accounts." },
              { title: "Gourmet Kitchenette", icon: Coffee, desc: "Equipped with induction, microwave, kettle, mugs, tea/coffee packets, and pans." },
              { title: "Plush Luxury Linens", icon: Layers, desc: "High-thread-count clean sheets, soft blankets, and designer bedside pillows." },
              { title: "24/7 Hot Water Geyser", icon: Flame, desc: "Reliable hot water geyser in bathroom for warm showers anytime." },
              { title: "Secure Self Check-in", icon: Key, desc: "Dynamic electronic lock system. Access codes generated privately for every guest." },
            ].map((amenity, idx) => {
              const Icon = amenity.icon;
              return (
                <div key={idx} className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{amenity.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{amenity.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- STUDIO GALLERY GRID --- */}
      <section id="gallery" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-blue-600 font-bold mb-3">GALLERY DETAILS</h2>
            <h3 className="text-3xl md:text-5xl font-bold font-serif text-gray-950">
              Explore Every Corner
            </h3>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Visual snapshots detailing our luxury retreat apartment and balcony views in Gaur City. Click to inspect.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {galleryImages.map((image, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer shadow-md hover:shadow-xl transition-smooth"
                onClick={() => { setLightboxImage(image.url); logAnalyticsEvent("cta_click", { action: "open_gallery_image", name: image.title }); }}
              >
                <img 
                  src={image.url} 
                  alt={image.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-white text-xs font-bold">{image.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- NCR LOCAL GUIDE CAROUSEL --- */}
      <section id="guide" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-purple-600 font-bold mb-3">NCR EXPLORATION</h2>
            <h3 className="text-3xl md:text-5xl font-bold font-serif text-gray-950">
              Location Guides & Surrounding Sights
            </h3>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Explore famous historical architecture and modern malls located easily from Gaur City Centre Noida.
            </p>
          </div>

          <div className="space-y-12">
            {localGuides.map((guideGroup, gIdx) => (
              <div key={gIdx} className="border-t border-slate-200/60 pt-8">
                <h4 className="font-extrabold text-xl text-gray-950 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span>{guideGroup.title}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {guideGroup.items.map((item, iIdx) => (
                    <div key={iIdx} className="bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                      <div className="h-40 bg-slate-200 relative">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h5 className="font-bold text-gray-900 text-sm">{item.name}</h5>
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- GUEST TESTIMONIALS & REVIEWS --- */}
      <section id="reviews" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-blue-600 font-bold mb-3">GUEST EXPERIENCES</h2>
            <h3 className="text-3xl md:text-5xl font-bold font-serif text-gray-950">
              What Guests Say About Us
            </h3>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Reviews left by travelers and creators who stayed at Kremlin Luxury Studios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "A truly royal experience! The room setup is amazing, and everything looks exactly like the photos. The self check-in was very smooth and the host was extremely helpful.",
                author: "Sarah Kumar",
                role: "Stayed Oct 2025",
                rating: 5
              },
              {
                quote: "Extremely clean and cozy room. The Wi-Fi is super fast, which helped me work during my trip. Located right near Gaur City Mall, so getting food and supplies was very convenient.",
                author: "Aman Sharma",
                role: "Stayed Nov 2025",
                rating: 5
              },
              {
                quote: "Wonderful balcony view and beautiful room interiors. Kettle and tea supplies were a great touch. High quality linens made our stay very comfortable. Will definitely book again!",
                author: "Divya Singh",
                role: "Stayed Jan 2026",
                rating: 5
              }
            ].map((review, idx) => (
              <div key={idx} className="p-8 rounded-3xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm shadow-slate-100/50">
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic leading-relaxed text-xs sm:text-sm">&ldquo;{review.quote}&rdquo;</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h5 className="font-bold text-gray-900 text-xs sm:text-sm">{review.author}</h5>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">{review.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT INQUIRY & LOCATION --- */}
      <section id="contact" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-blue-600 font-bold mb-3">PLAN YOUR RETREAT</h2>
            <h3 className="text-3xl md:text-5xl font-bold font-serif text-gray-950">
              Submit Direct Reservation Query
            </h3>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Fill details below to inquiry stay rates or check availability directly with the hosts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto p-4 sm:p-8 rounded-3xl glass-card border border-slate-200/80 shadow-2xl bg-white">
            <div className="lg:col-span-7">
              <h4 className="text-lg font-bold text-gray-950 mb-6">Reservation Form</h4>
              
              {contactSuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded-2xl text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                  <h5 className="text-lg font-bold">Inquiry Sent Successfully!</h5>
                  <p className="text-xs text-green-750 max-w-xs mx-auto">
                    We have received your dates. Kremlin host will contact you shortly via email or phone.
                  </p>
                  <button 
                    onClick={() => setContactSuccess(false)}
                    className="px-6 py-2 border border-green-200 text-xs font-bold rounded-lg hover:bg-green-150 transition-colors"
                  >
                    Send another query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingInquiry} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Sarah Kumar"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 transition-colors text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="you@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 transition-colors text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="+91 99888 77665"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 transition-colors text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Guests Count</label>
                      <select 
                        value={contactForm.guests}
                        onChange={(e) => setContactForm({...contactForm, guests: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 transition-colors text-gray-800 cursor-pointer"
                      >
                        <option value="1">1 Guest</option>
                        <option value="2">2 Guests</option>
                        <option value="3">3 Guests</option>
                        <option value="4">4 Guests</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Check In Date</label>
                      <input 
                        type="date" 
                        value={contactForm.checkInDate}
                        onChange={(e) => setContactForm({...contactForm, checkInDate: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 transition-colors text-gray-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Check Out Date</label>
                      <input 
                        type="date" 
                        value={contactForm.checkOutDate}
                        onChange={(e) => setContactForm({...contactForm, checkOutDate: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 transition-colors text-gray-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1.5">Special Requests / Message</label>
                    <textarea 
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      placeholder="Specify if you require early check-in, parking spaces, or direct stay deals..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 transition-colors resize-none text-gray-800"
                    />
                  </div>

                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex gap-2 items-center">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={contactLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:opacity-95 shadow-md shadow-blue-500/10 transition-smooth disabled:opacity-50 text-xs uppercase tracking-wider"
                  >
                    {contactLoading ? "Submitting Inquiry..." : "Submit Reservation Inquiry"}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-950 mb-6">Contact & Location</h4>
                <div className="space-y-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">
                      <strong>Studio Address:</strong><br />
                      Gaur City Centre, Sector 4, Greater Noida West, Near Char Murti, Uttar Pradesh, India
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <a href="mailto:kremlinluxurystudios@gmail.com" className="hover:text-blue-600 transition-colors text-xs">
                      kremlinluxurystudios@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <a href="tel:+918799775158" className="hover:text-blue-600 transition-colors text-xs">
                      +91 8799775158
                    </a>
                  </div>
                </div>
              </div>

              {/* Map embed */}
              <div className="mt-8 rounded-2xl overflow-hidden h-44 border border-slate-200 shadow-inner">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.579455113975!2d77.4302297753177!3d28.612395475675444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5669b668079%3A0x1434c31161f3018b!2sGAUR%20CITY%20CENTRE!5e0!3m2!1sen!2sin!4v1728043513689!5m2!1sen!2sin3"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true}
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 text-white py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-900 pb-8 mb-8">
          <div className="flex items-center gap-3">
            <img src={`${prefix}/images/Logo.png`} alt="Kremlin Luxury Studios" className="w-10 h-10 object-contain" />
            <span className="font-extrabold tracking-tight text-white">KREMLIN LUXURY STUDIOS</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400">
            <a href="#rooms" className="hover:text-white transition-colors">The Studio</a>
            <a href="#amenities" className="hover:text-white transition-colors">Amenities</a>
            <a href="#guide" className="hover:text-white transition-colors">Local Guide</a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Kremlin Luxury Studios. All Rights Reserved. Gaur City Centre Sector-4 Noida NCR.</p>
          <div className="flex gap-4 font-semibold">
            <a href="tel:+918799775158" className="hover:text-white">Call Host</a>
            <a href="mailto:kremlinluxurystudios@gmail.com" className="hover:text-white">Email Reservation</a>
          </div>
        </div>
      </footer>

      {/* --- FLOATING CONCIERGE CHATBOT WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm h-[450px] sm:h-[480px] max-h-[calc(100vh-8.5rem)] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden mb-4"
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <LiveBotAvatar isListening={chatLoading} isBlinking={isBlinking} size="sm" />
                  <div>
                    <h4 className="font-bold text-sm leading-none">Kremlin Concierge</h4>
                    <span className="text-[10px] text-blue-100 mt-1 block">Stay Assistant</span>
                  </div>
                </div>
                <button 
                  className="p-1 rounded-full hover:bg-white/10 transition-colors" 
                  onClick={() => setChatOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-blue-600 text-white rounded-br-none" 
                          : "bg-white border border-slate-200 text-gray-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat suggestions */}
              <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-1.5 bg-white">
                {[
                  "Booking rates?",
                  "Check-in rules?",
                  "Studio Amenities",
                  "Creator retreat?",
                  "Nearby food places?",
                  "Let's chat!"
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setChatInput(sug); logAnalyticsEvent("cta_click", { action: "chat_suggestion", text: sug }); }}
                    className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-150 flex gap-2 bg-white">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask Kremlin Concierge..."
                  className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:bg-slate-50 focus:ring-1 focus:ring-blue-600"
                />
                <button 
                  onClick={handleSendMessage}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => { setChatOpen(!chatOpen); logAnalyticsEvent("cta_click", { action: "toggle_chat_widget" }); }}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform"
        >
          <LiveBotAvatar isListening={chatLoading} isBlinking={isBlinking} size="lg" />
        </button>
      </div>

      {/* --- STAY BOOKING MODAL --- */}
      <AnimatePresence>
        {bookingModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <button 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border rounded-full p-1.5" 
                onClick={() => setBookingModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <img src={`${prefix}/images/Logo.png`} alt="Kremlin Luxury Studios" className="w-16 h-16 object-contain mx-auto mb-4" />
                <h3 className="text-xl font-bold tracking-tight">Reserve Kremlin Studio</h3>
                <p className="text-xs text-gray-500 mt-1">Gaur City Centre, Greater Noida NCR</p>
                
                <div className="flex justify-center items-center gap-1.5 text-yellow-400 text-xs font-semibold mt-3 bg-yellow-50/50 py-1.5 px-3 rounded-xl border border-yellow-100/60 max-w-xs mx-auto">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-700">Highly Rated Room Stay By Creators</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <a 
                  href="https://www.booking.com/hotel/in/kremlin-luxury-studios.en-gb.html" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 border rounded-xl hover:border-blue-500 hover:bg-slate-50 transition-all group font-semibold text-gray-800 text-sm"
                  onClick={() => logAnalyticsEvent("cta_click", { action: "book_via_booking_dot_com" })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs">B</div>
                    <span>Booking.com</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a 
                  href="https://www.makemytrip.com/hotels/hotel-details/?hotelId=202011161208226993&checkin=10052025&checkout=10062025&roomStayQualifier=2e0e&city=DEL&country=IN&state=UP" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 border rounded-xl hover:border-[#FF6D38] hover:bg-slate-50 transition-all group font-semibold text-gray-800 text-sm"
                  onClick={() => logAnalyticsEvent("cta_click", { action: "book_via_make_my_trip" })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs">M</div>
                    <span>MakeMyTrip</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a 
                  href="https://www.airbnb.co.in/rooms/1521891611523758136?adults=2&search_mode=regular_search" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 border rounded-xl hover:border-[#FF5A5F] hover:bg-slate-50 transition-all group font-semibold text-gray-800 text-sm"
                  onClick={() => logAnalyticsEvent("cta_click", { action: "book_via_airbnb" })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs">A</div>
                    <span>Airbnb</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

              <div className="relative flex py-4 items-center my-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs">Or reserve directly</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <a 
                  href="tel:+918799775158" 
                  className="py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-xs text-center flex flex-col items-center gap-1.5 transition-colors text-gray-800"
                  onClick={() => logAnalyticsEvent("cta_click", { action: "direct_call_booking" })}
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>Call Direct</span>
                </a>
                <a 
                  href="mailto:kremlinluxurystudios@gmail.com" 
                  className="py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-xs text-center flex flex-col items-center gap-1.5 transition-colors text-gray-800"
                  onClick={() => logAnalyticsEvent("cta_click", { action: "direct_email_booking" })}
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Email Direct</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LOCAL GUIDES MODAL --- */}
      <AnimatePresence>
        {guideModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl border border-slate-100"
            >
              <button 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border rounded-full p-1.5 z-10 bg-white" 
                onClick={() => setGuideModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">NCR Local Sightseeing & Shoots Guide</h3>
                <p className="text-sm text-gray-500 mt-1">Famous sightseeing attractions near Kremlin Luxury Studios</p>
              </div>

              <div className="space-y-8">
                {localGuides.map((guideGroup, gIdx) => (
                  <div key={gIdx} className="border-t border-slate-100 pt-6">
                    <h4 className="font-extrabold text-lg text-gray-950 mb-4">{guideGroup.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {guideGroup.items.map((item, iIdx) => (
                        <div key={iIdx} className="border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between bg-slate-50">
                          <div className="h-32 bg-slate-200 relative">
                            <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="font-bold text-gray-900 text-sm">{item.name}</h5>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- IMAGE LIGHTBOX --- */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setLightboxImage(null)}
          >
            <button className="absolute top-6 right-6 text-white text-3xl">&times;</button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage} 
              alt="High-resolution room space detail" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            />
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
