
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LanguageAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const commonLanguages = [
  'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'C', 'PHP', 'Ruby', 'Go',
  'Swift', 'Kotlin', 'Rust', 'HTML', 'CSS', 'SQL', 'R', 'MATLAB', 'Scala', 'Perl',
  'Dart', 'Objective-C', 'Assembly', 'VB.NET', 'Haskell', 'Lua', 'Groovy', 'PowerShell'
];

const LanguageAutocomplete: React.FC<LanguageAutocompleteProps> = ({ value, onChange, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    if (inputValue.length > 0) {
      const filtered = commonLanguages.filter(lang =>
        lang.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredLanguages(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (language: string) => {
    onChange(language);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder || "Type programming language..."}
        onFocus={() => {
          if (value.length > 0) {
            const filtered = commonLanguages.filter(lang =>
              lang.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredLanguages(filtered);
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          // Delay hiding suggestions to allow clicking
          setTimeout(() => setShowSuggestions(false), 200);
        }}
      />
      
      {showSuggestions && filteredLanguages.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredLanguages.slice(0, 8).map((language) => (
            <button
              key={language}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => handleSuggestionClick(language)}
            >
              {language}
            </button>
          ))}
        </div>
      )}
      
      {/* Show popular languages when input is empty */}
      {value.length === 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-2">Popular languages:</p>
          <div className="flex flex-wrap gap-1">
            {commonLanguages.slice(0, 10).map((language) => (
              <Badge
                key={language}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => onChange(language)}
              >
                {language}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageAutocomplete;
