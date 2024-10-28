'use client';

export default function TradeInForm({
  formData,
  setFormData,
  errors,
  firstNameRef,
}: {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors: any;
  firstNameRef: React.RefObject<HTMLInputElement>;
}) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form className="rounded-md bg-gray-50 p-4 md:p-6">
      <h2 className="text-lg font-medium mb-4">Basic Information</h2>

      {/* First Name */}
      <div className="mb-4">
        <label
          htmlFor="firstName"
          className="mb-2 block text-sm font-medium"
        >
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          className={`block w-full rounded-md border py-2 text-sm ${
            errors.firstName ? 'border-red-500' : 'border-gray-200'
          }`}
          ref={firstNameRef}
          required
        />
      </div>

      {/* Last Name */}
      <div className="mb-4">
        <label
          htmlFor="lastName"
          className="mb-2 block text-sm font-medium"
        >
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          className={`block w-full rounded-md border py-2 text-sm ${
            errors.lastName ? 'border-red-500' : 'border-gray-200'
          }`}
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
          className={`block w-full rounded-md border py-2 text-sm ${
            errors.rut ? 'border-red-500' : 'border-gray-200'
          }`}
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
          className={`block w-full rounded-md border py-2 text-sm ${
            errors.email ? 'border-red-500' : 'border-gray-200'
          }`}
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
          className={`block w-full rounded-md border py-2 text-sm ${
            errors.phone ? 'border-red-500' : 'border-gray-200'
          }`}
          required
        />
      </div>
    </form>
  );
}
