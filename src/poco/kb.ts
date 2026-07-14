import { Database } from './database.ts';
export class KB {

    //Attributs
    Id:number;
    Date:Date;
    Entry:string;
    Comment:string;
    Tags:string;
    Embedding:Float32Array | null;
    Currency:string;
    Analyst:string;
    WebSiteUrl:string;

    //Constructeur
    constructor(id:number) {
        this.Id = id;
        this.Date = new Date();
        this.Entry = "";
        this.Comment = "";
        this.Tags = "";
        this.Embedding = null;
        this.Currency = '';
        this.Analyst = "";
        this.WebSiteUrl = "";
    }

    //Méthodes    
    public Insert():Promise<number> {

        return new Promise<number>((resolve, reject) => {

            const dataToInsert = {
                Date: this.Date,
                Entry: this.Entry,
                Comment: this.Comment,
                Tags: this.Tags,
                Currency: this.Currency,
                Analyst: this.Analyst,
                WebSiteUrl: this.WebSiteUrl
            };

            const pdb = Database.OpenDB();
            pdb.then((db) => 
            {
                const tx = db.transaction(Database.DB_STORE_NAME_KB, 'readwrite');
                var req = tx.objectStore(Database.DB_STORE_NAME_KB).add(dataToInsert);

                req.onsuccess = (event) => {
                    this.Id = (event.target as IDBRequest).result as number;
                    resolve(this.Id);
                }
                req.onerror = (event) => {
                    reject((event.target as IDBRequest).error);
                }
            });

        });
    }
    public UpdateEmbedding():void {

        const pdb = Database.OpenDB();
        pdb.then((db) => 
        {
            const dataToUpdate = {
                id: this.Id,
                Date: this.Date,
                Entry: this.Entry,
                Comment: this.Comment,
                Tags: this.Tags,
                Currency: this.Currency,
                Analyst: this.Analyst,
                WebSiteUrl: this.WebSiteUrl,
                Embedding: this.Embedding ? new Float32Array(this.Embedding) : null
            };
            const tx = db.transaction(Database.DB_STORE_NAME_KB, 'readwrite');
            tx.objectStore(Database.DB_STORE_NAME_KB).put(dataToUpdate);
        });
    }
    public GetTextToEmbed():string {

        // 🌟 RÈGLE NOMIC : On commence obligatoirement par "search_document: "
        var texte = `search_document: Fundamental/Technical analysis date: ${this.Date.toISOString().split('T')[0]}.\n`;
        texte += `${this.Entry}\n`;

        if (this.Comment && this.Comment.trim()) texte += `Comment: ${this.Comment.trim()}.\n`;
        if (this.Tags && this.Tags.trim()) texte += `Keywords and assets: ${this.Tags.trim()}.\n`;
        if (this.Currency && this.Currency.trim()) texte += `The currency or currency pair discussed is ${this.Currency.trim()}.\n`;
        if (this.Analyst && this.Analyst.trim()) texte += `Analyst perspective by ${this.Analyst.trim()}.\n`;
        if (this.WebSiteUrl && this.WebSiteUrl.trim()) texte += `Source: ${this.WebSiteUrl.trim()}`;

        return texte;
    }

    //Méthodes Static
    public static DeleteKbEntry(id:number):Promise<void> {

        return new Promise((resolve, reject) => {
            const pdb = Database.OpenDB();

            pdb.then((db) => {
                const tx = db.transaction(Database.DB_STORE_NAME_KB, 'readwrite');
                const req = tx.objectStore(Database.DB_STORE_NAME_KB).delete(id);

                req.onsuccess = () => resolve();
                req.onerror = (event) => reject((event.target as IDBRequest).error)
            });
        })
    }
    public static GetAllKBEntries(): Promise<KB[]> {
        return new Promise<KB[]>((resolve, reject) => {

        const pdb = Database.OpenDB();
        pdb.then((db) => {

            const tx = db.transaction(Database.DB_STORE_NAME_KB, 'readonly');
            const store = tx.objectStore(Database.DB_STORE_NAME_KB);
            const req = store.getAll();

            req.onsuccess = () => {
            const entries: KB[] = req.result.map((entry: any) => {
                const kbEntry = new KB(entry.id);
                kbEntry.Date = new Date(entry.Date);
                kbEntry.Entry = entry.Entry;
                kbEntry.Comment = entry.Comment;
                kbEntry.Tags = entry.Tags;
                kbEntry.Currency = entry.Currency;
                kbEntry.Analyst = entry.Analyst;
                kbEntry.WebSiteUrl = entry.WebSiteUrl;
                kbEntry.Embedding = entry.Embedding;
                return kbEntry;
            });
            resolve(entries);
            };

            req.onerror = () => reject(req.error);
        });
        });
    }
}