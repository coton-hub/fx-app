import { KB } from "./kb";

export class Database {

  // DB Constants
  static DB_NAME = "Mac-Fx";
  static DB_VERSION = 3;
  static DB_STORE_NAME_SETTING = 'setting';
  static DB_STORE_NAME_KB = 'kb';

  //Static Functions
  static OpenDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = req.result;
        const old_version = event.oldVersion;

        const migrations = [
          () => this.MigrateV1(db),
          () => this.MigrateV2(req),
          () => this.MigrateV3(db)
        ];

        for (let i = old_version; i < migrations.length; i++) {
          migrations[i]();
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  static GetAllKBEntries(): Promise<KB[]> {
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

  //Private Functions
  private static MigrateV1(db: IDBDatabase): void {
    db.createObjectStore(this.DB_STORE_NAME_SETTING, {
      keyPath: "id",
      autoIncrement: true
    });
    console.log('Migrated V1');
  }
  private static MigrateV2(request: IDBOpenDBRequest): void {
    request.transaction!.objectStore(this.DB_STORE_NAME_SETTING).add({ capital: 0 });
    console.log('Migrated V2');
  }
  private static MigrateV3(db: IDBDatabase): void {
    db.createObjectStore(this.DB_STORE_NAME_KB, {
      keyPath: "id",
      autoIncrement: true
    });
    console.log('Migrated V3');
  }

}
