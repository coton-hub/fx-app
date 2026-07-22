
export class Database {

  // DB Constants
  static DB_NAME = "Mac-Fx";
  static DB_VERSION = 10;
  static DB_STORE_NAME_SETTING = 'setting';
  static DB_STORE_NAME_KB = 'kb';
  static DB_STORE_NAME_ECONOMIC_EVENT = 'economic_event';
  static DB_STORE_NAME_CENTRAL_BANK = 'central_bank';
  static DB_STORE_NAME_SETTING_AI = 'setting_ai';

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
          () => this.MigrateV3(db),
          () => this.MigrateV4(db),
          () => function() {},
          () => function() {},
          () => this.MigrateV5(req),
          () => this.MigrateV6(db,req),
          () => this.MigrateV7(db),
          () => this.MigrateV8(req)
        ];

        for (let i = old_version; i < migrations.length; i++) {
          migrations[i]();
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  static async ExportDB() {
    const db = await this.OpenDB();

    const exportData: { [storeName: string]: any[] } = {};
    const storeNames = Array.from(db.objectStoreNames);

    // 2. On lit le contenu de CHAQUE table (store)
    for (const storeName of storeNames) {
      exportData[storeName] = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll(); // Récupère tous les records du store

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return exportData;
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
  private static MigrateV4(db:IDBDatabase): void {
    db.createObjectStore(this.DB_STORE_NAME_ECONOMIC_EVENT, {
      keyPath: "id",
      autoIncrement: true
    });
    console.log('Migrated V4');
  }
  private static MigrateV5(req:IDBOpenDBRequest):void {
    req.transaction!.objectStore(this.DB_STORE_NAME_ECONOMIC_EVENT).createIndex('date', 'Date');
    console.log('Migrated V5');
  }
  private static MigrateV6(db:IDBDatabase, req:IDBOpenDBRequest) {
    db.createObjectStore(this.DB_STORE_NAME_CENTRAL_BANK, {
      keyPath: "id",
      autoIncrement:true
    });

    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'AUD', Rate:'0' });
    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'GBP', Rate:'0' });
    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'USD', Rate:'0' });
    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'NZD', Rate:'0' });
    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'EUR', Rate:'0' });
    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'CAD', Rate:'0' });
    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'JPY', Rate:'0' });
    req.transaction!.objectStore(this.DB_STORE_NAME_CENTRAL_BANK).add({ Currency:'CHF', Rate:'0' });

    console.log('Migrated V6');
  }
  private static MigrateV7(db:IDBDatabase) {
    db.createObjectStore(this.DB_STORE_NAME_SETTING_AI, {
      keyPath: "id",
      autoIncrement:true
    });
    console.log('Migrated V7');
  }
  private static MigrateV8(req:IDBOpenDBRequest):void {
    req.transaction!.objectStore(this.DB_STORE_NAME_KB).createIndex('date', 'Date');
    console.log('Migrated V8');
  }
  

}
