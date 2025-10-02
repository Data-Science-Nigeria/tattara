'use client';

import React, { useState } from 'react';
import { FileText, Target, Image, Mic, Edit, FormInput, ArrowLeft } from 'lucide-react';

export default function SelectForm() {
  const [selectedForm, setSelectedForm] = useState('');

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <button 
          onClick={() => window.location.href = '/admin/create-workflow'}
          className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Select Form</h1>
        <p className="text-gray-600">Choose a form type to create workflow assignments</p>
      </div>

      {/* Form Selection Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Child Registration */}
        <div className="relative">
          <input
            type="radio"
            id="child-registration"
            name="form-type"
            value="child-registration"
            checked={selectedForm === 'child-registration'}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="peer sr-only"
          />
          <label
            htmlFor="child-registration"
            className={`flex cursor-pointer rounded-2xl border-2 p-6 transition-all hover:border-green-600 hover:shadow-lg ${
              selectedForm === 'child-registration' 
                ? 'border-green-600 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex w-full items-start gap-4">
              <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                selectedForm === 'child-registration'
                  ? 'border-green-600 bg-green-600'
                  : 'border-gray-300 bg-white'
              }`}>
                <div className={`h-2 w-2 rounded-full bg-white ${
                  selectedForm === 'child-registration' ? 'opacity-100' : 'opacity-0'
                }`}></div>
              </div>
              <div className="flex-1">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Child Registration
                </h3>
                <p className="leading-relaxed text-gray-600">
                  Capture essential details to create and manage a child's health record.
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Malaria Surveillance */}
        <div className="relative">
          <input
            type="radio"
            id="malaria-surveillance"
            name="form-type"
            value="malaria-surveillance"
            checked={selectedForm === 'malaria-surveillance'}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="peer sr-only"
          />
          <label
            htmlFor="malaria-surveillance"
            className={`flex cursor-pointer rounded-2xl border-2 p-6 transition-all hover:border-green-600 hover:shadow-lg ${
              selectedForm === 'malaria-surveillance' 
                ? 'border-green-600 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex w-full items-start gap-4">
              <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                selectedForm === 'malaria-surveillance'
                  ? 'border-green-600 bg-green-600'
                  : 'border-gray-300 bg-white'
              }`}>
                <div className={`h-2 w-2 rounded-full bg-white ${
                  selectedForm === 'malaria-surveillance' ? 'opacity-100' : 'opacity-0'
                }`}></div>
              </div>
              <div className="flex-1">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Malaria Surveillance
                </h3>
                <p className="leading-relaxed text-gray-600">
                  Record and track malaria cases to strengthen early detection and response.
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Input Type Selection */}
      {selectedForm && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Input Type</h2>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Form Card */}
            <div className="cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-green-600 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <FormInput className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Form</h3>
            </div>

            {/* Image Card */}
            <div className="cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-green-600 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Image className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Image</h3>
            </div>

            {/* Audio Card */}
            <div className="cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-green-600 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Mic className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Audio</h3>
            </div>

            {/* Text Card */}
            <div className="cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-green-600 hover:shadow-md">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Edit className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">Text</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}