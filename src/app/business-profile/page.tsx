"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { FiInstagram, FiFacebook, FiGlobe, FiTwitter, FiClock, FiSave, FiCheckCircle, FiAlertCircle, FiHelpCircle, FiInfo } from 'react-icons/fi';
import { BsBuilding, BsArrowRight } from 'react-icons/bs';
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
  const [activeStep, setActiveStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

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

  useEffect(() => {
    // Recuperar datos si la sesión se refrescó
    const savedData = localStorage.getItem('business_profile_draft');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (e) {
        console.error('Error parsing saved form data');
      }
    }
  }, []);

  // Guardar automáticamente el borrador
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('business_profile_draft', JSON.stringify(formData));
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Eliminar error de validación cuando el usuario corrige
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
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

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.name_company.trim()) {
      errors.name_company = 'El nombre de la empresa es obligatorio';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    }

    // Validar URLs
    const urlFields = ['instagram', 'facebook', 'website', 'x'];
    urlFields.forEach(field => {
      if (formData[field as keyof typeof formData] && !isValidUrl(formData[field as keyof typeof formData] as string)) {
        errors[field] = 'Introduce una URL válida';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // URLs son opcionales
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleNextStep = () => {
    if (activeStep === 1 && validateFirstStep()) {
      setActiveStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeStep === 2 && validateSecondStep()) {
      setActiveStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateFirstStep = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name_company.trim()) {
      errors.name_company = 'El nombre de la empresa es obligatorio';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSecondStep = () => {
    const errors: {[key: string]: string} = {};

    // Validar URLs
    const urlFields = ['instagram', 'facebook', 'website', 'x'];
    urlFields.forEach(field => {
      if (formData[field as keyof typeof formData] && !isValidUrl(formData[field as keyof typeof formData] as string)) {
        errors[field] = 'Introduce una URL válida';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!validateForm()) {
      return;
    }

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

      // Limpiar el borrador guardado
      localStorage.removeItem('business_profile_draft');
      
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

  // Renderizar el indicador de progreso
  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center relative mb-2">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-gray-200 w-full" />
        
        {[1, 2, 3].map((step) => (
          <div key={step} className="relative z-10 flex flex-col items-center">
            <div 
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
                ${activeStep >= step 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-400'}`}
            >
              {step}
            </div>
            <span className={`text-sm mt-2 ${activeStep >= step ? 'text-primary font-medium' : 'text-gray-500'}`}>
              {step === 1 ? 'Información básica' : step === 2 ? 'Redes sociales' : 'Horarios'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTooltip = (id: string, content: string) => (
    <div className="group relative">
      <button 
        type="button"
        onClick={() => setShowTooltip(showTooltip === id ? null : id)}
        className="text-gray-400 hover:text-gray-300 focus:outline-none"
      >
        <FiHelpCircle className="w-4 h-4" />
      </button>
      {showTooltip === id && (
        <div className="absolute left-0 bottom-full mb-2 w-60 p-3 bg-gray-800 text-gray-300 text-xs rounded-md shadow-lg z-10">
          {content}
          <div className="absolute left-0 bottom-0 transform translate-y-full w-2 h-2 rotate-45 bg-gray-800" />
        </div>
      )}
    </div>
  );

  return (
    <IsLogged>
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Perfil de Negocio
              </h1>
              <p className="text-gray-600">
                Completa la información de tu negocio para personalizar tu experiencia
              </p>
            </div>

            {renderProgressBar()}

            {/* Modal de éxito con colores corporativos */}
            {success && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full animate-scale-in">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
                      <FiCheckCircle className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Perfil Guardado!</h2>
                    <p className="text-gray-600 mb-6">
                      Tu perfil de negocio ha sido guardado correctamente.
                    </p>
                    <div className="flex items-center justify-center">
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full animate-progress"></div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-4">
                      Serás redirigido al dashboard en unos segundos...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Paso 1: Información básica */}
              {activeStep === 1 && (
                <div className="transition-all duration-300 animate-fade-in">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-sm">1</span>
                      Información básica
                    </h2>
                  
                    {/* Nombre de la empresa */}
                    <div className="mb-6">
                      <label className="flex items-center text-gray-700 mb-2 font-medium">
                        <BsBuilding className="w-5 h-5 mr-2 text-primary" />
                        Nombre de la Empresa
                        <span className="text-red-500 ml-1">*</span>
                        <div className="ml-2">
                          {renderTooltip("name_help", "Ingresa el nombre oficial de tu empresa como aparece en documentos legales.")}
                        </div>
                      </label>
                      <input
                        type="text"
                        name="name_company"
                        value={formData.name_company}
                        onChange={handleChange}
                        className={`w-full bg-white text-gray-800 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all
                          ${validationErrors.name_company ? 'border-2 border-red-500' : 'border-gray-300'}`}
                        placeholder="Tu empresa"
                      />
                      {validationErrors.name_company && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <FiAlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.name_company}
                        </p>
                      )}
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="flex items-center text-gray-700 mb-2 font-medium">
                        <MdDescription className="w-5 h-5 mr-2 text-primary" />
                        Descripción
                        <span className="text-red-500 ml-1">*</span>
                        <div className="ml-2">
                          {renderTooltip("desc_help", "Describe brevemente a qué se dedica tu empresa y qué productos o servicios ofrece.")}
                        </div>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className={`w-full bg-white text-gray-800 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all
                          ${validationErrors.description ? 'border-2 border-red-500' : 'border-gray-300'}`}
                        placeholder="Describe tu negocio..."
                      />
                      {validationErrors.description && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <FiAlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg"
                    >
                      Siguiente
                      <BsArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Redes Sociales */}
              {activeStep === 2 && (
                <div className="transition-all duration-300 animate-fade-in">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-sm">2</span>
                      Redes Sociales y Web
                    </h2>
                    <p className="text-gray-600 mb-6 text-sm">
                      Estos campos son opcionales, pero recomendamos completarlos para mejorar la presencia de tu negocio
                    </p>
                  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center text-gray-700 mb-2 font-medium">
                          <FiInstagram className="w-5 h-5 mr-2 text-primary" />
                          Instagram
                          <div className="ml-2">
                            {renderTooltip("ig_help", "Agrega la URL completa de tu perfil de Instagram (ej. https://instagram.com/tunegocio)")}
                          </div>
                        </label>
                        <input
                          type="url"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          className={`w-full bg-white text-gray-800 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all
                            ${validationErrors.instagram ? 'border-2 border-red-500' : 'border-gray-300'}`}
                          placeholder="https://instagram.com/tu-perfil"
                        />
                        {validationErrors.instagram && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <FiAlertCircle className="w-4 h-4 mr-1" />
                            {validationErrors.instagram}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center text-gray-700 mb-2 font-medium">
                          <FiFacebook className="w-5 h-5 mr-2 text-primary" />
                          Facebook
                          <div className="ml-2">
                            {renderTooltip("fb_help", "Agrega la URL completa de tu página de Facebook (ej. https://facebook.com/tunegocio)")}
                          </div>
                        </label>
                        <input
                          type="url"
                          name="facebook"
                          value={formData.facebook}
                          onChange={handleChange}
                          className={`w-full bg-white text-gray-800 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all
                            ${validationErrors.facebook ? 'border-2 border-red-500' : 'border-gray-300'}`}
                          placeholder="https://facebook.com/tu-pagina"
                        />
                        {validationErrors.facebook && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <FiAlertCircle className="w-4 h-4 mr-1" />
                            {validationErrors.facebook}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center text-gray-700 mb-2 font-medium">
                          <FiGlobe className="w-5 h-5 mr-2 text-primary" />
                          Sitio Web
                          <div className="ml-2">
                            {renderTooltip("web_help", "Agrega la URL completa de tu sitio web (ej. https://tuempresa.com)")}
                          </div>
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className={`w-full bg-white text-gray-800 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all
                            ${validationErrors.website ? 'border-2 border-red-500' : 'border-gray-300'}`}
                          placeholder="https://tu-sitio.com"
                        />
                        {validationErrors.website && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <FiAlertCircle className="w-4 h-4 mr-1" />
                            {validationErrors.website}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center text-gray-700 mb-2 font-medium">
                          <FiTwitter className="w-5 h-5 mr-2 text-primary" />
                          X (Twitter)
                          <div className="ml-2">
                            {renderTooltip("x_help", "Agrega la URL completa de tu perfil en X/Twitter (ej. https://x.com/tunegocio)")}
                          </div>
                        </label>
                        <input
                          type="url"
                          name="x"
                          value={formData.x}
                          onChange={handleChange}
                          className={`w-full bg-white text-gray-800 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary transition-all
                            ${validationErrors.x ? 'border-2 border-red-500' : 'border-gray-300'}`}
                          placeholder="https://x.com/tu-perfil"
                        />
                        {validationErrors.x && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <FiAlertCircle className="w-4 h-4 mr-1" />
                            {validationErrors.x}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg"
                    >
                      Siguiente
                      <BsArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Horario */}
              {activeStep === 3 && (
                <div className="transition-all duration-300 animate-fade-in">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-sm">3</span>
                      Horario de Atención
                    </h2>
                    <p className="text-gray-600 mb-6 text-sm flex items-start">
                      <FiInfo className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-primary" />
                      Configura los horarios en que tu negocio está disponible para atender a tus clientes. Esta información se mostrará a los usuarios.
                    </p>
                    
                    <div className="space-y-4">
                      {Object.entries(formData.schedule).map(([day, schedule]) => (
                        <div key={day} className="bg-white p-4 rounded-lg border border-gray-200 transition-all hover:border-primary/50 hover:shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-800 font-medium">{getDayLabel(day)}</span>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={schedule.isOpen}
                                onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              <span className="ml-3 text-sm font-medium text-gray-700">
                                {schedule.isOpen ? 'Abierto' : 'Cerrado'}
                              </span>
                            </label>
                          </div>
                          
                          {schedule.isOpen && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-gray-600 text-sm mb-1">Hora de apertura</label>
                                <input
                                  type="time"
                                  value={schedule.openTime}
                                  onChange={(e) => handleScheduleChange(day, 'openTime', e.target.value)}
                                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-600 text-sm mb-1">Hora de cierre</label>
                                <input
                                  type="time"
                                  value={schedule.closeTime}
                                  onChange={(e) => handleScheduleChange(day, 'closeTime', e.target.value)}
                                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
                      <FiAlertCircle className="w-5 h-5 mr-2" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex items-center justify-center font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg
                        ${loading
                          ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                          : 'bg-primary hover:bg-primary-hover text-white'
                        }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FiSave className="mr-2" />
                          Guardar perfil
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </IsLogged>
  );
} 