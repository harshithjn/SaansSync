"use client"

import { Activity, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface HeaderProps {
    currentPage?: string
}

export function Header({ currentPage = 'home' }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()

    const navItems = [
        { key: 'home', label: 'Home', href: '/' },
        { key: 'about', label: 'About', href: '/about' },
        { key: 'contact', label: 'Contact', href: '/contact' },
    ]

    const handleNavigation = (href: string) => {
        router.push(href)
        setMobileMenuOpen(false)
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="container mx-auto px-4 flex h-16 items-center justify-between relative">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                    <img
                        src="/logo.png"
                        alt="SaansSync Logo"
                        className="h-12 w-auto"
                        onError={(e) => {
                            // Fallback to text-based logo if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                                fallback.style.display = 'flex';
                            }
                        }}
                    />
                    <div className="hidden" style={{ display: 'none' }}>
                        <div className="flex items-center gap-2">
                            <Activity className="w-8 h-8 text-teal-500" />
                            <div>
                                <span className="text-xl font-bold text-gray-900">SaansSync</span>
                                <span className="hidden sm:block text-xs text-gray-500">Remote Respiratory Care</span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Desktop Navigation - Centered */}
                <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => handleNavigation(item.href)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === item.key
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Right section */}
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            Login
                        </Button>
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white animate-fade-in">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => handleNavigation(item.href)}
                                className={`px-4 py-3 rounded-lg text-left font-medium transition-all duration-200 ${currentPage === item.key
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="pt-2 border-t border-gray-200 mt-2">
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleNavigation('/login')}
                            >
                                Login
                            </Button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}