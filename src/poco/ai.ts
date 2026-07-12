
export class AI {

    static async GenerateEmbedding(text: string): Promise<Float32Array> {

        return new Promise<Float32Array>(async (resolve, reject) => {

            const response = await fetch('http://localhost:11434/api/embeddings', {
                method: 'POST',
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: text
                })
            });
            
            if (!response.ok) {
                reject(new Error(`Erreur lors de la génération de l'embedding: ${response.statusText}`));
                return;
            }

            const data = await response.json();
            resolve(new Float32Array(data.embedding));
        });
    }

}