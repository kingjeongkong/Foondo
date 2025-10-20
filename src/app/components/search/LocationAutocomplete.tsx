'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { MapboxSearchResult, searchLocations } from '@/lib/mapbox';
import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface LocationAutocompleteProps {
  onSelect: (
    location: { city: string; country: string; location_id: string } | null
  ) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Mapbox API를 사용한 도시 자동완성 컴포넌트
 * @param {Function} onSelect - 도시 선택 시 호출되는 콜백
 * @param {string} error - 에러 메시지
 * @param {boolean} disabled - 비활성화 상태
 */
export default function LocationAutocomplete({
  onSelect,
  error,
  disabled = false,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isSuggestionClicked = useRef(false);

  // 검색 디바운싱 (400ms)
  useEffect(() => {
    // 클릭으로 인한 업데이트라면 API 호출을 건너뜀
    if (isSuggestionClicked.current) {
      isSuggestionClicked.current = false;
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const results = await searchLocations(inputValue);
        setSuggestions(results);
      } catch (error) {
        console.error('도시 검색 중 오류 발생:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const handleSuggestionClick = (suggestion: MapboxSearchResult) => {
    const city = suggestion.text;
    const country =
      suggestion.context?.find((c) => c.id.startsWith('country'))?.text || '';

    onSelect({
      city,
      country,
      location_id: suggestion.id,
    });

    // setInputValue를 호출하기 전에 플래그를 true로 설정
    isSuggestionClicked.current = true;
    setInputValue(suggestion.place_name);
    setIsOpen(false); // Command 리스트 닫기
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // 입력값이 2글자 이상이면 리스트 열기
    if (value.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }

    if (value.trim() === '') {
      onSelect(null);
    }
  };

  return (
    <div className="relative">
      <Command className="food-selection">
        <CommandInput
          placeholder="Search for a city..."
          value={inputValue}
          onValueChange={handleInputChange}
          disabled={disabled}
          className={`${error ? 'ring-2 ring-red-500' : ''} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {isOpen && (
          <CommandList>
            {isLoading ? (
              <div className="px-4 py-3 text-center text-gray-500">
                <div className="w-5 h-5 border-2 border-warm-taste/20 border-t-warm-taste rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-sm">Searching for cities...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    value={suggestion.place_name}
                    onSelect={() => handleSuggestionClick(suggestion)}
                    className="flex items-start space-x-3"
                  >
                    <MapPin className="w-4 h-4 text-warm-taste mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.text}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {suggestion.place_name}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : inputValue.trim().length >= 2 ? (
              <CommandEmpty>
                <div className="text-center text-gray-500 text-sm">
                  <span className="text-2xl mb-2 block">🔍</span>
                  <span>No results found</span>
                </div>
              </CommandEmpty>
            ) : null}
          </CommandList>
        )}
      </Command>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
