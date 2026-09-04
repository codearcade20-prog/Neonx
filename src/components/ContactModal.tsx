import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { X, Send, User, Mail, Phone, MessageSquare, Download, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction for iOS or unsupported browsers
      alert("To install Neonx:\n\n• On iPhone / iPad: Tap the 'Share' button (⎋) in Safari and choose 'Add to Home Screen' (⊞).\n• On Android / Chrome: Tap the three dots (⋮) menu and select 'Install app' or 'Add to Home screen'.");
    }
  };

  // Tiny Racing State
  const distanceRef = useRef(0);
  const boostRef = useRef(0);
  const chargeRef = useRef(0);
  const isChargingRef = useRef(false);
  const carRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalSizeRef = useRef({ w: 0, h: 0 });
  const BASE_SPEED = 5;

  useEffect(() => {
    if (!isOpen) return;

    const updateSize = () => {
      if (modalRef.current) {
        modalSizeRef.current = {
          w: modalRef.current.offsetWidth,
          h: modalRef.current.offsetHeight
        };
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  useAnimationFrame((_, delta) => {
    if (isChargingRef.current) {
      // Accumulate charge while holding (max charge caps out)
      chargeRef.current = Math.min(chargeRef.current + delta * 0.08, 80);

      // Car creeps forward slowly while charging
      const currentSpeed = BASE_SPEED * 0.2;
      distanceRef.current = (distanceRef.current + currentSpeed * (delta / 1000)) % 100;
    } else {
      // If we just released and have a charge, convert it to a massive speed boost
      if (chargeRef.current > 0) {
        boostRef.current = chargeRef.current;
        chargeRef.current = 0;
      }

      // Decay the boost speed back to 0 over roughly 3 seconds
      if (boostRef.current > 0) {
        boostRef.current = Math.max(boostRef.current - delta * 0.03, 0);
      }

      const currentSpeed = BASE_SPEED + boostRef.current;
      distanceRef.current = (distanceRef.current + currentSpeed * (delta / 1000)) % 100;
    }

    if (carRef.current && modalSizeRef.current.w > 0) {
      const { w, h } = modalSizeRef.current;
      const perimeter = 2 * (w + h);
      const currentDist = (distanceRef.current / 100) * perimeter;

      let x = 0, y = 0, rotate = 0;

      if (currentDist < w) {
        x = currentDist; y = 0; rotate = 0;
      } else if (currentDist < w + h) {
        x = w; y = currentDist - w; rotate = 90;
      } else if (currentDist < 2 * w + h) {
        x = w - (currentDist - (w + h)); y = h; rotate = 180;
      } else {
        x = 0; y = h - (currentDist - (2 * w + h)); rotate = 270;
      }

      const chargeScale = isChargingRef.current ? 1 + (chargeRef.current / 80) * 0.6 : 1;
      carRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rotate}deg) scaleX(-1) scale(${chargeScale})`;
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('enquiries')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile || null,
            message: formData.message
          }
        ]);

      if (error) {
        console.error('Error submitting form:', error);
        alert('Failed to send message. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSubmitted(true);

      // Reset form and close modal
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', mobile: '', message: '' });
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && [
        <motion.div
          key="contact-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />,
        <div key="contact-modal-wrapper" className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md sm:max-w-lg bg-[#150a10] border border-neon-purple shadow-[0_0_50px_rgba(168,85,247,0.3)] rounded-3xl p-4 sm:p-6 pointer-events-auto relative"
          >

            {/* The Tiny Racing Car */}
            <div
              ref={carRef}
              className="absolute top-0 left-0 text-2xl sm:text-3xl pointer-events-auto z-[102] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] cursor-pointer select-none"
              onPointerDown={(e) => {
                e.stopPropagation();
                if (e.currentTarget) {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
                isChargingRef.current = true;
              }}
              onPointerUp={(e) => {
                if (e.currentTarget) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
                isChargingRef.current = false;
              }}
              onPointerCancel={() => {
                isChargingRef.current = false;
              }}
              style={{
                touchAction: 'none'
              }}
            >
              🏎️
            </div>

            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-neon-purple/20 blur-[40px] pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-20 p-1"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-3 relative z-10 pointer-events-none">
              <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-glow leading-tight">CodeArcade</h2>
              <p className="text-neon-pink text-[11px] sm:text-xs font-bold tracking-wide uppercase mt-0.5 mb-1">Ideas & Suggestions</p>

              <p className="text-gray-300 text-[11px] sm:text-xs leading-snug">
                Your ideas are welcome! For affordable websites and mobile apps, <span className="text-white font-bold">CodeArcade is here.</span>
              </p>
            </div>

            {/* Install Web App Suggestion Banner */}
            <div className="mb-3 p-2.5 sm:p-3 bg-gradient-to-r from-neon-purple/20 via-black/40 to-neon-pink/20 border border-neon-purple/40 rounded-2xl flex items-center justify-between gap-2.5 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative z-10">
              <div className="flex items-center gap-2.5">
                <img
                  src="/app_logo.jpg"
                  alt="Neonx App Logo"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-neon-purple/60 shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0"
                />
                <div className="text-left">
                  <h4 className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-1">
                    Install Neonx App
                    <span className="text-[9px] bg-neon-pink/30 text-neon-pink px-1.5 py-0.2 rounded font-black uppercase">Free</span>
                  </h4>
                  <p className="text-[10px] text-gray-300">1-tap instant launch</p>
                </div>
              </div>

              {isInstalled || installSuccess ? (
                <div className="flex items-center gap-1 text-[11px] text-neon-green font-bold bg-neon-green/10 border border-neon-green/30 px-2.5 py-1 rounded-xl shrink-0">
                  <Check size={12} /> Installed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-neon-purple hover:bg-neon-pink text-white text-[11px] font-bold rounded-xl shadow-[0_0_12px_rgba(168,85,247,0.4)] hover:shadow-[0_0_18px_rgba(236,72,153,0.6)] transition-all flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Download size={12} /> Install
                </button>
              )}
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-neon-green shadow-[0_0_20px_rgba(74,222,128,0.4)]">
                  <Send className="text-neon-green" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Message Sent!</h3>
                <p className="text-gray-400 text-xs">We'll get back to you soon.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5 relative z-10">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neon-purple" size={15} />
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2 sm:py-2.5 pl-10 pr-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neon-purple" size={15} />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2 sm:py-2.5 pl-10 pr-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neon-purple" size={15} />
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Mobile Number (Optional)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2 sm:py-2.5 pl-10 pr-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3 text-neon-purple" size={15} />
                  <textarea
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your suggestion or enquiry..."
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2 sm:py-2.5 pl-10 pr-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Send to CodeArcade <Send size={15} /></>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      ]}
    </AnimatePresence>
  );
};
