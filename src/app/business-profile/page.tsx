"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { FiInstagram, FiFacebook, FiGlobe, FiTwitter, FiClock, FiSave } from 'react-icons/fi';
import { BsBuilding } from 'react-icons/bs';
import { MdDescription } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import IsLogged from '@/components/Authentication/isLogged';

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

export default function BusinessProfile() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [formData, setFormData] = useState({
    name_company: '',
    description: '',
    instagram: '',
    facebook: '',
    website: '',
    x: '',
    schedule: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      saturday: { isOpen: false, openTime: '09:00', closeTime: '13:00' },
      sunday: { isOpen: false, openTime: '00:00', closeTime: '00:00' }
    } as WeekSchedule
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleChange = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const getDayLabel = (day: string): string => {
    const labels: { [key: string]: string } = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return labels[day];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setIsRedirecting(false);

    try {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          client_id: user.id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el perfil');
      }

      setSuccess(true);
      setIsRedirecting(true);
      
      // Mostrar mensaje de éxito y modal de redirección antes de redirigir
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IsLogged>
      <div className="min-h-screen bg-[#111b21] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#202c33] rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Perfil de Negocio
              </h1>
              <p className="text-gray-400">
                Completa la información de tu negocio para personalizar tu experiencia
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre de la empresa */}
              <div>
                <label className="flex items-center text-white mb-2">
                  <BsBuilding className="w-5 h-5 mr-2" />
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  name="name_company"
                  value={formData.name_company}
                  onChange={handleChange}
                  className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Tu empresa"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="flex items-center text-white mb-2">
                  <MdDescription className="w-5 h-5 mr-2" />
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Describe tu negocio..."
                />
              </div>

              {/* Redes Sociales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-white mb-2">
                    <FiInstagram className="w-5 h-5 mr-2" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://instagram.com/tu-perfil"
                  />
                </div>

                <div>
                  <label className="flex items-center text-white mb-2">
                    <FiFacebook className="w-5 h-5 mr-2" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://facebook.com/tu-pagina"
                  />
                </div>

                <div>
                  <label className="flex items-center text-white mb-2">
                    <FiGlobe className="w-5 h-5 mr-2" />
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://tu-sitio.com"
                  />
                </div>

                <div>
                  <label className="flex items-center text-white mb-2">
                    <FiTwitter className="w-5 h-5 mr-2" />
                    X (Twitter)
                  </label>
                  <input
                    type="url"
                    name="x"
                    value={formData.x}
                    onChange={handleChange}
                    className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://x.com/tu-perfil"
                  />
                </div>
              </div>

              {/* Horario */}
              <div className="space-y-4">
                <label className="flex items-center text-white mb-4">
                  <FiClock className="w-5 h-5 mr-2" />
                  Horario de Atención
                </label>
                
                <div className="grid gap-4">
                  {Object.entries(formData.schedule).map(([day, schedule]) => (
                    <div key={day} className="bg-[#2a3942] p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">{getDayLabel(day)}</span>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={schedule.isOpen}
                            onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          <span className="ml-3 text-sm font-medium text-gray-300">
                            {schedule.isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                        </label>
                      </div>
                      
                      {schedule.isOpen && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-300 text-sm mb-1">Apertura</label>
                            <input
                              type="time"
                              value={schedule.openTime}
                              onChange={(e) => handleScheduleChange(day, 'openTime', e.target.value)}
                              className="w-full bg-[#374650] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-300 text-sm mb-1">Cierre</label>
                            <input
                              type="time"
                              value={schedule.closeTime}
                              onChange={(e) => handleScheduleChange(day, 'closeTime', e.target.value)}
                              className="w-full bg-[#374650] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium transition-all
                    ${loading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-prinFuchsia hover:bg-prinFuchsia/90 hover:shadow-lg'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Guardar Perfil
                    </>
                  )}
                </button>
              </div>
            </form>

            {success && (
              <div className="mt-6 p-4 bg-green-500/20 text-green-400 rounded-lg">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Perfil guardado correctamente
                </p>
                {isRedirecting && (
                  <p className="text-sm mt-1">Redirigiendo al dashboard...</p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 text-red-400 rounded-lg">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </IsLogged>
  );
} 