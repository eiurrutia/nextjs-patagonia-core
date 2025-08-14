import React, { useRef, useEffect } from 'react';

interface AddressData {
  address: string;
  region: string;
  comuna: string;
  place: google.maps.places.PlaceResult;
}

const AddressAutocomplete = ({ onPlaceSelected }: { onPlaceSelected: (data: AddressData) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (!window.google) {
        console.log('Loading Google Maps script:', process.env.GOOGLE_API_KEY);
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        console.log('Google Script:', script.src);
        script.async = true;
        script.onload = () => initAutocomplete();
        document.head.appendChild(script);
      } else {
        initAutocomplete();
      }
    };

    const extractAddressComponents = (place: google.maps.places.PlaceResult): AddressData => {
      console.log('Google Maps Place Result:', place); // Para debugging
      
      let region = '';
      let comuna = '';
      let address = place.formatted_address || '';

      if (place.address_components) {
        place.address_components.forEach(component => {
          const types = component.types;
          
          // Región (administrative_area_level_1)
          if (types.includes('administrative_area_level_1')) {
            region = component.long_name;
          }
          
          // Comuna - priorizar locality primero, luego administrative_area_level_2
          if (types.includes('locality')) {
            comuna = component.long_name;
          } else if (types.includes('administrative_area_level_2') && !comuna) {
            comuna = component.long_name;
          }
        });
      }

      return {
        address,
        region,
        comuna,
        place
      };
    };

    const initAutocomplete = () => {
      if (inputRef.current && window.google) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'CL' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (onPlaceSelected && place) {
            const addressData = extractAddressComponents(place);
            onPlaceSelected(addressData);
          }
        });
      }
    };

    loadGoogleMapsScript();
  }, [onPlaceSelected]);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        className="block w-full rounded-md border border-gray-400 py-3 text-sm font-medium"
      />
    </div>
  );
};

export default AddressAutocomplete;
