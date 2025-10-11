import * as React from 'react';

import { cn } from '../../../lib/utils';

export type UnstyledLinkProps = {
  href: string;
  children: React.ReactNode;
  openNewTab?: boolean;
  className?: string;
} & React.ComponentPropsWithRef<'a'>;

const UnstyledLink = React.forwardRef<HTMLAnchorElement, UnstyledLinkProps>(
  ({ children, href, openNewTab, className, ...rest }, ref) => {
    const isNewTab =
      openNewTab !== undefined
        ? openNewTab
        : href && !href.startsWith('/') && !href.startsWith('#');

    if (isNewTab) {
      return (
        <a
          ref={ref}
          target='_blank'
          rel='noopener noreferrer'
          href={href}
          {...rest}
          className={cn('cursor-newtab', className)}
        >
          {children}
        </a>
      );
    }

    return (
      <a ref={ref} href={href} className={className} {...rest}>
        {children}
      </a>
    );
  },
);

export default UnstyledLink;
