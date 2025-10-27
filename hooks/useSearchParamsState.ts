"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Custom hook for managing URL search params with ease
 * Provides methods to set, remove, and update multiple params at once
 */
export function useSearchParamsState() {
    const router = useRouter();
    const searchParams = useSearchParams();

    /**
     * Get a search param value
     */
    const getParam = (key: string): string | null => {
        return searchParams.get(key);
    };

    /**
     * Set a single search param
     */
    const setParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        router.push(`?${params.toString()}`);
    };

    /**
     * Remove a single search param
     */
    const removeParam = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        const paramString = params.toString();
        router.push(paramString ? `?${paramString}` : window.location.pathname);
    };

    /**
     * Set multiple search params at once
     */
    const setParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            params.set(key, value);
        });
        router.push(`?${params.toString()}`);
    };

    /**
     * Remove multiple search params at once
     */
    const removeParams = (keys: string[]) => {
        const params = new URLSearchParams(searchParams.toString());
        keys.forEach((key) => params.delete(key));
        const paramString = params.toString();
        router.push(paramString ? `?${paramString}` : window.location.pathname);
    };

    /**
     * Update params (set some, remove others) in a single operation
     */
    const updateParams = (updates: { set?: Record<string, string>; remove?: string[] }) => {
        const params = new URLSearchParams(searchParams.toString());

        // Remove params first
        if (updates.remove) {
            updates.remove.forEach((key) => params.delete(key));
        }

        // Then set new values
        if (updates.set) {
            Object.entries(updates.set).forEach(([key, value]) => {
                params.set(key, value);
            });
        }

        const paramString = params.toString();
        router.push(paramString ? `?${paramString}` : window.location.pathname);
    };

    /**
     * Clear all search params
     */
    const clearParams = () => {
        router.push(window.location.pathname);
    };

    /**
     * Get all params as an object
     */
    const getAllParams = (): Record<string, string> => {
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return params;
    };

    return {
        // Getters
        getParam,
        getAllParams,

        // Single param operations
        setParam,
        removeParam,

        // Multiple param operations
        setParams,
        removeParams,
        updateParams,

        // Clear all
        clearParams,
    };
}
