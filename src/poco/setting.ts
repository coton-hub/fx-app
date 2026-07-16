
import { Database } from './database.ts';

export class Setting {

    //Attributs
    id:number;
    Capital:number;

    //Constructor
    constructor(id:number) {
        this.id = id;
        this.Capital = 0; 
    }
}

export class SettingAI {

    //Attributs
    id:number;
    Instructions:string;

    //Constructor
    constructor(id:number) {
        this.id = id;
        this.Instructions = '';
    }

    //Méthodes static
    static async Update(param:SettingAI) {

        const data = {
            id:param.id,
            Instructions:param.Instructions
        }

        var pdb = Database.OpenDB();
        pdb.then((db) => {
            var tx = db.transaction(Database.DB_STORE_NAME_SETTING_AI, 'readwrite');
            tx.objectStore(Database.DB_STORE_NAME_SETTING_AI).put(data);
        });
    }
    static Get():Promise<SettingAI> {
        return new Promise<SettingAI>((resolve, reject) => {

            var pdb = Database.OpenDB();
            pdb.then((db) => {
                var tx = db.transaction(Database.DB_STORE_NAME_SETTING_AI, 'readonly');
                var req = tx.objectStore(Database.DB_STORE_NAME_SETTING_AI).get(1);

                req.onsuccess = () => {
                    resolve(req.result);
                }
                req.onerror = () => {
                    reject(req.error);
                }
            });
        });
    }
}