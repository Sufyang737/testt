"use client";
import React from 'react'
import { ExpenseChart, UsageHeader, UsageActividad, ImageUse } from '@/components/Dashboard'
import { OrdersAnalytics } from '@/components/Dashboard/UsoSection/CostoPage/OrdersAnalytics'
import { ModalPageInCreation } from '@/components/ui'
import { useUser } from '@clerk/nextjs'

export default function ActividadPage() {
  const { user } = useUser();

  return (
    <main className="h-[calc(100vh-70px)] w-full bg-bgCoal">
      <div className="h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <div id="welcome-section" className="min-h-full w-full">
          <div className="space-y-6">
            {/* Content */}
            <div id="usage-stats">
              {user && <OrdersAnalytics />}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
  