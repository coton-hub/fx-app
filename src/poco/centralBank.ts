
import { Database } from './database.ts';

export class CentralBank {

    //Attributs
    id:number;
    Currency:string;
    Rate:string;

    //constructor
    constructor(id:number) {
        this.id = id;
        this.Currency = '';
        this.Rate = '';
    }

    //Méthodes Static
    static GetAll():Promise<CentralBank[]> {
        return new Promise<CentralBank[]>((resolve, reject) => {

            const pdb = Database.OpenDB();
            pdb.then((db) => {
                const tx = db.transaction(Database.DB_STORE_NAME_CENTRAL_BANK);
                const req = tx.objectStore(Database.DB_STORE_NAME_CENTRAL_BANK).getAll();

                req.onsuccess = () => {
                    resolve(req.result);
                };
                req.onerror = () => {
                    reject(req.error);
                }
            });
        });
    }
    static async Update(rate:CentralBank) {
        return new Promise<void>((resolve, reject) => {
                const data = {
                id:rate.id,
                Currency:rate.Currency,
                Rate:rate.Rate
            }

            const pdb = Database.OpenDB();
            pdb.then((db) => {
                const tx = db.transaction(Database.DB_STORE_NAME_CENTRAL_BANK, 'readwrite');
                const req = tx.objectStore(Database.DB_STORE_NAME_CENTRAL_BANK).put(data);

                req.onsuccess = () => {
                    resolve();
                }
                req.onerror = () => {
                    reject(req.error);
                }
            });
        });        
    }
}