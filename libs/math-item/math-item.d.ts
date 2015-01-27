declare module FlorianMath {
    class Promise<T> {
        constructor(callback: (resolve: (val?: T) => void, reject?: (reason: any) => void) => void);
        then(resolved: (val?: T) => void, rejected?: (reason: any) => void): Promise<any>;
        static resolve<T>(val?: T): Promise<T>;
        static reject(reason?: any): Promise<void>;
        static all(promises: Promise<any>[]): Promise<any[]>;
    }
}
declare module FlorianMath {
    interface Iterator<T, TResult> {
        (arg1: T, arg2: any, arg3: any): TResult;
    }
    interface ListIterator<T, TResult> extends Iterator<T, TResult> {
        (value: T, index: number, list: T[]): TResult;
    }
    interface ObjectIterator<T, TResult> extends Iterator<T, TResult> {
        (element: T, key: string, list: any): TResult;
    }
    interface Collection<T> {
    }
    interface List<T> extends Collection<T> {
        [index: number]: T;
        length: number;
    }
    interface Dictionary<T> extends Collection<T> {
        [index: string]: T;
    }
    interface PromiseWithResolve<T> extends Promise<T> {
        resolve(val?: T): void;
    }
    interface IUtils {
        common: {
            each<T>(list: List<T>, iterator: ListIterator<T, void>, context?: any): List<T>;
            each<T>(object: Dictionary<T>, iterator: ObjectIterator<T, void>, context?: any): Dictionary<T>;
            map<T, TResult>(list: List<T>, iterator: ListIterator<T, TResult>, context?: any): TResult[];
            map<T, TResult>(object: Dictionary<T>, iterator: ObjectIterator<T, TResult>, context?: any): TResult[];
            filter<T>(list: List<T>, iterator: ListIterator<T, boolean>, context?: any): T[];
            filter<T>(object: Dictionary<T>, iterator: ObjectIterator<T, boolean>, context?: any): T[];
            indexOf<T>(list: T[], item: T): number;
            contains<T>(list: List<T>, item: T): boolean;
            isArray(obj: any): boolean;
            toArray<T>(list: List<T>): T[];
            trim(st: string): string;
            words(st: string): string[];
        };
        makePromiseWithResolve<T>(): PromiseWithResolve<T>;
    }
    var _utils: IUtils;
}
declare module FlorianMath {
    interface IUtils {
        dom: {
            addEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void): void;
            ready(): Promise<void>;
            async(fn: () => void): void;
            getNodeChildren(n: Node, filter?: (n: Node) => boolean): Node[];
            getElementChildren(n: Node): Element[];
        };
    }
}
declare module FlorianMath {
    interface IUtils {
        xml: {
            parseXML(data: string): Document;
            prettifyMathML(el: Element): string;
        };
    }
}
interface Document {
    registerElement(tagName: string, options: any): void;
}
declare module FlorianMath {
    interface MarkupData {
        type: string;
        subtype?: string;
        markup: string;
    }
    interface HTMLMathItemElement extends HTMLElement {
        rendered(): Promise<void>;
        getMarkup?(): Promise<MarkupData[]>;
        clonePresentation?(dest: HTMLElement): Promise<void>;
    }
    class Handler {
        ready(el: HTMLMathItemElement): void;
        canHandle(el: HTMLElement): boolean;
    }
    function registerHandler(type: string, handler: Handler): Handler;
    var container: HTMLMathItemElement[];
    function addMathItem(el: HTMLElement): void;
    function removeMathItem(el: HTMLElement): void;
}
declare module FlorianMath {
}
declare module FlorianMath {
}
declare module FlorianMath {
}
