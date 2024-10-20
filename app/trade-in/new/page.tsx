'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SimilarImage } from '@/app/lib/definitions';
import { Button } from '@/app/ui/button';
import { RadioGroup, Radio } from '@headlessui/react';
import { lusitana } from '@/app/ui/fonts';
import TradeInForm from '@/app/ui/trade-in/trade-in-form';
import AddressAutocomplete from '@/app/ui/address-autocomplete';
import {
  ChevronRightIcon, ChevronDownIcon,
  HomeIcon, MapPinIcon
} from '@heroicons/react/24/outline';

interface FormData {
    firstName: string;
    lastName: string;
    rut: string;
    email: string;
    phone: string;
    selectedItemColor: string;
    address: string;
    houseDetails: string;
    client_comment: string;
}


const TradeInFormPage = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [itemColorSuggestions, setItemColorSuggestions] = useState<
    { itemColor: string; imageSrc: string }[]
  >([]);
  const [matchedImageUrl, setMatchedImageUrl] = useState<string | null>(null);
  const [isImageSectionCollapsed, setImageSectionCollapsed] = useState(true);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const [deliveryOption, setDeliveryOption] = useState<string>('');

  // Estado para los datos del formulario y errores
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    rut: '',
    email: '',
    phone: '',
    selectedItemColor: '',
    address: '',
    houseDetails: '',
    client_comment: ''
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    rut: false,
    email: false,
    phone: false,
    selectedItemColor: false,
    address: false,
  });

  // Fetch ITEM_COLOR suggestions for autocomplete along with IMAGE_SRC on page load
  useEffect(() => {
    fetchItemColorSuggestions(); // Autocomplete should work from the beginning
  }, []);

  // Toggle collapse for the image upload section
  const toggleImageSection = () => {
    setImageSectionCollapsed(!isImageSectionCollapsed);
  };

  // Fetch ITEM_COLOR suggestions for autocomplete along with IMAGE_SRC
  const fetchItemColorSuggestions = async () => {
    try {
      const response = await fetch('/api/trade-in/autocomplete');
      const data = await response.json();
      setItemColorSuggestions(data.itemColors || []); // Ensure it is always an array
    } catch (error) {
      console.error(
        'Error fetching ITEM_COLOR and IMAGE_SRC suggestions:',
        error
      );
    }
  };

  // Fetch the image if ITEM_COLOR matches by looking up the suggestion list
  const fetchItemColorMatch = (itemColor: string) => {
    const match = itemColorSuggestions.find(
      (item) => item.itemColor === itemColor
    );
    if (match) {
      setMatchedImageUrl(match.imageSrc); // Set the image URL to display below the input
    } else {
      setMatchedImageUrl(null); // Clear the image if no match is found
    }
  };

  // Handles file selection and generates preview URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setSimilarImages([]);
      setProcessing(false);
    }
  };

  // Handles form submission for image processing
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setProcessing(true); // Show form immediately when the button is pressed

    const formData = new FormData();
    firstNameInputRef.current?.focus();
    formData.append('image', file);

    try {
      const response = await fetch('/api/trade-in/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error uploading image');
      }

      const data = await response.json();
      setSimilarImages(data.similarImages); // Save similar images once processing is done

      // No longer collapse image section after processing, only after selecting a similar image
    } catch (error) {
      setError('Error uploading image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    // Handle image selection and update ITEM_COLOR field
    const handleImageSelect = (itemColor: string) => {
        setFormData((prevFormData) => ({
        ...prevFormData,
        selectedItemColor: itemColor,
        }));
        fetchItemColorMatch(itemColor); // Fetch the image if ITEM_COLOR matches
        setImageSectionCollapsed(true); // Collapse the image upload section when an image is selected
    };

    // Handle manual typing in the ITEM_COLOR field
    const handleItemColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData((prevFormData) => ({
        ...prevFormData,
        selectedItemColor: value,
        }));
        if (value.length > 0) {
        fetchItemColorMatch(value); // Trigger match check when typing
        } else {
        setMatchedImageUrl(null); // Clear the image if input is cleared
        }
    };

    // Handle client comment change
    const handleClientCommentChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const value = e.target.value;
        setFormData((prevFormData) => ({
        ...prevFormData,
        client_comment: value,
        }));
    };

    // Handle address selection from Google Maps Autocomplete
    const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
        const formattedAddress = place.formatted_address || '';
        setFormData((prevFormData) => ({
        ...prevFormData,
        address: formattedAddress,
        }));
    };

    // Handle house details change
    const handleHouseDetailsChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;
        setFormData((prevFormData) => ({
        ...prevFormData,
        houseDetails: value,
        }));
    };

  const handleFormSubmit = async () => {
    // Validación de campos
    const newErrors = {
      firstName: !formData.firstName,
      lastName: !formData.lastName,
      rut: !formData.rut,
      email: !formData.email,
      phone: !formData.phone,
      selectedItemColor: !formData.selectedItemColor,
      address: !formData.address,
    };
    setErrors(newErrors);

    setLoadingForm(true);

    // Check errors
    const hasErrors = Object.values(newErrors).some((error) => error);
    if (hasErrors) {
      return;
    }

    // Send form data to the server
    try {
      const response = await fetch('/api/trade-in/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error submitting form');
      }

      console.log('Trade-In submitted successfully');
      router.push('/trade-in');
    } catch (error) {
      console.error('Error submitting Trade-In form:', error);
    } finally {
      setLoadingForm(false);
    }
  };

  // Handle delivery option change
  const handleDeliveryOptionChange = (option: string) => {
    setDeliveryOption(option);
    setFormData((prevFormData) => ({
      ...prevFormData,
      deliveryOption: option,
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex w-full items-center max-w-5xl p-4 gap-8">
        <h1 className={`${lusitana.className} text-4xl`}>Trade - In</h1>
      </div>
      <div className="flex w-full max-w-5xl gap-8">
        {/* Left section: Image upload and similar products */}
        <div className="w-1/2">
          {/* ITEM_COLOR Field (always visible on the left side) */}
          <div className="rounded-md bg-gray-50 p-4 md:p-6 mt-8">
            <label
              htmlFor="itemColor"
              className="block text-lg font-bold mb-2"
            >
              Product Style
            </label>
            <input
              type="text"
              id="itemColor"
              name="selectedItemColor"
              value={formData.selectedItemColor}
              onChange={handleItemColorChange}
              className={`block w-full rounded-md border py-3 text-lg ${
                errors.selectedItemColor ? 'border-red-500' : 'border-gray-400'
              }`}
              placeholder="Enter or select product code"
              list="itemColorSuggestions"
            />
            <datalist id="itemColorSuggestions">
              {itemColorSuggestions.map((item, index) => (
                <option key={index} value={item.itemColor}>
                  {item.itemColor}
                </option>
              ))}
            </datalist>

            {matchedImageUrl && (
              <div className="mt-4">
                <Image
                  layout="intrinsic"
                  width={300}
                  height={300}
                  src={matchedImageUrl}
                  alt="Matched Product"
                  className="w-48 h-48 object-cover"
                />
              </div>
            )}
          </div>

          <div
            className="mb-4 flex items-center cursor-pointer"
            onClick={toggleImageSection}
          >
            {isImageSectionCollapsed ? (
              <ChevronRightIcon className="h-6 w-6 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-gray-600" />
            )}
            <h2 className="text-xl font-medium ml-2 pt-5">
              Carga una imagen de tu producto y buscaremos!
            </h2>
          </div>

          {/* Collapsible Image Upload Section */}
          {!isImageSectionCollapsed && (
            <div className="rounded-md bg-gray-50 p-4 md:p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="image"
                    className="mb-2 block text-sm font-medium"
                  >
                    Upload Image
                  </label>
                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="block w-full rounded-md border border-gray-200 py-2 text-sm"
                    onChange={handleFileChange}
                  />
                </div>

                {previewUrl && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium">Image Preview:</h3>
                    <Image
                      layout="intrinsic"
                      width={200}
                      height={200}
                      src={previewUrl}
                      alt="Image Preview"
                      className="w-32 h-32 object-cover mt-2"
                    />
                  </div>
                )}

                {loading && (
                  <p className="text-sm text-gray-600">Processing image...</p>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="mt-6">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Upload Image'}
                  </Button>
                </div>
              </form>

              {similarImages.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium">Similar Products:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {similarImages.map((image, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center cursor-pointer p-2 border rounded-md ${
                          formData.selectedItemColor === image.item_color
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}
                        onClick={() => handleImageSelect(image.item_color)}
                      >
                        <Image
                          layout="intrinsic"
                          width={400}
                          height={400}
                          src={image.image_src}
                          alt={`Similar image ${index + 1}`}
                          className="w-32 h-32 object-cover mb-2"
                        />
                        <p>{image.item_color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}       
        </div>

        {/* Right section: TradeIn form */}
        <div className="w-1/2 mt-8">
            <TradeInForm
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                firstNameRef={firstNameInputRef}
            />

            {/* Opción de Entrega o Retiro */}
            <div className="rounded-md bg-gray-50 p-4 md:p-6 mt-8">
              <h3 className="text-lg font-medium mb-4">¿Cómo deseas entregar tu prenda?</h3>

              <RadioGroup value={deliveryOption} onChange={handleDeliveryOptionChange}>
                <div className="space-y-2">
                  {/* Opción: Retiro en Domicilio */}
                  <Radio value="Retiro en Domicilio">
                    {({ checked }) => (
                      <div
                        className={`relative flex items-center p-4 border rounded-md cursor-pointer transition-colors ${
                          checked ? 'bg-white border-blue-500' : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="Retiro en Domicilio"
                          checked={checked}
                          onChange={() => handleDeliveryOptionChange('Retiro en Domicilio')}
                          className="h-5 w-5 border-gray-300 rounded-full cursor-pointer mr-4"
                        />
                        <HomeIcon className="h-6 w-6 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">Retiro en Domicilio</span>
                      </div>
                    )}
                  </Radio>

                  {/* Opción: Entrega en Sucursal Chilexpress */}
                  <Radio value="Entrega en Sucursal Chilexpress">
                    {({ checked }) => (
                      <div
                        className={`relative flex items-center p-4 border rounded-md cursor-pointer transition-colors ${
                          checked ? 'bg-white border-blue-500' : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryOption"
                          value="Entrega en Sucursal Chilexpress"
                          checked={checked}
                          onChange={() => handleDeliveryOptionChange('Entrega en Sucursal Chilexpress')}
                          className="h-5 w-5 border-gray-300 rounded-full cursor-pointer mr-4"
                        />
                        <MapPinIcon className="h-6 w-6 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">Entrega en Sucursal Chilexpress</span>
                      </div>
                    )}
                  </Radio>
                </div>
              </RadioGroup>
            </div> 

            {/* Address Autocomplete Field */}
            {deliveryOption === 'Retiro en Domicilio' && (
              <div className="rounded-md bg-gray-50 p-4 md:p-6 mt-8">
                <label htmlFor="address" className="block text-sm font-medium font-bold mb-2">
                  Dirección
                </label>
                <AddressAutocomplete onPlaceSelected={handleAddressSelect} />

                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">La dirección es requerida.</p>
                )}

                <input
                  type="text"
                  id="houseDetails"
                  name="houseDetails"
                  value={formData.houseDetails}
                  onChange={handleHouseDetailsChange}
                  className="block w-full rounded-md border border-gray-400 font-medium py-3 text-sm mt-4"
                  placeholder="Número de casa, apto, etc. (opcional)"
                />
              </div>
            )}

            {/* Comment Card */}
            <div className="rounded-md bg-gray-50 p-4 md:p-6 mt-8">
                <label
                htmlFor="client_comment"
                className="block text-sm font-medium font-bold mb-2"
                >
                Share Your Story (Optional)
                </label>
                <textarea
                id="client_comment"
                name="client_comment"
                value={formData.client_comment}
                onChange={handleClientCommentChange}
                className="block w-full rounded-md border border-gray-400 font-medium py-3 text-sm mt-1"
                placeholder="Tell us about your experience with this product..."
                rows={4}
                ></textarea>
            </div>
            {/* Submit Button for the entire page */}
            <div className="mt-8">
                <Button type="button" onClick={handleFormSubmit} disabled={loadingForm}>
                  {loadingForm ? 'Submitting...' : 'Submit Trade-In Form'}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInFormPage;
