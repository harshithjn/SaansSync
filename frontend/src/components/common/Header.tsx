"use client"

import { Menu, X, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth as useGlobalAuth } from '@/components/auth/AuthProvider'

interface HeaderProps {
    currentPage?: string
}

export function Header({ currentPage = 'home' }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const { user, logout } = useGlobalAuth()

    const navItems = [
        { key: 'home', label: 'Home', href: '/' },
        { key: 'about', label: 'About', href: '/about' },
        { key: 'contact', label: 'Contact', href: '/contact' },
    ]

    const handleNavigation = (href: string) => {
        router.push(href)
        setMobileMenuOpen(false)
    }

    const isActive = (href: string) => {
        if (href === '/' && pathname === '/') return true
        if (href !== '/' && pathname?.startsWith(href)) return true
        return false
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-50 bg-white/70 backdrop-blur-xl">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between relative">
                {}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center transition-all group-hover:shadow-lg group-hover:scale-105 duration-500 overflow-hidden">
                        <img src="/favicon.ico" alt="SaansSync Logo" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold text-slate-900 tracking-tight leading-none">SaansSync</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Smart Respiratory Care</span>
                    </div>
                </Link>

                {}
                <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2 bg-slate-50/50 p-1 rounded-xl border border-slate-100/50">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => handleNavigation(item.href)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive(item.href)
                                ? 'bg-white text-teal-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                    {user.email?.split('@')[0]}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={logout}
                                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg px-3 h-8"
                            >
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/sign-in">
                                <Button variant="ghost" size="sm" className="hidden sm:flex text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 rounded-lg px-3 h-9">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/sign-up">
                                <Button className="hidden sm:flex bg-teal-600 text-white hover:bg-teal-700 text-[9px] font-bold uppercase tracking-widest rounded-lg px-4 h-9 shadow-md shadow-teal-100 transition-all active:scale-95">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    )}

                    {}
                    <button
                        className="md:hidden w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 transition-all active:scale-95 border border-slate-100"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <nav className="container mx-auto px-8 py-8 flex flex-col gap-3">
                        {navItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => handleNavigation(item.href)}
                                className={`px-6 py-5 rounded-2xl text-left text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive(item.href)
                                    ? 'bg-slate-950 text-white'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="pt-6 border-t border-slate-50 mt-4 flex flex-col gap-4">
                            {user ? (
                                <Button
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest text-rose-600"
                                    onClick={logout}
                                >
                                    Terminate Session
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="w-full h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500"
                                        onClick={() => handleNavigation('/sign-in')}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        className="w-full h-12 rounded-xl bg-teal-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-teal-100"
                                        onClick={() => handleNavigation('/sign-up')}
                                    >
                                        Sign Up
                                    </Button>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}