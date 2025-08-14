'use client';

import { useState } from 'react';
import Image from 'next/image';
import { conditionQuestions } from '@/app/lib/trade-in/condition-images';

interface ConditionAssessmentProps {
  values: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
  errors?: Record<string, boolean>;
}

export default function ConditionAssessment({ values, onChange, errors = {} }: ConditionAssessmentProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const handleOptionSelect = (questionId: string, value: string) => {
    onChange(questionId, value);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Condición del Producto
        </h3>
        <p className="text-sm text-gray-600">
          Evalúa la condición de tu producto seleccionando la opción que mejor describe su estado. 
          Haz clic en cada pregunta para ver ejemplos visuales.
        </p>
      </div>

      {conditionQuestions.map((question) => (
        <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Question Header */}
          <button
            type="button"
            onClick={() => toggleQuestion(question.id)}
            className={`w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors ${
              errors[question.id] ? 'border-l-4 border-red-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{question.question}</h4>
                <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                {values[question.id] && (
                  <p className="text-sm text-blue-600 mt-1 font-medium">
                    Seleccionado: {question.options.find(opt => opt.value === values[question.id])?.label}
                  </p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedQuestion === question.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Question Options */}
          {expandedQuestion === question.id && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {question.options.map((option) => (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                      values[question.id] === option.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleOptionSelect(question.id, option.value)}
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
                    {values[question.id] === option.value && (
                      <div className="mt-2 flex justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Minimum Requirements Checkbox */}
      <div className="border border-gray-200 rounded-lg p-4">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={values.meets_minimum_requirements === 'true'}
            onChange={(e) => onChange('meets_minimum_requirements', e.target.checked ? 'true' : 'false')}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Cumple con los requisitos mínimos
            </span>
            <p className="text-xs text-gray-600 mt-1">
              Confirmo que el producto cumple con los requisitos mínimos de calidad para el programa Trade-in
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
