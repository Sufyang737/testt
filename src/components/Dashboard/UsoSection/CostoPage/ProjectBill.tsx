"use client"
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { ApiKeyTokenUsage } from './ApiKeyTokenUsage';

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-700 rounded-lg w-3/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
      </div>
      <div className="pt-4 space-y-3">
        <div className="h-24 bg-gray-700 rounded"></div>
        <div className="h-24 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};

export const ProjectBill = () => {
  const { user, isLoaded } = useUser();

  return (
    <div className="w-full bg-bgCoal">
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Consumo</h2>
          <p className="text-gray-400 text-sm">Monitoreo y análisis del uso de recursos</p>
        </div>
        
        <div className="w-full">
          {!isLoaded ? (
            <SkeletonLoader />
          ) : (
            user && (
              <div className="flex flex-col gap-4">
                <div className="bg-[#1a1d24] rounded-lg p-4 border border-gray-800/50">
                  <div className="mb-4">
                    <h3 className="text-base font-medium text-gray-200 mb-1">Uso de Tokens</h3>
                    <p className="text-sm text-gray-400">Monitoreo de consumo de recursos</p>
                  </div>
                  <ApiKeyTokenUsage clientId={user.id} />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};