"use client"
import React, { useState } from "react";
import { OwnerSelection, Permissions, ResourceSection } from "./ApiKeyModalComponents";

interface FormData {
  name: string;
  project: string;
  permissions: string;
  resources: Record<string, string>;
}

interface FormProps {
  onSubmit: (data: FormData) => void;
}

export const Form: React.FC<FormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    project: "default",
    permissions: "read",
    resources: {
      api_access: "none",
      customization: "none",
      analytics: "none",
      user_management: "none",
      billing: "none",
      webhooks: "none",
    }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.name.length > 50) {
      newErrors.name = 'El nombre no puede exceder 50 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePermissionChange = (permission: string) => {
    setFormData(prev => ({ ...prev, permissions: permission }));
  };

  const handleResourceChange = (resourceKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [resourceKey]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        <label htmlFor="name" className="block mb-2">Nombre</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`w-full bg-[#121212] rounded p-2 ${
            errors.name ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="Mi API Key"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="project" className="block mb-2">Proyecto</label>
        <div className="relative">
          <select
            id="project"
            name="project"
            value={formData.project}
            onChange={handleInputChange}
            className="w-full bg-[#121212] rounded p-2 appearance-none border border-gray-600"
          >
            <option value="default">Proyecto por defecto</option>
            <option value="tiendanube">Tiendanube</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
      </div>

      <Permissions value={formData.permissions} onChange={handlePermissionChange} />

      <div className="space-y-6">
        <ResourceSection
          title="API Access"
          description={["Acceso a los endpoints de la API"]}
          options={["none", "read", "write"]}
          value={formData.resources.api_access}
          onChange={(value) => handleResourceChange("api_access", value)}
        />

        <ResourceSection
          title="Customization"
          description={["Gestión de personalizaciones de la tienda"]}
          options={["none", "read", "write"]}
          value={formData.resources.customization}
          onChange={(value) => handleResourceChange("customization", value)}
        />

        <ResourceSection
          title="Analytics"
          description={["Acceso a datos analíticos"]}
          options={["none", "read"]}
          value={formData.resources.analytics}
          onChange={(value) => handleResourceChange("analytics", value)}
        />

        <ResourceSection
          title="User Management"
          description={["Gestión de usuarios y permisos"]}
          options={["none", "read", "write"]}
          value={formData.resources.user_management}
          onChange={(value) => handleResourceChange("user_management", value)}
        />

        <ResourceSection
          title="Billing"
          description={["Acceso a información de facturación"]}
          options={["none", "read"]}
          value={formData.resources.billing}
          onChange={(value) => handleResourceChange("billing", value)}
        />

        <ResourceSection
          title="Webhooks"
          description={["Gestión de webhooks"]}
          options={["none", "read", "write"]}
          value={formData.resources.webhooks}
          onChange={(value) => handleResourceChange("webhooks", value)}
        />
      </div>
    </form>
  );
};
