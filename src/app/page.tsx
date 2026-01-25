"use client"

import Link from "next/link"
import { Activity, Stethoscope, Users, LineChart, Shield, Heart, Wind, Clock, UserCheck, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/common/Header'

const diseases = [
  { name: 'ILD', fullName: 'Interstitial Lung Disease', icon: Wind },
  { name: 'OAD', fullName: 'Obstructive Airway Disease', icon: Activity },
  { name: 'Bronchiectasis', fullName: 'Bronchiectasis', icon: Heart },
  { name: 'Post-ICU', fullName: 'Post ICU Recovery', icon: Shield },
]

const features = [
  {
    icon: Activity,
    title: 'Daily Monitoring',
    description: 'Track SpO₂, breathlessness, and symptoms from home',
  },
  {
    icon: LineChart,
    title: 'Health Trends',
    description: 'Visualize your progress over time with clear charts',
  },
  {
    icon: Stethoscope,
    title: 'Doctor Oversight',
    description: 'Your pulmonologist reviews your data regularly',
  },
  {
    icon: Shield,
    title: 'Early Alerts',
    description: 'Get notified when patterns suggest deterioration',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header currentPage="home" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.08),transparent_50%)]" />

        <div className="container mx-auto px-4 relative py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              <span>Advanced Pulmonology Care Platform</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              SaansSync
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              Remote Respiratory Care & Monitoring
            </p>

            <p className="text-lg text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
              Empowering patients with chronic lung diseases to monitor their health from home,
              with continuous support from pulmonology specialists and advanced analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg gap-3">
                  <Stethoscope className="w-5 h-5" />
                  Doctor Login
                </Button>
              </Link>

              <Link href="/patient/login">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg gap-3">
                  <Users className="w-5 h-5" />
                  Patient Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Diseases Supported */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Conditions We Monitor
            </h2>
            <p className="text-gray-600 text-lg">
              Specialized care for complex respiratory conditions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {diseases.map((disease) => (
              <div
                key={disease.name}
                className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <disease.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-900">{disease.name}</h3>
                <p className="text-sm text-gray-600">{disease.fullName}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How SaansSync Works
            </h2>
            <p className="text-gray-600 text-lg">
              Advanced monitoring and care coordination
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <feature.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center text-white">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">1,000+</div>
                <p className="text-blue-100 text-lg">Patients Monitored</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">25+</div>
                <p className="text-blue-100 text-lg">Specialist Doctors</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                <p className="text-blue-100 text-lg">Alert Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Complete Care Platform
              </h2>
              <p className="text-gray-600 text-lg">
                Everything you need for comprehensive respiratory care
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      Patient Management
                    </h3>
                    <p className="text-gray-600">
                      Comprehensive patient profiles with structured diagnosis, medication tracking, and PFT monitoring
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      Clinical Analytics
                    </h3>
                    <p className="text-gray-600">
                      Advanced analytics for treatment optimization and outcome prediction
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      Real-time Monitoring
                    </h3>
                    <p className="text-gray-600">
                      Continuous health monitoring with intelligent alerts and notifications
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="text-center">
                  <Heart className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Your Health, Our Priority
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Join thousands of patients who are taking control of their lung health
                    with the support of specialist care teams.
                  </p>
                  <Link href="/patient/login">
                    <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3">
                      Get Started Today
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">SaansSync</h3>
            <p className="text-gray-400 mb-6">
              Advanced respiratory care platform for better patient outcomes
            </p>
            <div className="flex justify-center gap-6">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Doctor Portal
              </Link>
              <Link href="/patient/login" className="text-gray-400 hover:text-white transition-colors">
                Patient Portal
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
              © 2024 SaansSync. Advanced Pulmonology Care Platform.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
