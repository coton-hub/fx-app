import { Database } from './database.ts';

export class EconomicEvent {

    //Attributs
    id:number;
    Date:string;
    Currency:string;
    Impact:string;
    Name:string;
    Actual:string;
    Forecast:string;
    Previous:string;

    //enum
    // Déclaration de l'enum
    // static Impact = Object.freeze({
    //     HIGH: 'HIGH',
    //     MEDIUM: 'MEDIUM',
    //     LOW: 'LOW'
    // });

    //Constructor
    constructor(id:number) {
        this.id = id;
        this.Date = '';
        this.Currency = '';
        this.Impact = '';
        this.Name = '';
        this.Actual = '';
        this.Forecast = '';
        this.Previous = '';
    }

    //Méthodes Public
    public Insert():Promise<number> {

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
                    this.id = (event.target as IDBRequest).result as number;
                    resolve(this.id);
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
    public static GetEvent(id:number):Promise<EconomicEvent> {
        return new Promise<EconomicEvent>(function(resolve, reject) {

            const pdb = Database.OpenDB();
            pdb.then((db) => {
                const tx = db.transaction(Database.DB_STORE_NAME_ECONOMIC_EVENT);
                const req = tx.objectStore(Database.DB_STORE_NAME_ECONOMIC_EVENT).get(id);

                req.onsuccess = function() {
                    resolve(req.result);
                };
                req.onerror = function() {
                    reject(req.error);
                }
            });
        });
    }
    public static DeleteEvent(id:number):Promise<void> {

        return new Promise((resolve, reject) => {
            const pdb = Database.OpenDB();

            pdb.then((db) => {
                const tx = db.transaction(Database.DB_STORE_NAME_ECONOMIC_EVENT, 'readwrite');
                const req = tx.objectStore(Database.DB_STORE_NAME_ECONOMIC_EVENT).delete(id);

                req.onsuccess = () => resolve();
                req.onerror = (event) => reject((event.target as IDBRequest).error)
            });
        })
    }
    public static Update(evt:EconomicEvent):Promise<void> {

        return new Promise<void>((resolve, reject) => {
            
            const data = {
                id:evt.id,
                Date:evt.Date,
                Currency:evt.Currency,
                Impact:evt.Impact,
                Name:evt.Name,
                Actual:evt.Actual,
                Forecast:evt.Forecast,
                Previous:evt.Previous
            }

            var pdb = Database.OpenDB();

            pdb.then((db) => {
                var tx = db.transaction(Database.DB_STORE_NAME_ECONOMIC_EVENT, 'readwrite');
                var req = tx.objectStore(Database.DB_STORE_NAME_ECONOMIC_EVENT).put(data);

                req.onsuccess = () => {
                    resolve();
                }
                req.onerror = () => {
                    reject(req.error);
                }
            })
        });        
    }
}

//Enums
export enum Impact {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}