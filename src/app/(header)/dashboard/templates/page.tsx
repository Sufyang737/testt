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
      <div className="h-[calc(100vh-70px)] w-full bg-bgCoal flex items-center justify-center">
        <div className="text-white">Cargando templates...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-70px)] w-full bg-bgCoal p-6">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('prebuilt')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'prebuilt'
                ? 'bg-prinFuchsia text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Templates Pre-armados
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'custom'
                ? 'bg-prinFuchsia text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Mis Templates
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Contenido principal */}
        <div className="space-y-4">
          {activeTab === 'prebuilt' ? (
            // Templates pre-armados
            <div className="space-y-4">
              {PREBUILT_TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-4 flex justify-between items-start hover:border hover:border-gray-700"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{template.name_template}</h3>
                    <p className="text-gray-400 text-sm mt-1">{template.template}</p>
                    <div className="flex gap-2 mt-2">
                      {template.tags.split(',').map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUsePrebuilt(template)}
                    className="ml-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                    title="Usar template"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Templates personalizados
            <div>
              <div className="flex justify-end mb-4">
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
                  className="flex items-center px-4 py-2 bg-prinFuchsia text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Nuevo Template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <p className="text-gray-400">No tienes templates personalizados</p>
                  <button
                    onClick={() => setActiveTab('prebuilt')}
                    className="mt-4 text-prinFuchsia hover:text-prinFuchsia/80 transition-colors"
                  >
                    Ver templates pre-armados
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-gray-800 rounded-lg p-4 flex justify-between items-start hover:border hover:border-gray-700"
                    >
                      <div className="flex-1">
                        <h3 className="text-white font-medium flex items-center gap-2">
                          {template.name_template}
                          {template.is_prebuilt && (
                            <span className="text-xs bg-prinFuchsia/20 text-prinFuchsia px-2 py-1 rounded">
                              Pre-armado
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">{template.template}</p>
                        <div className="flex gap-2 mt-2">
                          {template.tags.split(',').map((tag, i) => (
                            <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-700 rounded-lg"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de edición/creación */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-5xl flex">
              {/* Formulario principal */}
              <div className="flex-1 p-6 border-r border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">
                  {currentTemplate ? 'Editar Template' : 'Nuevo Template'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="name">
                      Nombre
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name_template}
                      onChange={(e) => setFormData({ ...formData, name_template: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-prinFuchsia"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="template">
                      Mensaje
                    </label>
                    <textarea
                      id="template"
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 h-40 focus:outline-none focus:ring-2 focus:ring-prinFuchsia"
                      required
                      placeholder="Escribe tu mensaje aquí usando las variables disponibles..."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="tags">
                      Etiquetas (separadas por comas)
                    </label>
                    <input
                      id="tags"
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-prinFuchsia"
                      placeholder="ejemplo: saludo, bienvenida"
                    />
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-prinFuchsia text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      {currentTemplate ? 'Guardar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sidebar con información de variables */}
              <div className="w-80 p-6 bg-gray-900 rounded-r-lg">
                <h3 className="text-lg font-medium text-white mb-4">Variables Disponibles</h3>
                
                {/* Tabs para categorías de variables */}
                <div className="flex space-x-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setVariableTab('client')}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors flex-1 ${
                      variableTab === 'client'
                        ? 'bg-prinFuchsia text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariableTab('product')}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors flex-1 ${
                      variableTab === 'product'
                        ? 'bg-prinFuchsia text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Producto
                  </button>
                </div>

                <div className="space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto">
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
                    <div key={index} className="space-y-2 bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <code className="text-white font-bold bg-gray-800 px-2 py-1 rounded text-sm">
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
                          className="text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors"
                        >
                          <span>Insertar</span>
                        </button>
                      </div>
                      <p className="text-white text-sm">
                        {item.description}
                      </p>
                      <p className="text-white/70 text-sm italic">
                        Ejemplo: {item.example}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Ejemplo de uso</h4>
                  <p className="text-white/70 text-sm">
                    {variableTab === 'client' ? (
                      <>Hola <span className="text-white font-bold">{'{{user.name}}'}</span>, gracias por contactar a <span className="text-white font-bold">{'{{user.company}}'}</span>. Te responderemos lo antes posible.</>
                    ) : (
                      <>El producto <span className="text-white font-bold">{'{{product.name}}'}</span> tiene un precio de <span className="text-white font-bold">{'{{product.price}}'}</span>. Tu orden #<span className="text-white font-bold">{'{{order.id}}'}</span> está en proceso.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 