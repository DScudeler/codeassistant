export class StringFormatter {
    private _format: string;
    private _args: { [key: string]: any };
  
    constructor(format: string, ...args: any[]) {
      this._format = format;
      this._args = {};
      for (let i = 0; i < args.length; i++) {
        const keys = Object.keys(args[i]);
        const values = Object.values(args[i]);
        this._args[keys[0]] = values[0];
      }
    }
  
    format(): string {
      return this._format.replace(/{(\w+)}/g, (match, key) => {
        return this._args[key];
      });
    }
  }
