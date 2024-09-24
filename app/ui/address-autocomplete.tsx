import React, { useRef, useEffect } from 'react';

const AddressAutocomplete = ({ onPlaceSelected }: { onPlaceSelected: (place: google.maps.places.PlaceResult) => void }) => {
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

    const initAutocomplete = () => {
      if (inputRef.current && window.google) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'CL' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (onPlaceSelected) {
            onPlaceSelected(place);
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
        placeholder="Enter your address"
        className="block w-full rounded-md border border-gray-400 py-3 text-sm font-medium"
      />
    </div>
  );
};

export default AddressAutocomplete;
