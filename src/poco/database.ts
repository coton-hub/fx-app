
export class Database {

  // DB Constants
  static DB_NAME = "Mac-Fx";
  static DB_VERSION = 7;
  static DB_STORE_NAME_SETTING = 'setting';
  static DB_STORE_NAME_KB = 'kb';
  static DB_STORE_NAME_ECONOMIC_EVENT = 'economic_event';

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
          () => this.MigrateV4(db),
          () => this.MigrateV4(db),
          () => this.MigrateV5(req)
        ];

        for (let i = old_version; i < migrations.length; i++) {
          migrations[i]();
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
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
  

}
