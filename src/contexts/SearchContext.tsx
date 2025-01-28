import { createContext } from 'react';

interface SearchContextType {
  searchTerm: string;
  handleSearch: (term: string) => void;
}

export const SearchContext = createContext<SearchContextType>({
  searchTerm: '',
  handleSearch: () => {},
}); 