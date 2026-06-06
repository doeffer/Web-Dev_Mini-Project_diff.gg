import { createContext, useContext, useState } from 'react';

const SearchContext = createContext({
  hasSearched: false,
  setHasSearched: () => {},
  lastPlatform: 'euw1',
  setLastPlatform: () => {},
});

export function SearchProvider({ children }) {
  const [hasSearched,  setHasSearched]  = useState(false);
  const [lastPlatform, setLastPlatform] = useState('euw1');
  return (
    <SearchContext.Provider value={{ hasSearched, setHasSearched, lastPlatform, setLastPlatform }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  return useContext(SearchContext);
}
