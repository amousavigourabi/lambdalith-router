type Handler<Event, Result> = (pathParams: PathParams, event: Event) => Result;
type ErrorHandler<Event, Result> = (event: Event) => Result;
type NoSlash = string extends `${infer _Before}/${infer _After}` ? never : string;
type Method = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
type PathParams = Record<string, string>;
type StaticChildren<Event, Result> = Record<NoSlash, RNode<Event, Result>>;
type MethodHandlers<Event, Result> = Record<string, Handler<Event, Result>>;
type Context<Event, Result> = {
  error: ErrorHandler<Event, Result>,
};

export class RNode<Event, Result> {
  private readonly staticChildren: StaticChildren<Event, Result>;
  private paramChild?: {
    node: RNode<Event, Result>
    param: string
  };
  private readonly handlerByMethod: MethodHandlers<Event, Result>;

  constructor() {
    this.handlerByMethod = {};
    this.staticChildren = {};
  }

  public on(path: NoSlash): RNode<Event, Result> {
    const node = new RNode<Event, Result>();
    if (path[0] === ':') {
      const param = path.slice(1);
      this.paramChild = {
        node,
        param,
      };
    } else {
      this.staticChildren[path] = node;
    }
    return node;
  }

  public method(method: Method, handler: Handler<Event, Result>): void {
    this.handlerByMethod[method] = handler;
  }

  _route(path: Array<NoSlash>, position: number, params: PathParams, event: Event, ctx: Context<Event, Result>): Result {
    const segment = path[position];
    if (path.length === position - 1) {
      return this.handlerByMethod[segment](params, event) ?? ctx.error(event);
    } else if (this.paramChild) {
      params[this.paramChild.param] = segment;
      return this.paramChild.node._route(path, position + 1, params, event, ctx);
    } else {
      return this.staticChildren[segment]?._route(path, position + 1, params, event, ctx) ?? ctx.error(event);
    }
  }
}

export class Router<Event, Result> {
  private readonly errorHandler: ErrorHandler<Event, Result>;
  private readonly root: RNode<Event, Result>;

  constructor(notFound: ErrorHandler<Event, Result>) {
    this.errorHandler = notFound;
    this.root = new RNode<Event, Result>();
  }

  public route(path: string, method: Method, event: Event): Result {
    const start = path[0] === '/' ? 1 : 0;
    const end = path[path.length - 1] === '/' ? -1 : path.length;
    const segments = path.slice(start, end).split('/');
    segments.push(method);
    return this.root._route(segments, 0, {}, event, { error: this.errorHandler });
  }

  public buildApi(): RNode<Event, Result> {
    return this.root;
  }
}

export function registerRouter<Event, Result>(err: ErrorHandler<Event, Result>): Router<Event, Result> {
  return new Router<Event, Result>(err);
}
