'use client';
import { useState, useRef, useEffect } from 'react';
import { SimilarImage } from '@/app/lib/definitions';
import { Button } from '@/app/ui/button';
import TradeInForm from '@/app/ui/trade-in/trade-in-form';
import AddressAutocomplete from '@/app/ui/address-autocomplete';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const ImageUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [selectedItemColor, setSelectedItemColor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [itemColorSuggestions, setItemColorSuggestions] = useState<{ itemColor: string, imageSrc: string }[]>([]);
  const [matchedImageUrl, setMatchedImageUrl] = useState<string | null>(null);
  const [isImageSectionCollapsed, setImageSectionCollapsed] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [houseDetails, setHouseDetails] = useState<string>('');
  const firstNameInputRef = useRef<HTMLInputElement>(null);

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
      console.error('Error fetching ITEM_COLOR and IMAGE_SRC suggestions:', error);
    }
  };

  // Fetch the image if ITEM_COLOR matches by looking up the suggestion list
  const fetchItemColorMatch = (itemColor: string) => {
    const match = itemColorSuggestions.find(item => item.itemColor === itemColor);
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
      setPreviewUrl(URL.createObjectURL(selectedFile)); // Generate preview URL for image
      setSimilarImages([]); // Reset similar images on new upload
      setProcessing(false); // Reset form visibility until image is processed
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

  const handleFormSubmit = (formData: any) => {
    console.log('Form data submitted:', formData);
    // You can send form data to the backend here
  };

  // Handle image selection and update ITEM_COLOR field
  const handleImageSelect = (itemColor: string) => {
    setSelectedItemColor(itemColor);
    fetchItemColorMatch(itemColor); // Fetch the image if ITEM_COLOR matches
    setImageSectionCollapsed(true); // Collapse the image upload section when an image is selected
  };

  // Handle manual typing in the ITEM_COLOR field
  const handleItemColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedItemColor(value);
    if (value.length > 0) {
      fetchItemColorMatch(value); // Trigger match check when typing
    } else {
      setMatchedImageUrl(null); // Clear the image if input is cleared
    }
  };

  // Handle address selection from Google Maps Autocomplete
  const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
    if (place.formatted_address) {
      setAddress(place.formatted_address); // Save the selected address in state
    }
  };

  const handleHouseDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHouseDetails(e.target.value); // Save optional house details
  };

  // Focus on first name field after the form is shown
  useEffect(() => {
    if (processing && firstNameInputRef.current) {
      firstNameInputRef.current.focus(); // Set focus on first name
    }
  }, [processing]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h1 className="text-4xl font-bold mb-8">Trade - In</h1>
      <div className="flex w-full max-w-5xl gap-8">
        {/* Left section: Image upload and similar products */}
        <div className="w-1/2">
          <div className="mb-4 flex items-center cursor-pointer" onClick={toggleImageSection}>
            {isImageSectionCollapsed ? <ChevronRightIcon className="h-6 w-6 text-gray-600" /> : <ChevronDownIcon className="h-6 w-6 text-gray-600" />}
            <h2 className="text-xl font-medium ml-2">Load your product image</h2>
          </div>

          {/* Collapsible Image Upload Section */}
          {!isImageSectionCollapsed && (
            <div className="rounded-md bg-gray-50 p-4 md:p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="image" className="mb-2 block text-sm font-medium">
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
                    <img src={previewUrl} alt="Image Preview" className="w-32 h-32 object-cover mt-2" />
                  </div>
                )}

                {loading && <p className="text-sm text-gray-600">Processing image...</p>}
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
                        className={`flex flex-col items-center cursor-pointer p-2 border rounded-md ${selectedItemColor === image.item_color ? 'border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleImageSelect(image.item_color)}
                      >
                        <img
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

          {/* ITEM_COLOR Field (always visible on the left side) */}
          <div className="rounded-md bg-gray-50 p-4 md:p-6 mt-8">
            <label htmlFor="itemColor" className="block text-lg font-bold mb-2">
              Product Code (ITEM_COLOR)
            </label>
            <input
              type="text"
              id="itemColor"
              name="itemColor"
              value={selectedItemColor}
              onChange={handleItemColorChange}
              className="block w-full rounded-md border border-gray-400 py-3 text-lg"
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
                <img src={matchedImageUrl} alt="Matched Product" className="w-48 h-48 object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Right section: TradeIn form */}
        <div className="w-1/2">
          {processing && (
            <>
              <TradeInForm
                onSubmit={handleFormSubmit}
                firstNameRef={firstNameInputRef}
              />

              {/* Address Autocomplete Field */}
              <div className="rounded-md bg-gray-50 p-4 md:p-6 mt-8">
                <label htmlFor="address" className="block text-sm font-medium font-bold mb-2">
                  Address
                </label>
                <AddressAutocomplete onPlaceSelected={handleAddressSelect} />

                <input
                  type="text"
                  id="houseDetails"
                  name="houseDetails"
                  value={houseDetails}
                  onChange={handleHouseDetailsChange}
                  className="block w-full rounded-md border border-gray-400 font-medium py-3 text-sm mt-4"
                  placeholder="House number, apto, etc. (optional)"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Submit Button for the entire page */}
      <div className="mt-8">
        <Button type="submit" onClick={() => console.log('Submit the entire form')}>
          Submit Trade-In Form
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;
