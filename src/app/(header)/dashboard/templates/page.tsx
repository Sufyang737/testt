"use client";
import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useUser } from '@clerk/nextjs';
import PocketBase from 'pocketbase';

interface Template {
  id: string;
  client_id: string;
  template: string;
  name_template: string;
  tags: string;
  variables: string;
  created: string;
  updated: string;
  is_prebuilt?: boolean;
}

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

const DEFAULT_VARIABLES = [
  '{{user.name}}',
  '{{user.company}}',
  '{{user.phone}}',
  '{{date}}',
  '{{time}}',
  '{{product.name}}',
  '{{product.price}}',
  '{{product.description}}',
  '{{product.url}}',
  '{{company.website}}',
  '{{company.address}}',
  '{{payment.total}}',
  '{{payment.currency}}',
  '{{order.id}}',
  '{{order.status}}'
];

const PREBUILT_TEMPLATES = [
  {
    name_template: 'Saludo Inicial',
    template: 'Hola {{user.name}}, bienvenido a nuestro servicio. ¿En qué podemos ayudarte hoy?',
    tags: 'saludo,bienvenida',
    variables: DEFAULT_VARIABLES.join(', ')
  },
  {
    name_template: 'Seguimiento',
    template: 'Hola {{user.name}}, ¿cómo va todo con el servicio? Estamos aquí para ayudarte si necesitas algo.',
    tags: 'seguimiento,soporte',
    variables: DEFAULT_VARIABLES.join(', ')
  },
  {
    name_template: 'Información de Producto',
    template: 'El producto {{product.name}} tiene un precio de {{product.price}}. Puedes encontrar más información en {{product.url}}. ¿Te gustaría saber más detalles?',
    tags: 'producto,información,ventas',
    variables: DEFAULT_VARIABLES.join(', ')
  },
  {
    name_template: 'Confirmación de Orden',
    template: 'Tu orden #{{order.id}} por {{payment.total}} {{payment.currency}} ha sido confirmada. Estado actual: {{order.status}}. Gracias por tu compra.',
    tags: 'orden,confirmación,compra',
    variables: DEFAULT_VARIABLES.join(', ')
  }
];

const VARIABLE_EXAMPLES = [
  {
    variable: '{{user.name}}',
    description: 'Nombre del cliente',
    example: 'Juan Pérez'
  },
  {
    variable: '{{user.company}}',
    description: 'Nombre de la empresa del cliente',
    example: 'Acme Inc.'
  },
  {
    variable: '{{user.phone}}',
    description: 'Teléfono del cliente',
    example: '+1234567890'
  },
  {
    variable: '{{date}}',
    description: 'Fecha actual',
    example: '25/04/2024'
  },
  {
    variable: '{{time}}',
    description: 'Hora actual',
    example: '14:30'
  },
  {
    variable: '{{product.name}}',
    description: 'Nombre del producto',
    example: 'Smartphone XYZ Pro'
  },
  {
    variable: '{{product.price}}',
    description: 'Precio del producto',
    example: '$999.99'
  },
  {
    variable: '{{product.description}}',
    description: 'Descripción del producto',
    example: 'Smartphone de última generación con 256GB'
  },
  {
    variable: '{{product.url}}',
    description: 'URL del producto',
    example: 'https://tienda.com/productos/xyz-pro'
  },
  {
    variable: '{{company.website}}',
    description: 'Sitio web de la empresa',
    example: 'www.miempresa.com'
  },
  {
    variable: '{{company.address}}',
    description: 'Dirección de la empresa',
    example: 'Calle Principal 123, Ciudad'
  },
  {
    variable: '{{payment.total}}',
    description: 'Monto total del pago',
    example: '1499.99'
  },
  {
    variable: '{{payment.currency}}',
    description: 'Moneda del pago',
    example: 'USD'
  },
  {
    variable: '{{order.id}}',
    description: 'Número de orden',
    example: 'ORD-2024-001'
  },
  {
    variable: '{{order.status}}',
    description: 'Estado de la orden',
    example: 'Confirmado'
  }
];

export default function TemplatesPage() {
  const { user } = useUser();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pb] = useState(() => new PocketBase(POCKETBASE_URL));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState<'prebuilt' | 'custom'>('prebuilt');
  const [variableTab, setVariableTab] = useState<'client' | 'product'>('client');
  const [formData, setFormData] = useState({
    name_template: '',
    template: '',
    tags: '',
    variables: DEFAULT_VARIABLES.join(', ')
  });

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      const records = await pb.collection('templates_chats').getFullList<Template>({
        filter: `client_id = "${clientRecord.id}"`,
        sort: '-created'
      });

      setTemplates(records);
      setError(null);
    } catch (err) {
      console.error('Error al cargar templates:', err);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      const data = {
        ...formData,
        client_id: clientRecord.id
      };

      if (currentTemplate) {
        await pb.collection('templates_chats').update(currentTemplate.id, data);
      } else {
        await pb.collection('templates_chats').create(data);
      }

      setIsModalOpen(false);
      setCurrentTemplate(null);
      setFormData({
        name_template: '',
        template: '',
        tags: '',
        variables: DEFAULT_VARIABLES.join(', ')
      });
      fetchTemplates();
    } catch (err) {
      console.error('Error al guardar template:', err);
      setError('Error al guardar el template');
    }
  };

  const handleEdit = (template: Template) => {
    setCurrentTemplate(template);
    setFormData({
      name_template: template.name_template,
      template: template.template,
      tags: template.tags,
      variables: template.variables
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este template?')) return;

    try {
      await pb.collection('templates_chats').delete(id);
      fetchTemplates();
    } catch (err) {
      console.error('Error al eliminar template:', err);
      setError('Error al eliminar el template');
    }
  };

  const handleUsePrebuilt = async (prebuilt: typeof PREBUILT_TEMPLATES[0]) => {
    if (!user) return;

    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      const data = {
        ...prebuilt,
        client_id: clientRecord.id,
        is_prebuilt: true
      };

      await pb.collection('templates_chats').create(data);
      fetchTemplates();
      setActiveTab('custom');
    } catch (err) {
      console.error('Error al usar template pre-armado:', err);
      setError('Error al usar el template');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 w-full flex items-center justify-center">
        <div className="text-gray-700">Cargando templates...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
                <p className="text-gray-500 text-sm mt-1">Crea y gestiona tus plantillas de mensajes predefinidos</p>
              </div>
              
              {/* Tabs */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('prebuilt')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'prebuilt'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Templates Pre-armados
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'custom'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Mis Templates
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="m-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Contenido principal */}
          <div className="p-6">
            {activeTab === 'prebuilt' ? (
              // Templates pre-armados
              <div className="grid gap-4 md:grid-cols-2">
                {PREBUILT_TEMPLATES.map((template, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-gray-800 font-medium text-lg">{template.name_template}</h3>
                      <button
                        onClick={() => handleUsePrebuilt(template)}
                        className="text-gray-500 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-100"
                        title="Usar template"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 flex-grow">{template.template}</p>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {template.tags.split(',').map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Templates personalizados
              <div>
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => {
                      setCurrentTemplate(null);
                      setFormData({
                        name_template: '',
                        template: '',
                        tags: '',
                        variables: DEFAULT_VARIABLES.join(', ')
                      });
                      setIsModalOpen(true);
                    }}
                    className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Nuevo Template</span>
                  </button>
                </div>

                {templates.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 mt-4">No tienes templates personalizados</p>
                    <button
                      onClick={() => setActiveTab('prebuilt')}
                      className="mt-2 text-primary hover:text-primary-hover text-sm"
                    >
                      Ver templates pre-armados
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-gray-800 font-medium text-lg flex items-center gap-2">
                            {template.name_template}
                            {template.is_prebuilt && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                Pre-armado
                              </span>
                            )}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(template)}
                              className="text-gray-500 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-100"
                              title="Editar template"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-gray-100"
                              title="Eliminar template"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-1 flex-grow">{template.template}</p>
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                          {template.tags.split(',').map((tag, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición/creación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-xl mx-auto my-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row h-full">
              {/* Formulario principal */}
              <div className="flex-1 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {currentTemplate ? 'Editar Template' : 'Nuevo Template'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2" htmlFor="name">
                      Nombre*
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name_template}
                      onChange={(e) => setFormData({ ...formData, name_template: e.target.value })}
                      className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      placeholder="Ej: Saludo inicial"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2" htmlFor="template">
                      Mensaje*
                    </label>
                    <textarea
                      id="template"
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      required
                      placeholder="Escribe tu mensaje aquí usando las variables disponibles..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2" htmlFor="tags">
                      Etiquetas (separadas por comas)
                    </label>
                    <input
                      id="tags"
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ej: saludo, bienvenida"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-center space-x-4 w-full">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-1/2 py-3.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-3.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-base flex items-center justify-center"
                    >
                      {currentTemplate ? 'Guardar Cambios' : 'Crear Template'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sidebar con información de variables */}
              <div className="w-80 p-6 border-l border-gray-200">
                <h3 className="text-base font-medium text-gray-700 mb-4">Variables Disponibles</h3>
                
                {/* Tabs para categorías de variables */}
                <div className="flex space-x-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setVariableTab('client')}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors flex-1 ${
                      variableTab === 'client'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariableTab('product')}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors flex-1 ${
                      variableTab === 'product'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Producto
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {VARIABLE_EXAMPLES.filter(item => {
                    if (variableTab === 'client') {
                      return item.variable.startsWith('{{user') || 
                             item.variable.startsWith('{{company') ||
                             item.variable === '{{date}}' ||
                             item.variable === '{{time}}';
                    } else {
                      return item.variable.startsWith('{{product') || 
                             item.variable.startsWith('{{payment') ||
                             item.variable.startsWith('{{order');
                    }
                  }).map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-all">
                      <div className="flex items-center justify-between">
                        <code className="text-gray-700 font-bold bg-white px-2 py-1 rounded text-sm border border-gray-200">
                          {item.variable}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.variable);
                            const textarea = document.getElementById('template') as HTMLTextAreaElement;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const text = textarea.value;
                              textarea.value = text.substring(0, start) + item.variable + text.substring(end);
                              textarea.focus();
                              textarea.setSelectionRange(start + item.variable.length, start + item.variable.length);
                            }
                          }}
                          className="text-primary hover:text-primary-hover text-sm"
                        >
                          Insertar
                        </button>
                      </div>
                      <p className="text-gray-700 text-sm mt-1">
                        {item.description}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Ejemplo: {item.example}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-gray-700 font-medium mb-2 text-sm">Ejemplo de uso</h4>
                  <p className="text-gray-600 text-sm">
                    {variableTab === 'client' ? (
                      <>Hola <span className="text-primary font-semibold">{'{{user.name}}'}</span>, gracias por contactar a <span className="text-primary font-semibold">{'{{user.company}}'}</span>. Te responderemos lo antes posible.</>
                    ) : (
                      <>El producto <span className="text-primary font-semibold">{'{{product.name}}'}</span> tiene un precio de <span className="text-primary font-semibold">{'{{product.price}}'}</span>. Tu orden #<span className="text-primary font-semibold">{'{{order.id}}'}</span> está en proceso.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 