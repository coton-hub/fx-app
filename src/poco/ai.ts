
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    }

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

    static async PromptModel(prompt:string, params:{historiqueConvo:string, instructions:string, dateDuJours:string, tableauBanquesCentrales:string, 
        calendrierEconomique:string, donneesRecentes:string/*, resultatsRAG:string*/}) {

        const systemContent = `${params.instructions}

        DATE DU JOUR : ${params.dateDuJours}

        --- TAUX DES BANQUES CENTRALES ---
        ${params.tableauBanquesCentrales}

        --- CALENDRIER ÉCONOMIQUE RÉCENT ---
        ${params.calendrierEconomique}

        --- DONNÉES RÉCENTES DE MA KB ---
        ${params.donneesRecentes}        
        `.trim();

        //Pour l'instant aucune recherche sémantique
        //--- EXTRAITS RELEVÉS (RECHERCHE SÉMANTIQUE / KB) ---
        //${params.resultatsRAG}

        const payloadMessages: ChatMessage[] = [
            // A) Le message système enrichi
            {
                role: 'system',
                content: systemContent
            },
            
            // B) L'historique des conversations précédentes (ex: 4-6 derniers messages)
            //...params.historiqueConversation,

            // C) Le dernier prompt de l'utilisateur
            {
                role: 'user',
                content: prompt
            }
        ];

        const res = await fetch('http://localhost:11434/api/chat', {
            method:'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                model:'gemma4:12b',
                stream:false,
                messages:payloadMessages,
                think:false,
                options: {
                    temperature: 0.2    // Basse température recommandée pour la précision financière
                }
            })
        });
        console.log(payloadMessages);
        if (!res.ok) {
            throw new Error(`Erreur Ollama: ${res.statusText}`);
        }

        const data = await res.json();

        //message.content
        //message.thinking
        return data.message;
    }

}