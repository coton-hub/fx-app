
export class Trade {
    //Attributs
    Id:number
    Ticket:number;
    OpenTime:Date;
    OrderType:OrderType;
    Lots:number;
    Symbol:string;
    OpenPrice:number;
    SL:number;
    TP:number;
    CloseTime:Date;
    ClosePrice:number;
    Profit:number;
    Commission:number;
    Swap:number;
    Devise:string;

    //Constructeur
    constructor(id:number, ticket:number) {
        this.Id = id;
        this.Ticket = ticket;
        this.OpenTime = new Date();
        this.OrderType = OrderType.buy;
        this.Lots = 0;
        this.Symbol = "";
        this.OpenPrice = 0;
        this.SL = 0;
        this.TP = 0;
        this.CloseTime = new Date();
        this.ClosePrice = 0;
        this.Profit = 0;
        this.Commission = 0;
        this.Swap = 0;
        this.Devise = "";
    }    
}

//Enums
export enum OrderType {
    buy = 0,
    sell,
    buylimit,
    selllimit,
    buystop,
    sellstop,
}