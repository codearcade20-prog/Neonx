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
            className="w-full max-w-lg bg-[#150a10] border border-neon-purple shadow-[0_0_50px_rgba(168,85,247,0.3)] rounded-3xl p-5 sm:p-8 pointer-events-auto relative max-h-[90dvh] overflow-y-auto"
          >

            {/* The Tiny Racing Car */}
            <div
              ref={carRef}
              className="absolute top-0 left-0 text-3xl pointer-events-auto z-[102] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] cursor-pointer select-none"
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-neon-purple/20 blur-[50px] pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6 relative z-10 pointer-events-none">
              <h2 className="text-3xl font-black text-white drop-shadow-glow mb-2">CodeArcade</h2>
              <p className="text-neon-pink text-sm font-bold tracking-wide uppercase mb-3">Ideas & Suggestions</p>

              <p className="text-gray-300 text-sm leading-relaxed">
                Your ideas and suggestions are welcome! Even if you want any website and mobile apps for an affordable price, contact us.
              </p>
              <div className="text-white font-bold text-sm mt-1">CodeArcade is here.</div>
            </div>

            {/* Install Web App Suggestion Banner */}
            <div className="mb-6 p-3.5 sm:p-4 bg-gradient-to-r from-neon-purple/20 via-black/40 to-neon-pink/20 border border-neon-purple/40 rounded-2xl flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(168,85,247,0.15)] relative z-10">
              <div className="flex items-center gap-3">
                <img
                  src="/app_logo.jpg"
                  alt="Neonx App Logo"
                  className="w-11 h-11 rounded-xl object-cover border border-neon-purple/60 shadow-[0_0_12px_rgba(168,85,247,0.5)] shrink-0"
                />
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    Install Neonx App
                    <span className="text-[10px] bg-neon-pink/30 text-neon-pink px-1.5 py-0.5 rounded font-black uppercase">Free</span>
                  </h4>
                  <p className="text-[11px] text-gray-300"> 1-tap instant launch</p>
                </div>
              </div>

              {isInstalled || installSuccess ? (
                <div className="flex items-center gap-1 text-xs text-neon-green font-bold bg-neon-green/10 border border-neon-green/30 px-3 py-1.5 rounded-xl shrink-0">
                  <Check size={14} /> Installed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-2 bg-neon-purple hover:bg-neon-pink text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Download size={14} /> Install
                </button>
              )}
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-green shadow-[0_0_20px_rgba(74,222,128,0.4)]">
                  <Send className="text-neon-green" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400">We'll get back to you soon.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-purple" size={18} />
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-purple" size={18} />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-purple" size={18} />
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Mobile Number (Optional)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 text-neon-purple" size={18} />
                  <textarea
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your suggestion or enquiry..."
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-pink text-white rounded-xl font-bold text-lg uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Send to CodeArcade <Send size={18} /></>
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
