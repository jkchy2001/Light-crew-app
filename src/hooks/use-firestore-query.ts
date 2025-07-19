
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onSnapshot, Query, DocumentData, queryEqual } from 'firebase/firestore';

export function useFirestoreQuery<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const queryRef = useRef<Query<DocumentData> | null>(query);

  // Memoize the query to prevent re-renders unless the query itself actually changes
  const memoizedQuery = useMemo(() => {
    if (!query) return null;
    if (queryRef.current && queryEqual(queryRef.current, query)) {
      return queryRef.current;
    }
    queryRef.current = query;
    return query;
  }, [query]);

  const fetchData = useCallback(() => {
    if (!memoizedQuery) {
      setData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const unsubscribe = onSnapshot(
      memoizedQuery,
      (querySnapshot) => {
        const results: T[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
        setError(err);
        setData([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);
  
  useEffect(() => {
    return fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
