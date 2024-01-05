/**
* StringFormatter
*
* A class for formatting strings with placeholders.
*
* @author DScudeler
* @version 0.0.2
*/
export class StringFormatter {
  /**
  * The format string.
  */
  private _format: string;
/**
* The arguments for the format string.
*/
  private _args: { [key: string]: any };

/**
* Constructs a new StringFormatter instance.
*
* @param format The format string.
* @param args The arguments for the format string.
*/
  constructor(format: string, args: any) {
    this._format = format;
    this._args = args;
  }

/**
* Formats the string with the given arguments.
*
* @returns The formatted string.
*/
  format(): string {
    return this._format.replace(/{(\w+)}/g, (match, key) => {
      return this._args[key];
    });
  }
}
