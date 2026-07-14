import { Database } from './database.ts';

export class EconomicEvent {

    //Attributs
    Id:number;
    Date:string;
    Currency:string;
    Impact:string;
    Name:string;
    Actual:string;
    Forecast:string;
    Previous:string;

    //enum
    // Déclaration de l'enum
    static Impact = Object.freeze({
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW'
    });

    //Constructor
    constructor(id:number) {
        this.Id = id;
        this.Date = '';
        this.Currency = '';
        this.Impact = '';
        this.Name = '';
        this.Actual = '';
        this.Forecast = '';
        this.Previous = '';
    }

    //Méthodes Public
    public async Insert():Promise<number> {

        return new Promise<number>((resolve, reject) => {
            
            const dataToInsert = {
                Date:this.Date,
                Currency:this.Currency,
                Impact:this.Impact,
                Name:this.Name,
                Actual:this.Actual,
                Forecast:this.Forecast,
                Previous:this.Previous
            }

            var pdb = Database.OpenDB();

            pdb.then((db) => {
                var tx = db.transaction(Database.DB_STORE_NAME_ECONOMIC_EVENT, 'readwrite');
                var req = tx.objectStore(Database.DB_STORE_NAME_ECONOMIC_EVENT).add(dataToInsert);

                req.onsuccess = (event) => {
                    this.Id = (event.target as IDBRequest).result as number;
                    resolve(this.Id);
                }
                req.onerror = (event) => {
                    reject((event.target as IDBRequest).error);
                }
            })
        });        
    }

    //Méthodes Static
    public static GetAllEvents(from:string, to:string):Promise<EconomicEvent[]> {
        return new Promise<EconomicEvent[]>((resolve, reject) => {
            const pdb = Database.OpenDB();
            pdb.then((db) => {
                const tx = db.transaction(Database.DB_STORE_NAME_ECONOMIC_EVENT, 'readonly');
                const store = tx.objectStore(Database.DB_STORE_NAME_ECONOMIC_EVENT);

                const index = store.index('date');
                const range = IDBKeyRange.bound(from,to);

                const req = index.getAll(range);
                req.onsuccess = function() {
                    resolve(req.result);
                };
                req.onerror = function() {
                    reject(req.error);
                }
            });            
        });
    }
}