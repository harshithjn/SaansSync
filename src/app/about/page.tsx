"use client"

import { Header } from '@/components/common/Header'
import { Activity, Stethoscope, Users, Shield, Heart, Award, Target, Globe } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentPage="about" />

            <div className="container mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                        <Activity className="w-10 h-10 text-blue-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        About SaansSync
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Revolutionizing respiratory care through advanced remote monitoring and
                        AI-powered analytics for better patient outcomes.
                    </p>
                </div>

                {/* Mission Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                            SaansSync is dedicated to transforming respiratory healthcare by providing
                            cutting-edge remote monitoring solutions that bridge the gap between patients
                            and healthcare providers.
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            We empower patients with chronic lung diseases to take control of their health
                            while enabling doctors to provide continuous, data-driven care from anywhere.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <div className="grid grid-cols-2 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
                                <p className="text-gray-600">Patients Monitored</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-600 mb-2">25+</div>
                                <p className="text-gray-600">Specialist Doctors</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                                <p className="text-gray-600">Monitoring</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-red-600 mb-2">95%</div>
                                <p className="text-gray-600">Patient Satisfaction</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        What Makes Us Different
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                <Stethoscope className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Care</h3>
                            <p className="text-gray-600">
                                Specialized pulmonologists providing continuous oversight and personalized treatment plans.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <Activity className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Monitoring</h3>
                            <p className="text-gray-600">
                                Advanced sensors and AI algorithms for continuous health tracking and early intervention.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Platform</h3>
                            <p className="text-gray-600">
                                HIPAA-compliant security ensuring your health data is protected with enterprise-grade encryption.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        Our Expertise
                    </h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Pulmonology</h3>
                            <p className="text-sm text-gray-600">Specialized lung disease care</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Research</h3>
                            <p className="text-sm text-gray-600">Evidence-based treatments</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <Target className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Technology</h3>
                            <p className="text-sm text-gray-600">AI-powered analytics</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                <Globe className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
                            <p className="text-sm text-gray-600">Accessible healthcare</p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Care?</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of patients and healthcare providers who trust SaansSync
                        for comprehensive respiratory care management.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/patient/login"
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Patient Portal
                        </a>
                        <a
                            href="/login"
                            className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                        >
                            Doctor Portal
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}