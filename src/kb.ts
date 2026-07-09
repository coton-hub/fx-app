import { Database } from './database.ts';
export class KB {

    //Attributs
    Id:number;
    Date:Date;
    Entry:string;
    Commentaire:string;
    Tags:string;
    Pair:string;
    Analyste:string;
    WebSiteUrl:string;

    //Constructeur
    constructor(id:number) {
        this.Id = id;
        this.Date = new Date();
        this.Entry = "";
        this.Commentaire = "";
        this.Tags = "";
        this.Pair = '';
        this.Analyste = "";
        this.WebSiteUrl = "";
    }

    //Méthodes
    public Insert():void {

        const dataToInsert = {
            Date: this.Date,
            Entry: this.Entry,
            Commentaire: this.Commentaire,
            Tags: this.Tags,
            Pair: this.Pair,
            Analyste: this.Analyste,
            WebSiteUrl: this.WebSiteUrl
        };

        const req_db = Database.OpenDB();
        req_db.then((db) => 
        {
            const tx = db.transaction(Database.DB_STORE_NAME_KB, 'readwrite');
            tx.objectStore(Database.DB_STORE_NAME_KB).add(dataToInsert);
        });
    }
}