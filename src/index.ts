type Handler<Result> = (params: PathParams) => Result;
type NoSlash = string extends `${infer _Before}/${infer _After}` ? never : string;
type Method = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
type PathParams = {
  path: string;
  [key: string]: string;
};
type StaticChildren<Result> = {
  [key: NoSlash]: RNode<Result>
};
type MethodHandlers<Result> = {
  [key: string]: Handler<Result>
};
type Context<Result> = {
  error: Handler<Result>
}

export class RNode<Result> {
  private readonly staticChildren: StaticChildren<Result>;
  private paramChild?: {
    node: RNode<Result>
    param: string
  };
  private readonly handlerByMethod: MethodHandlers<Result>;

  constructor() {
    this.handlerByMethod = {};
    this.staticChildren = {};
  }

  on(path: NoSlash): RNode<Result> {
    const node = new RNode<Result>();
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

  method(method: Method, handler: Handler<Result>): void {
    this.handlerByMethod[method] = handler;
  }

  route(path: Array<NoSlash>, position: number, params: PathParams, ctx: Context<Result>): Result {
    const segment = path[position];
    if (path.length === position - 1) {
      return this.handlerByMethod[segment](params) ?? ctx.error(params);
    } else if (this.paramChild) {
      params[this.paramChild.param] = segment;
      return this.paramChild.node.route(path, position + 1, params, ctx);
    } else {
      return this.staticChildren[segment]?.route(path, position + 1, params, ctx) ?? ctx.error(params);
    }
  }
}

export class Router<Result> {
  private readonly errorHandler: Handler<Result>;
  private readonly root: RNode<Result>;

  constructor(err: Handler<Result>) {
    this.errorHandler = err;
    this.root = new RNode<Result>();
  }

  route(path: string, method: Method) {
    const segments = path.split('/');
    segments.push(method);
    return this.root.route(segments, 0, { path }, { error: this.errorHandler });
  }

  buildApi() {
    return this.root;
  }
}

export function registerRouter<Result>(err: Handler<Result>) {
  return new Router<Result>(err);
}
