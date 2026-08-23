// @ts-ignore
import { pipeline, env } from '@xenova/transformers/dist/transformers.js';

// Skip local model check
env.allowLocalModels = false;

class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any = null;

    static async getInstance(progress_callback: Function) {
        if (this.instance === null) {
            this.instance = pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
    const { id, type, text1, text2 } = event.data;

    try {
        if (type === 'init') {
            await PipelineSingleton.getInstance((x: any) => {
                self.postMessage({ id, type: 'progress', data: x });
            });
            self.postMessage({ id, type: 'ready' });
            return;
        }

        if (type === 'evaluate') {
            let extractor = await PipelineSingleton.getInstance((x: any) => {});
            const out1 = await extractor(text1, { pooling: 'mean', normalize: true });
            const out2 = await extractor(text2, { pooling: 'mean', normalize: true });

            let similarity = 0;
            for (let i = 0; i < out1.data.length; i++) {
                similarity += out1.data[i] * out2.data[i];
            }

            self.postMessage({ id, type: 'result', similarity });
        }
    } catch (e: any) {
        self.postMessage({ id, type: 'error', error: e.message });
    }
});
