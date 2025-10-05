'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    // Clear any localStorage data
    localStorage.clear()
    // Clear any sessionStorage data
    sessionStorage.clear()
    // Sign out and redirect
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  const handleContinue = () => {
    router.push('/select-repository')
  }

  const [isVisible, setIsVisible] = useState(false)
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([])
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; speed: number }>>([])

  useEffect(() => {
    setIsVisible(true)
    
    // Generate random stars
    const newStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3
    }))
    setStars(newStars)

    // Generate floating particles
    const newParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 20 + 10
    }))
    setParticles(newParticles)
  }, [])

  return (
    <main className="min-h-screen bg-[#0a0b1e] text-white overflow-hidden relative">
      {/* Animated Background with Stars and Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Large Floating Gradient Circles */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl animate-pulse"
          style={{
            top: '10%',
            left: '20%',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl animate-pulse"
          style={{
            top: '50%',
            right: '10%',
            animation: 'float 25s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-500/10 to-blue-500/10 blur-3xl animate-pulse"
          style={{
            bottom: '10%',
            left: '50%',
            animation: 'float 30s ease-in-out infinite'
          }}
        />

        {/* Twinkling Stars */}
        {stars.map((star, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.5)`
            }}
          />
        ))}

        {/* Floating Particles */}
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full bg-gradient-to-br from-green-400/30 to-blue-400/30 animate-floatParticle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.speed}s`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}

        {/* Orbiting Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[1, 2, 3, 4].map((ring) => (
            <div
              key={`ring-${ring}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 animate-spin"
              style={{
                width: `${ring * 200}px`,
                height: `${ring * 200}px`,
                animationDuration: `${ring * 15}s`,
                animationDirection: ring % 2 === 0 ? 'reverse' : 'normal'
              }}
            >
              {/* Orbiting dots */}
              {[...Array(ring * 2)].map((_, i) => (
                <div
                  key={`dot-${ring}-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-blue-400"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${(360 / (ring * 2)) * i}deg) translateX(${ring * 100}px)`,
                    boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #4ade80 1px, transparent 1px),
              linear-gradient(to bottom, #4ade80 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }} />
        </div>

        {/* Shooting Stars */}
        {[1, 2, 3].map((i) => (
          <div
            key={`shooting-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-shootingStar"
            style={{
              top: `${Math.random() * 50}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 5}s`,
              boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.8)'
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🍪</span>
              </div>
              <span className="text-xl font-bold text-white">Cookie-Licking Detector</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {status === 'authenticated' ? (
                <>
                  <Link href="/select-repository" className="text-gray-300 hover:text-white transition-colors">
                    Repositories
                  </Link>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 text-sm">Hi, {session?.user?.name}</span>
                    <img 
                      src={session?.user?.image || ''} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border-2 border-green-400/50"
                    />
                    <button 
                      onClick={handleLogout}
                      className="border border-red-400/50 text-red-400 px-4 py-2 rounded-lg hover:bg-red-400/10 transition-all text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => signIn('github', { 
                      callbackUrl: '/select-repository',
                      redirect: true 
                    })}
                    className="border border-green-400/50 text-green-400 px-6 py-2 rounded-lg hover:bg-green-400/10 transition-all"
                  >
                    Log in
                  </button>
                  <button 
                    onClick={() => signIn('github', { 
                      callbackUrl: '/select-repository',
                      redirect: true 
                    })}
                    className="bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
                  >
                    Get started for free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {status === 'authenticated' ? (
            // Authenticated User Welcome Section
            <div className="text-center mb-24">
              <div 
                className={`inline-block mb-8 transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <img 
                    src={session?.user?.image || ''} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full border-4 border-green-400/50"
                  />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">Welcome back!</p>
                    <p className="text-lg text-gray-400">{session?.user?.name}</p>
                  </div>
                </div>
              </div>
              
              <h1 
                className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-8 transition-all duration-1000 delay-200 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <span className="block mb-2">Ready to Monitor Your</span>
                <span className="block bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                  Open Source Projects?
                </span>
              </h1>
              
              <p 
                className={`text-xl md:text-2xl text-gray-400 mb-12 transition-all duration-1000 delay-400 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                Continue to your repository dashboard to start monitoring and managing issues
              </p>
              
              <div 
                className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <button 
                  onClick={handleContinue}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/50 transform hover:-translate-y-1 transition-all"
                >
                  Continue to Repositories
                </button>
                <Link 
                  href="/dashboard"
                  className="border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/5 transform hover:-translate-y-1 transition-all backdrop-blur-xl text-center"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          ) : (
            // Non-authenticated User Section
            <div className="text-center mb-24">
              <h1 
                className={`text-6xl md:text-7xl lg:text-8xl font-bold mb-8 transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <span className="block mb-2">AI-Powered Solution That</span>
                <span className="block bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Stops Cookie-Licking
                </span>
              </h1>
              <p 
                className={`text-xl md:text-2xl text-gray-400 mb-4 transition-all duration-1000 delay-300 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                Built native to <span className="text-green-400 font-semibold">GitHub</span>
              </p>
            </div>
          )}
        </div>

        {/* Feature Cards Grid - Only show for non-authenticated users */}
        {status !== 'authenticated' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Card 1 - Smart Detection */}
            <div 
              className={`group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 animate-bounce-slow ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
              }`}
              style={{ 
                transitionDelay: '400ms',
                animationDelay: '0s',
                animationDuration: '6s',
                animationTimingFunction: 'ease-in-out'
              }}
            >
              <h3 className="text-xl font-semibold mb-6">Smart Detection</h3>
              <div className="bg-gray-900/50 rounded-xl p-4 mb-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-600 rounded"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded"></div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium animate-pulse">
                    Active
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-gray-800/80 rounded-lg text-sm text-gray-400">
                    Pattern Scan
                  </div>
                  <div className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                    AI Analysis
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400">AI identifies claimed issues with no progress</p>
            </div>

            {/* Card 2 - Behavioral Analysis */}
            <div 
              className={`group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 animate-bounce-medium ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
              }`}
              style={{ 
                transitionDelay: '500ms',
                animationDelay: '1.5s',
                animationDuration: '6s',
                animationTimingFunction: 'ease-in-out'
              }}
            >
              <h3 className="text-xl font-semibold mb-6">Behavioral Analysis</h3>
              <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm text-gray-400">Contributor Score</span>
                  <span className="text-xs text-green-400 flex items-center">
                    <span className="mr-1">↗</span>
                    <span>+12%</span>
                  </span>
                </div>
                <div className="relative h-32">
                  {[30, 40, 50, 60, 75, 85, 95].map((height, i) => (
                    <div 
                      key={i}
                      className="absolute bottom-0 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t animate-grow"
                      style={{
                        left: `${i * 14}%`,
                        width: '10%',
                        height: `${height}%`,
                        animationDelay: `${i * 100}ms`,
                        opacity: 0.8 + (i * 0.02)
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-400">Predict contributor success probability</p>
            </div>

            {/* Card 3 - Intelligent Nudging */}
            <div 
              className={`group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 animate-bounce-fast ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
              }`}
              style={{ 
                transitionDelay: '600ms',
                animationDelay: '3s',
                animationDuration: '6s',
                animationTimingFunction: 'ease-in-out'
              }}
            >
              <h3 className="text-xl font-semibold mb-6">Intelligent Nudging</h3>
              <div className="bg-gray-900/50 rounded-xl p-4 mb-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-700" />
                      <circle 
                        cx="32" cy="32" r="28" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none" 
                        strokeDasharray="176"
                        strokeDashoffset="18"
                        className="text-blue-500 animate-dash"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">90% response rate</p>
                    <p className="text-xs text-gray-400">auto-categorized</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-700" />
                      <circle 
                        cx="32" cy="32" r="28" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none" 
                        strokeDasharray="176"
                        strokeDashoffset="35"
                        className="text-purple-500 animate-dash"
                        strokeLinecap="round"
                        style={{ animationDelay: '0.5s' }}
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">85% effectiveness</p>
                    <p className="text-xs text-gray-400">finalized</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400">Progressive notifications that work</p>
            </div>

            {/* Card 4 - Auto-Resolution */}
            <div 
              className={`group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 animate-bounce-slower ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
              }`}
              style={{ 
                transitionDelay: '700ms',
                animationDelay: '4.5s',
                animationDuration: '6s',
                animationTimingFunction: 'ease-in-out'
              }}
            >
              <h3 className="text-xl font-semibold mb-6">Auto-Resolution</h3>
              <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
                <div className="space-y-2">
                  {[
                    { amount: '$16,328', change: '+$500', positive: true },
                    { amount: '$14,069', change: '-$212', positive: false },
                    { amount: '$350', change: '+$50', positive: true },
                    { amount: '$129', change: '-$212', positive: false },
                    { amount: '$14', change: '+$212', positive: true },
                  ].map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between text-sm animate-slideIn"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <span className="text-white font-medium">{item.amount}</span>
                      <div className="flex-1 mx-3">
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.positive ? 'bg-green-500' : 'bg-orange-500'} rounded-full animate-widthGrow`}
                            style={{ 
                              width: `${50 + (i * 10)}%`,
                              animationDelay: `${i * 100}ms`
                            }}
                          />
                        </div>
                      </div>
                      <span className={`${item.positive ? 'text-green-400' : 'text-orange-400'} text-xs font-medium`}>
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-400">Auto-release with transparency</p>
            </div>
          </div>
        )}
      </section>

      {/* Additional Sections */}
      {status !== 'authenticated' && (
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-block bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Open Source Project?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of repositories using intelligent automation to stop cookie-licking
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => signIn('github', { 
                    callbackUrl: '/select-repository',
                    redirect: true 
                  })}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/50 transform hover:-translate-y-1 transition-all"
                >
                  Get started for free
                </button>
                <button className="border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/5 transform hover:-translate-y-1 transition-all backdrop-blur-xl">
                  Schedule a demo
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2024 Cookie-Licking Detector. Built with ❤️ for the open source community.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }
        
        @keyframes grow {
          from { height: 0; opacity: 0; }
          to { height: var(--height); opacity: 1; }
        }
        
        @keyframes dash {
          0% { stroke-dashoffset: 176; }
          100% { stroke-dashoffset: var(--offset); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes widthGrow {
          from { width: 0; }
          to { width: var(--width); }
        }
        
        .animate-grow {
          animation: grow 1s ease-out forwards;
        }
        
        .animate-dash {
          animation: dash 2s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-widthGrow {
          animation: widthGrow 1s ease-out forwards;
          width: 0;
        }
      `}</style>
    </main>
  )
}