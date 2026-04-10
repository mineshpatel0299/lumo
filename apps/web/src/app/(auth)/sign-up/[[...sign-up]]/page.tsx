'use client'

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles, Quote } from "lucide-react";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex min-h-screen w-screen bg-bg-base overflow-hidden">
      {/* Left Side: Visual & Brand */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-border-subtle">
        <Image 
          src="/login-bg.png" 
          alt="Lumo background" 
          fill 
          className="object-cover opacity-60 pointer-events-none"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-base/20 via-transparent to-bg-base/80" />
        
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Lumo</span>
        </div>

        {/* Motivational Quote */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-md"
          >
            <Quote className="text-accent mb-4 opacity-50" size={32} />
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Build your future, one task at a time.
            </h2>
            <p className="text-zinc-400 text-lg">
              Join the community of builders using Lumo to orchestrate their most ambitious projects.
            </p>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center gap-6 text-xs font-medium text-zinc-500 uppercase tracking-widest">
          <span>Trusted by innovators</span>
          <div className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span>Built for the future</span>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 lg:hidden bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Logo for mobile only */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 mb-4">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Lumo</h1>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">Create Account</h2>
            <p className="text-text-tertiary mt-2">Join Lumo today and start shipping.</p>
          </div>

          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent border-none shadow-none p-0",
                header: "hidden", 
                navbar: "hidden",
                formButtonPrimary: "bg-accent hover:bg-accent-hover text-white text-sm font-semibold h-11 transition-all active:scale-[0.98] shadow-lg shadow-accent/20",
                socialButtonsBlockButton: "bg-bg-elevated/50 border-border-subtle hover:bg-bg-elevated hover:border-border-default text-text-primary transition-colors h-11",
                socialButtonsBlockButtonText: "font-medium text-sm",
                formFieldLabel: "text-text-secondary text-xs font-bold uppercase tracking-wider mb-2",
                formFieldInput: "bg-bg-base/50 border-border-subtle text-text-primary focus:border-accent focus:ring-accent/20 transition-all h-11 rounded-xl",
                footerActionText: "text-text-tertiary text-sm",
                footerActionLink: "text-accent hover:text-accent-hover font-semibold transition-colors",
                dividerLine: "bg-border-subtle",
                dividerText: "text-text-tertiary text-[10px] font-bold uppercase tracking-widest",
              },
              layout: {
                shimmer: true,
                logoPlacement: "none"
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
