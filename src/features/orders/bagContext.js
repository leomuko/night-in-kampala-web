import { createContext, useContext } from 'react';

export const BagContext = createContext(null);
export function useBag() { return useContext(BagContext); }
