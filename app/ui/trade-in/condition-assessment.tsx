'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { conditionQuestions } from '@/app/lib/trade-in/condition-images';

interface ConditionAssessmentProps {
  values: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
  errors?: Record<string, boolean>;
}

export default function ConditionAssessment({ values, onChange, errors = {} }: ConditionAssessmentProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Get the usage signs question and other questions
  const usageSignsQuestion = conditionQuestions.find(q => q.id === 'usage_signs');
  const otherQuestions = conditionQuestions.filter(q => q.id !== 'usage_signs');

  const showDetailedQuestions = values.usage_signs === 'yes';

  // Auto-assign "regular" values when user selects "No" for usage signs
  useEffect(() => {
    if (values.usage_signs === 'no') {
      // Automatically set all other questions to "regular"
      otherQuestions.forEach(question => {
        if (!values[question.id] || values[question.id] !== 'regular') {
          onChange(question.id, 'regular');
        }
      });
    }
  }, [values.usage_signs, values, onChange, otherQuestions]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const handleOptionSelect = (questionId: string, value: string) => {
    onChange(questionId, value);
    
    // Only collapse if it's not force-expanded (usage_signs question and detailed questions are force-expanded)
    const isUsageSignsQuestion = questionId === 'usage_signs';
    const isDetailedQuestion = otherQuestions.some(q => q.id === questionId);
    
    if (!isUsageSignsQuestion && !isDetailedQuestion && expandedQuestion === questionId) {
      setExpandedQuestion(null);
    }
  };

  const renderQuestionOptions = (question: any, forceExpanded = false) => {
    const isExpanded = forceExpanded || expandedQuestion === question.id;
    const isUsageSignsQuestion = question.id === 'usage_signs';
    
    return (
      <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        {/* Question Header */}
        <button
          type="button"
          onClick={() => !forceExpanded && toggleQuestion(question.id)}
          className={`w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors ${
            errors[question.id] ? 'border-l-4 border-red-500' : ''
          } ${forceExpanded ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{question.question}</h4>
              <p className="text-sm text-gray-600 mt-1">{question.description}</p>
              {values[question.id] && (
                <p className="text-sm text-blue-600 mt-1 font-medium">
                  Seleccionado: {question.options.find((opt: any) => opt.value === values[question.id])?.label}
                </p>
              )}
            </div>
            {!forceExpanded && !isUsageSignsQuestion && (
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </button>

        {/* Question Options */}
        {(isExpanded || isUsageSignsQuestion) && (
          <div className="p-4 bg-white">
            {isUsageSignsQuestion ? (
              // Simple buttons for usage signs question (no images)
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((option: any) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md min-h-[100px] flex ${
                      values[question.id] === option.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleOptionSelect(question.id, option.value)}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-2 leading-none">{option.label}</h5>
                        <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
                      </div>
                      {values[question.id] === option.value && (
                        <div className="ml-3 flex-shrink-0 mt-0">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // Image-based options for other questions
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {question.options.map((option: any) => {
                  const isSelected = values[question.id] === option.value;
                  
                  return (
                    <div
                      key={option.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        handleOptionSelect(question.id, option.value);
                      }}
                    >
                    {/* Option Image */}
                    <div className="relative h-32 mb-3 bg-gray-50 rounded overflow-hidden">
                      <Image
                        src={option.imageUrl}
                        alt={`${question.question} - ${option.label}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority={true}
                        unoptimized={false}
                        onError={(e) => {
                          // Fallback to placeholder if image doesn't exist
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/trade-in/placeholder-condition.svg';
                        }}
                      />
                    </div>

                    {/* Option Details */}
                    <div className="text-center">
                      <h5 className="font-medium text-gray-900 mb-1">{option.label}</h5>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="mt-2 flex justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Paso 2: Requisitos del producto */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Paso 2 Image */}
        <div className="flex items-start py-4 border-b border-gray-200 pl-6">
          <Image 
            src="https://form-builder-by-hulkapps.s3.amazonaws.com/uploads/patagoniachile.myshopify.com/backend_image/Estado.png" 
            alt="Paso 2: Estado del producto"
            width={250} 
            height={55}
            className="object-contain"
          />
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ¿Tu producto cumple con estos requisitos mínimos para intercambiar?
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Limpio y en buenas condiciones de funcionamiento, sin rasgaduras importantes, roturas, agujeros, cierres rotos o botones faltantes.</li>
              <li>• Mantiene sus etiquetas blancas internas Patagonia cosidas.</li>
              <li>• Sin pelo de animales adherido.</li>
              <li>• Sin etiquetas corporativas ni otras intervenciones externas.</li>
              <li>• Forma parte de la lista de productos intercambiables. (Revisa el listado en la sección de ayuda)</li>
            </ul>
          </div>
          
          {/* Minimum Requirements Checkbox - Moved here */}
          <div className="mt-4 border border-gray-200 rounded-lg p-4 cursor-pointer">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={values.meets_minimum_requirements === 'true'}
                onChange={(e) => onChange('meets_minimum_requirements', e.target.checked ? 'true' : 'false')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 cursor-pointer">
                  Cumple con los requisitos mínimos
                </span>
                <p className="text-xs text-gray-600 mt-1 cursor-pointer">
                  Confirmo que el producto cumple con los requisitos mínimos de calidad para el programa Trade-in
                </p>
              </div>
            </label>
          </div>
          
          {/* Show recycling message only when checkbox is checked */}
          {values.meets_minimum_requirements === 'true' && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Al continuar, confirmas estar de acuerdo con que tu producto sea reciclado en caso de no cumplir con algunos de estos requisitos, sin recibir crédito por este.</span>
              </p>
            </div>
          )}
          
          {/* Condition Assessment Section - Only show when checkbox is checked */}
          {values.meets_minimum_requirements === 'true' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Condición del Producto
                </h3>
                <p className="text-sm text-gray-600">
                  Evalúa la condición de tu producto seleccionando la opción que mejor describe su estado.
                </p>
              </div>

              {/* Usage Signs Question (Always shown first) */}
              {usageSignsQuestion && renderQuestionOptions(usageSignsQuestion, true)}

              {/* Detailed Questions (Only shown when usage_signs === 'yes') */}
              {showDetailedQuestions && (
                <div className="ml-4 border-l-2 border-blue-200 pl-4">
                  {otherQuestions.map(question => renderQuestionOptions(question, true))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
