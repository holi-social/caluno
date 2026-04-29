import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const Loader = createParamDecorator(
  (loaderClass: any, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const loaders = ctx.getContext().loaders;

    if (!loaders) {
      throw new Error(
        'DataLoader interceptor not configured. Make sure LoaderInterceptor is provided.',
      );
    }

    const loader = loaders[loaderClass.name];

    if (!loader) {
      throw new Error(
        `DataLoader ${loaderClass.name} not found in context. Did you provide it in LoaderInterceptor?`,
      );
    }

    return loader;
  },
);
