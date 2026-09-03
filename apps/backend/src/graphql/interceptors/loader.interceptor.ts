import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

export const LOADER_REGISTRY = new Map<string, any>();

export function RegisterLoader() {
  return (target: any) => {
    LOADER_REGISTRY.set(target.name, target);
  };
}

@Injectable()
export class LoaderInterceptor implements NestInterceptor {
  constructor(private readonly moduleRef: ModuleRef) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ctx = GqlExecutionContext.create(context);
    const graphqlContext = ctx.getContext();

    if (!graphqlContext.loaders) {
      graphqlContext.loaders = {};

      for (const [loaderName, LoaderClass] of LOADER_REGISTRY.entries()) {
        try {
          const contextId = ContextIdFactory.getByRequest(
            graphqlContext.req ?? {},
          );
          graphqlContext.loaders[loaderName] = await this.moduleRef.resolve(
            LoaderClass,
            contextId,
            { strict: false },
          );
        } catch (error) {
          console.error(`Failed to resolve loader ${loaderName}:`, error);
        }
      }
    }

    return next.handle();
  }
}
