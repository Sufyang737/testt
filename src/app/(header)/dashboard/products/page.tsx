"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useUser } from '@clerk/nextjs';
import PocketBase from 'pocketbase';

interface Product {
  id: string;
  name: string;
  url: string;
  description: string;
  price: number;
  category: string;
  client_id: string;
  created: string;
  updated: string;
}

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

export default function ProductsPage() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    price: '',
    category: ''
  });
  const [pb] = useState(() => new PocketBase(POCKETBASE_URL));
  const [saveStatus, setSaveStatus] = useState<{status: 'success' | 'error', message: string} | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvMapping, setCsvMapping] = useState<{[key: string]: string}>({
    name: '', 
    description: '', 
    price: '', 
    url: '', 
    category: ''
  });
  const [availableCsvColumns, setAvailableCsvColumns] = useState<string[]>([]);
  const [processingCsv, setProcessingCsv] = useState(false);
  const [csvUploadStatus, setCsvUploadStatus] = useState<{
    total: number,
    processed: number,
    success: number,
    error: number
  }>({
    total: 0,
    processed: 0,
    success: 0,
    error: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      const records = await pb.collection('products').getFullList<Product>({
        filter: `client_id = "${clientRecord.id}"`,
        sort: '-created'
      });

      setProducts(records);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveStatus(null);

    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      const productData = {
        name: formData.name,
        url: formData.url,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        client_id: clientRecord.id
      };

      let result;
      if (selectedProduct) {
        result = await pb.collection('products').update(selectedProduct.id, productData);
        setSaveStatus({
          status: 'success',
          message: 'Producto actualizado correctamente'
        });
      } else {
        result = await pb.collection('products').create(productData);
        setSaveStatus({
          status: 'success',
          message: 'Producto creado correctamente'
        });
      }

      setTimeout(() => {
      setIsModalOpen(false);
      setSelectedProduct(null);
        setSaveStatus(null);
      setFormData({
        name: '',
          url: '',
        description: '',
        price: '',
          category: ''
      });
      fetchProducts();
      }, 1500);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setSaveStatus({
        status: 'error',
        message: 'Error al guardar el producto. Por favor, inténtalo de nuevo.'
      });
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      url: product.url || '',
      description: product.description,
      price: typeof product.price === 'number' 
        ? product.price.toString() 
        : product.price,
      category: product.category
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      await pb.collection('products').delete(productId);
      fetchProducts();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length > 0) {
          setCsvPreview(rows.slice(0, 5));
          const headers = rows[0];
          setAvailableCsvColumns(headers);
          
          // Try to auto-map columns based on header names
          const mapping: {[key: string]: string} = {
            name: '',
            description: '',
            price: '',
            url: '',
            category: ''
          };
          
          headers.forEach((header) => {
            const normalizedHeader = header.toLowerCase().trim();
            if (normalizedHeader.includes('nombre') || normalizedHeader === 'name') {
              mapping.name = header;
            } else if (normalizedHeader.includes('descripcion') || normalizedHeader === 'description') {
              mapping.description = header;
            } else if (normalizedHeader.includes('precio') || normalizedHeader === 'price') {
              mapping.price = header;
            } else if (normalizedHeader.includes('url') || normalizedHeader.includes('enlace') || normalizedHeader.includes('link')) {
              mapping.url = header;
            } else if (normalizedHeader.includes('categoria') || normalizedHeader.includes('category')) {
              mapping.category = header;
            }
          });
          
          setCsvMapping(mapping);
        }
      };
      
      reader.readAsText(file);
    }
  };

  const parseCsv = (text: string): string[][] => {
    // Simple CSV parser that handles quoted fields
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        // End of line
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          currentField = '';
          if (currentRow.some(cell => cell)) { // Skip empty rows
            rows.push(currentRow);
          }
          currentRow = [];
        }
        
        // Skip the \n if this is \r\n
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
    
    // Add the last row if needed
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(cell => cell)) {
        rows.push(currentRow);
      }
    }
    
    return rows;
  };

  const handleMapColumn = (field: string, column: string) => {
    setCsvMapping({
      ...csvMapping,
      [field]: column
    });
  };

  const downloadTemplateCSV = () => {
    const template = 'nombre,precio,descripcion,url,categoria\nProducto Ejemplo,99.99,"Descripción detallada del producto",https://ejemplo.com/producto,Categoría';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'productos_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processCsvUpload = async () => {
    if (!csvFile || !user) return;
    
    setProcessingCsv(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCsv(text);
        
        if (rows.length < 2) {
          throw new Error('El archivo CSV no contiene datos suficientes');
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `clerk_id = "${user.id}"`
        );
        
        const uploadStatus = {
          total: dataRows.length,
          processed: 0,
          success: 0,
          error: 0
        };
        
        setCsvUploadStatus(uploadStatus);
        
        // Process each row in the CSV
        for (const row of dataRows) {
          try {
            const getColumnValue = (field: string) => {
              const columnIndex = headers.indexOf(csvMapping[field]);
              return columnIndex >= 0 && columnIndex < row.length ? row[columnIndex] : '';
            };
            
            const productData = {
              name: getColumnValue('name'),
              description: getColumnValue('description'),
              price: getColumnValue('price'),
              url: getColumnValue('url'),
              category: getColumnValue('category'),
              client_id: clientRecord.id
            };
            
            // Basic validation
            if (!productData.name) {
              throw new Error('Nombre de producto requerido');
            }
            
            await pb.collection('products').create(productData);
            
            uploadStatus.success++;
          } catch (error) {
            console.error('Error al procesar fila CSV:', error);
            uploadStatus.error++;
          }
          
          uploadStatus.processed++;
          setCsvUploadStatus({...uploadStatus});
        }
        
        setTimeout(() => {
          setProcessingCsv(false);
          setIsCsvModalOpen(false);
          setCsvFile(null);
          setCsvPreview([]);
          setCsvMapping({
            name: '',
            description: '',
            price: '',
            url: '',
            category: ''
          });
          fetchProducts();
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      } catch (error) {
        console.error('Error al procesar CSV:', error);
        setProcessingCsv(false);
        alert('Error al procesar el archivo CSV');
      }
    };
    
    reader.readAsText(csvFile);
  };

  const handleSelectProductAction = () => {
    const actionPopup = document.getElementById('product-actions-popup');
    if (actionPopup) {
      if (actionPopup.classList.contains('hidden')) {
        // Si el popup está oculto, mostrarlo con animación
        actionPopup.classList.remove('hidden');
        actionPopup.classList.add('animate-fade-in-down');
        
        // Animar el botón
        const button = document.querySelector('[data-add-product-button]');
        if (button) {
          button.classList.add('rotate-bg-animation');
          setTimeout(() => {
            button.classList.remove('rotate-bg-animation');
          }, 500);
        }
      } else {
        // Si el popup está visible, ocultarlo
        actionPopup.classList.remove('animate-fade-in-down');
        actionPopup.classList.add('animate-fade-out-up');
        
        setTimeout(() => {
          actionPopup.classList.add('hidden');
          actionPopup.classList.remove('animate-fade-out-up');
        }, 200);
      }
    }
  };

  const closeProductActionsPopup = () => {
    const actionPopup = document.getElementById('product-actions-popup');
    if (actionPopup) {
      actionPopup.classList.remove('animate-fade-in-down');
      actionPopup.classList.add('animate-fade-out-up');
      
      setTimeout(() => {
        actionPopup.classList.add('hidden');
        actionPopup.classList.remove('animate-fade-out-up');
      }, 200);
    }
  };

  const handleOptionClick = (callback: () => void) => {
    // Efecto visual al hacer clic
    const rippleEffect = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      // Posicionar el círculo donde se hizo clic
      const rect = button.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('ripple-effect');

      // Eliminar cualquier ripple existente
      const ripple = button.querySelector('.ripple-effect');
      if (ripple) {
        ripple.remove();
      }

      // Agregar y luego eliminar el efecto
      button.appendChild(circle);
      setTimeout(() => {
        circle.remove();
        callback();
      }, 300);
    };

    return rippleEffect;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 w-full flex items-center justify-center">
        <div className="text-gray-700">Cargando productos...</div>
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
                <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
                <p className="text-gray-500 text-sm mt-1">Gestiona tu catálogo de productos</p>
              </div>
              <div className="relative z-10">
                <button
                  data-add-product-button
                  onClick={handleSelectProductAction}
                  className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 self-start md:self-auto shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-sm overflow-hidden relative"
                >
                  <PlusIcon className="w-5 h-5 transition-transform duration-300 ease-in-out group-hover:rotate-90" />
                  <span>Nuevo Producto</span>
                </button>
                
                {/* Popup para seleccionar acción */}
                <div id="product-actions-popup" className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 hidden transition-all duration-300 ease-in-out transform origin-top-right">
                  <div className="p-2">
              <button
                      onClick={handleOptionClick(() => {
                        closeProductActionsPopup();
                  setSelectedProduct(null);
                  setFormData({
                    name: '',
                          url: '',
                    description: '',
                    price: '',
                          category: ''
                  });
                        setSaveStatus(null);
                  setIsModalOpen(true);
                      })}
                      className="w-full py-2 px-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors hover:scale-105 transform duration-150 relative overflow-hidden option-button"
                    >
                      <PlusIcon className="w-5 h-5 text-primary" />
                      <span>Producto individual</span>
                    </button>
                    
                    <button
                      onClick={handleOptionClick(() => {
                        closeProductActionsPopup();
                        setIsCsvModalOpen(true);
                      })}
                      className="w-full py-2 px-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors hover:scale-105 transform duration-150 relative overflow-hidden option-button"
                    >
                      <ArrowUpTrayIcon className="w-5 h-5 text-primary" />
                      <span>Importar desde CSV</span>
                    </button>
                    
                    <button
                      onClick={handleOptionClick(() => {
                        closeProductActionsPopup();
                        downloadTemplateCSV();
                      })}
                      className="w-full py-2 px-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors hover:scale-105 transform duration-150 relative overflow-hidden option-button"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5 text-primary" />
                      <span>Descargar Plantilla CSV</span>
              </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Buscar productos por nombre, descripción o categoría..."
                className="w-full bg-white text-gray-700 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-gray-800 font-medium text-lg">{product.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-gray-500 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-100"
                        title="Editar producto"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-gray-100"
                        title="Eliminar producto"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {product.category}
                    </span>
                    
                    {product.url && (
                      <a 
                        href={product.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-hover text-sm inline-flex items-center"
                        title="Visitar URL"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="underline">Enlace</span>
                      </a>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mt-1 flex-grow">{product.description}</p>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-gray-800 font-medium text-lg">
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(String(product.price)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 mt-4">No se encontraron productos</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-primary hover:text-primary-hover text-sm"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de producto individual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col">
              {/* Título del modal */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            
              <div className="p-6 space-y-6 overflow-y-auto">
                {saveStatus && (
                  <div className={`p-3 rounded-lg ${
                    saveStatus.status === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {saveStatus.status === 'success' ? (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      )}
                      {saveStatus.message}
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      Nombre del Producto*
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ej: Camiseta de algodón"
                    required
                  />
                </div>

                <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      URL del Producto
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://ejemplo.com/producto"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Link a la página del producto (opcional)</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      Descripción*
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-24 resize-none"
                      placeholder="Describe las características del producto..."
                    required
                  />
                </div>

                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      Categoría*
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ej: Ropa, Electrónica, Hogar"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-base font-medium mb-2">
                      Precio*
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                </form>
                </div>

              <div className="p-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const form = document.querySelector('form');
                      if (form) {
                        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }
                    }}
                    className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium flex items-center justify-center gap-2 text-base relative overflow-hidden"
                  >
                    {selectedProduct ? (
                      <>
                        Guardar Cambios
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5" />
                        Crear Producto
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para importar CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !processingCsv && setIsCsvModalOpen(false)}>
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">
                  Importar Productos desde CSV
                </h2>
                {!processingCsv && (
                  <button 
                    onClick={() => setIsCsvModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                )}
              </div>
              
              <div className="p-6 overflow-y-auto">
                {!csvFile ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 text-center">
                      <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-700 mb-3">Arrastra tu archivo CSV aquí o haz clic para seleccionarlo</p>
                      <p className="text-gray-500 text-sm mb-4">Formatos compatibles: .csv</p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="hidden"
                        ref={fileInputRef}
                        id="csv-file-input"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        Seleccionar Archivo
                      </button>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-gray-500 text-sm">o</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    
                    <div className="text-center">
                      <button
                        onClick={downloadTemplateCSV}
                        className="flex items-center gap-2 mx-auto text-primary hover:text-primary-hover transition-colors"
                      >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>Descargar Plantilla CSV</span>
                      </button>
                      <p className="text-gray-500 text-sm mt-2">
                        Usa nuestra plantilla para un formato correcto
                      </p>
                    </div>
                  </div>
                ) : processingCsv ? (
                  <div className="space-y-6 py-6">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-700 text-lg font-medium">Procesando CSV...</p>
                      <p className="text-gray-500">
                        Importando {csvUploadStatus.processed}/{csvUploadStatus.total} productos
                      </p>
                    </div>
                    
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${csvUploadStatus.total ? (csvUploadStatus.processed / csvUploadStatus.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-center gap-8 text-sm text-gray-600">
                      <div>
                        <span className="font-medium text-green-600">{csvUploadStatus.success}</span> correctos
                      </div>
                      <div>
                        <span className="font-medium text-red-600">{csvUploadStatus.error}</span> con errores
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>
                        Para una correcta importación, mapea las columnas de tu CSV con los campos de productos.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">Vista previa de tu CSV:</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              {csvPreview[0]?.map((header, i) => (
                                <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {csvPreview.slice(1).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 text-sm text-gray-500 truncate max-w-xs">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">Mapeo de columnas:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del producto*
                          </label>
                          <select 
                            value={csvMapping.name} 
                            onChange={(e) => handleMapColumn('name', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Seleccionar columna</option>
                            {availableCsvColumns.map((column, index) => (
                              <option key={index} value={column}>{column}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                          </label>
                          <select 
                            value={csvMapping.description} 
                            onChange={(e) => handleMapColumn('description', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Seleccionar columna</option>
                            {availableCsvColumns.map((column, index) => (
                              <option key={index} value={column}>{column}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio
                          </label>
                          <select 
                            value={csvMapping.price} 
                            onChange={(e) => handleMapColumn('price', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Seleccionar columna</option>
                            {availableCsvColumns.map((column, index) => (
                              <option key={index} value={column}>{column}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL
                          </label>
                          <select 
                            value={csvMapping.url} 
                            onChange={(e) => handleMapColumn('url', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Seleccionar columna</option>
                            {availableCsvColumns.map((column, index) => (
                              <option key={index} value={column}>{column}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                          </label>
                          <select 
                            value={csvMapping.category} 
                            onChange={(e) => handleMapColumn('category', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Seleccionar columna</option>
                            {availableCsvColumns.map((column, index) => (
                              <option key={index} value={column}>{column}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {!processingCsv && csvFile && (
                <div className="p-6 border-t border-gray-100">
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setCsvFile(null);
                        setCsvPreview([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={processCsvUpload}
                      disabled={!csvMapping.name}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        csvMapping.name 
                          ? 'bg-primary text-white hover:bg-primary-hover' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Importar Productos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOutUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        
        @keyframes rotateBg {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.2s ease-out forwards;
        }
        
        .animate-fade-out-up {
          animation: fadeOutUp 0.2s ease-in forwards;
        }
        
        .rotate-bg-animation {
          background-size: 200% 200%;
          animation: rotateBg 0.5s ease;
        }
        
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
        }
        
        .option-button:active {
          transform: scale(0.98);
        }
        
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 