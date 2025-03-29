"use client";
import React from 'react'
import { ExpenseChart, UsageHeader, UsageActividad, ImageUse } from '@/components/Dashboard'
import { OrdersAnalytics } from '@/components/Dashboard/UsoSection/CostoPage/OrdersAnalytics'
import { ModalPageInCreation } from '@/components/ui'
import AuthStatus from '@/components/Authentication/AuthStatus'

export default function HomePage() {
  return (
    <main className="h-[calc(100vh-70px)] w-full">
      <div className="h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <div id="welcome-section" className="min-h-full w-full">
          <div className="space-y-6">
            <AuthStatus>
              <>
                <div className="mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Bienvenido a tu Dashboard</h1>
                  <p className="text-gray-500">
                    Administra tus chats, plantillas y accede a todas las funcionalidades.
                  </p>
                </div>
                <div id="usage-stats">
                  <OrdersAnalytics />
                </div>
              </>
            </AuthStatus>
          </div>
        </div>
      </div>
    </main>
  )
}
  