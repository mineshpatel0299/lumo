'use client'

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-bg-base overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.05),transparent_50%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[400px] px-4"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 mb-4"
          >
            <Sparkles className="text-white" size={24} />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
          <p className="text-text-tertiary text-sm mt-1">Sign in to your Lumo account</p>
        </div>

        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-bg-surface/50 backdrop-blur-xl border border-border-subtle shadow-2xl p-0",
              header: "hidden", // Hide default header to use our custom one
              navbar: "hidden",
              formButtonPrimary: "bg-accent hover:bg-accent-hover text-white text-sm font-semibold h-10 transition-all active:scale-[0.98]",
              socialButtonsBlockButton: "bg-bg-elevated/50 border-border-subtle hover:bg-bg-elevated hover:border-border-default text-text-primary transition-colors h-10",
              socialButtonsBlockButtonText: "font-medium",
              formFieldLabel: "text-text-secondary text-xs font-bold uppercase tracking-wider mb-1",
              formFieldInput: "bg-bg-base/50 border-border-subtle text-text-primary focus:border-accent focus:ring-accent/20 transition-all h-10",
              footerActionText: "text-text-tertiary text-xs",
              footerActionLink: "text-accent hover:text-accent-hover font-semibold transition-colors",
              identityPreviewText: "text-text-primary",
              identityPreviewEditButtonIcon: "text-text-secondary",
              dividerLine: "bg-border-subtle",
              dividerText: "text-text-tertiary text-[10px] font-bold uppercase tracking-widest",
              formResendCodeLink: "text-accent",
            },
            layout: {
              shimmer: true,
              logoPlacement: "none"
            }
          }}
        />
      </motion.div>

      {/* Decorative Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
