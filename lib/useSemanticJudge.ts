import { useState, useCallback, useRef, useEffect } from 'react';

export function useSemanticJudge() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Record<string, Function>>({});
  const fileProgress = useRef<Record<string, { loaded: number, total: number }>>({});

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./worker.ts', import.meta.url));
      workerRef.current.addEventListener('message', (event) => {
        const { id, type, data, similarity, error } = event.data;
        
        if (type === 'progress') {
          if (data.status === 'initiate' || data.status === 'progress') {
            fileProgress.current[data.file] = { loaded: data.loaded || 0, total: data.total || 0 };
            
            let totalLoaded = 0;
            let totalSize = 0;
            Object.values(fileProgress.current).forEach(f => {
              totalLoaded += f.loaded;
              totalSize += f.total;
            });
            
            if (totalSize > 0) {
              setProgress(Math.round((totalLoaded / totalSize) * 100));
            }
          } else if (data.status === 'done') {
            fileProgress.current[data.file] = { loaded: data.total || 0, total: data.total || 0 };
          }
        } else if (type === 'ready') {
          setIsReady(true);
          setIsLoading(false);
          if (callbacksRef.current[id]) {
            callbacksRef.current[id]();
            delete callbacksRef.current[id];
          }
        } else if (type === 'result') {
          if (callbacksRef.current[id]) {
            callbacksRef.current[id](similarity);
            delete callbacksRef.current[id];
          }
        } else if (type === 'error') {
          console.error("Worker error:", error);
          setIsLoading(false);
          if (callbacksRef.current[id]) {
            callbacksRef.current[id](0);
            delete callbacksRef.current[id];
          }
        }
      });
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const initModel = useCallback(() => {
    if (isReady || isLoading || !workerRef.current) return;
    setIsLoading(true);
    
    const id = Date.now().toString();
    return new Promise<void>((resolve) => {
      callbacksRef.current[id] = resolve;
      workerRef.current!.postMessage({ id, type: 'init' });
    });
  }, [isReady, isLoading]);

  const evaluateSimilarity = useCallback(async (text1: string, text2: string): Promise<number> => {
    if (!workerRef.current) return 0;
    
    if (!isReady) {
      await initModel();
    }
    
    const id = Date.now().toString() + Math.random().toString();
    return new Promise<number>((resolve) => {
      callbacksRef.current[id] = resolve;
      workerRef.current!.postMessage({ id, type: 'evaluate', text1, text2 });
    });
  }, [isReady, initModel]);

  return { initModel, evaluateSimilarity, isReady, isLoading, progress };
}
