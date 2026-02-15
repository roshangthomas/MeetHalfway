import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

interface QueryProviderProps {
    children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

export { queryClient };
