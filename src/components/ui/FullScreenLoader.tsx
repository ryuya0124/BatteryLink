"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Battery, Zap } from "lucide-react"

interface FullScreenLoaderProps {
  label?: string
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ label }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Background animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_50%)]" />
      </div>

      {/* Main content */}
      <div
        className={`relative flex flex-col items-center transition-all duration-1000 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        {/* Battery icon with charging animation */}
        <div className="relative mb-8">
          <div className="relative animate-pulse-slow">
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50">
              <Battery className="w-16 h-16 text-blue-600" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center animate-bounce-slow">
              <Zap className="w-8 h-8 text-yellow-500 drop-shadow-sm" />
            </div>
          </div>

          {/* Charging rings */}
          <div className="absolute -inset-6 rounded-full border-2 border-blue-300/40 animate-spin-slow" />
          <div className="absolute -inset-8 rounded-full border border-indigo-200/30 animate-spin-reverse" />
          <div
            className="absolute -inset-10 rounded-full border border-blue-100/20 animate-spin-slow"
            style={{ animationDuration: "8s" }}
          />
        </div>

        {/* Loading bar */}
        <div className="w-72 h-3 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden mb-8 shadow-inner border border-blue-100/50">
          <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 rounded-full animate-loading-bar shadow-sm" />
        </div>

        {/* Brand name */}
        <div
          className={`text-center transition-all duration-700 delay-300 ${mounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent mb-3 animate-gradient drop-shadow-sm">
            BatteryLink
          </h1>
          <p className="text-gray-600 text-lg font-medium animate-fade">{label || "デバイスを接続中..."}</p>
        </div>

        {/* Pulse effect */}
        <div className="absolute inset-0 rounded-full bg-blue-400/5 animate-pulse-ring" />
      </div>

      {/* Corner decorations - matching dashboard style */}
      <div className="absolute top-8 left-8">
        <div
          className={`w-16 h-16 border-l-3 border-t-3 border-blue-300/50 rounded-tl-lg transition-all duration-1000 delay-500 ${mounted ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
        />
      </div>
      <div className="absolute top-8 right-8">
        <div
          className={`w-16 h-16 border-r-3 border-t-3 border-indigo-300/50 rounded-tr-lg transition-all duration-1000 delay-700 ${mounted ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
        />
      </div>
      <div className="absolute bottom-8 left-8">
        <div
          className={`w-16 h-16 border-l-3 border-b-3 border-blue-300/50 rounded-bl-lg transition-all duration-1000 delay-900 ${mounted ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
        />
      </div>
      <div className="absolute bottom-8 right-8">
        <div
          className={`w-16 h-16 border-r-3 border-b-3 border-indigo-300/50 rounded-br-lg transition-all duration-1000 delay-1100 ${mounted ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
        />
      </div>

      {/* Loading dots indicator */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          25% { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
          50% { transform: translateY(-15px) translateX(-15px); opacity: 0.6; }
          75% { transform: translateY(-25px) translateX(8px); opacity: 0.7; }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0%); }
          100% { width: 0%; transform: translateX(100%); }
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @keyframes fade {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.3); opacity: 0.05; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .animate-float {
          animation: float 10s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }

        .animate-loading-bar {
          animation: loading-bar 2.5s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2.5s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-fade {
          animation: fade 3s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 4s ease-out infinite;
        }

        .border-l-3 { border-left-width: 3px; }
        .border-r-3 { border-right-width: 3px; }
        .border-t-3 { border-top-width: 3px; }
        .border-b-3 { border-bottom-width: 3px; }
      `}</style>
    </div>
  )
}

export default FullScreenLoader
