'use client';
import { useState } from 'react';
import { Button } from '@/app/ui/button';

export default function TradeInForm({
  onSubmit,
  firstNameRef,
}: {
  onSubmit: (formData: any) => void;
  firstNameRef: React.RefObject<HTMLInputElement>; // Reference for focusing first input field
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    rut: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-md bg-gray-50 p-4 md:p-6">
      <h2 className="text-lg font-medium mb-4">Basic Information</h2>
      {/* Name */}
      <div className="mb-4">
        <label htmlFor="firstName" className="mb-2 block text-sm font-medium">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          className="block w-full rounded-md border border-gray-200 py-2 text-sm"
          ref={firstNameRef} // Set focus on this field
          required
        />
      </div>

      {/* Last Name */}
      <div className="mb-4">
        <label htmlFor="lastName" className="mb-2 block text-sm font-medium">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          className="block w-full rounded-md border border-gray-200 py-2 text-sm"
          required
        />
      </div>

      {/* RUT */}
      <div className="mb-4">
        <label htmlFor="rut" className="mb-2 block text-sm font-medium">
          RUT
        </label>
        <input
          type="text"
          id="rut"
          name="rut"
          value={formData.rut}
          onChange={handleInputChange}
          className="block w-full rounded-md border border-gray-200 py-2 text-sm"
          required
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="block w-full rounded-md border border-gray-200 py-2 text-sm"
          required
        />
      </div>

      {/* Phone */}
      <div className="mb-4">
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="block w-full rounded-md border border-gray-200 py-2 text-sm"
          required
        />
      </div>

      {/* Address */}
      <div className="mb-4">
        <label htmlFor="address" className="mb-2 block text-sm font-medium">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className="block w-full rounded-md border border-gray-200 py-2 text-sm"
          required
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}
