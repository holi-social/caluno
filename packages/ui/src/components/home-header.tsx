'use client';

import { BellIcon, UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './base/avatar';
import { Logo } from './logo';

export type HomeHeaderVariant = 'open' | 'on-scroll';

export interface HomeHeaderProps {
  variant?: HomeHeaderVariant;
  avatarUrl?: string;
  title?: string;
  notificationCount?: number;
  onAvatarClick?: () => void;
  onNotificationsClick?: () => void;
  className?: string;
}

const GREETING_EXIT = {
  scale: 0.9,
  y: -5,
  opacity: 0,
};

function BellButton({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  const classes = cn(
    'relative flex size-11 shrink-0 items-center justify-center',
    'rounded-[11px] border border-border bg-background',
    'text-foreground transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1',
    onClick && 'hover:bg-accent',
  );

  const content = (
    <>
      <BellIcon className="size-5" />
      <NotificationBadge count={count} />
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Benachrichtigungen"
        className={classes}
      >
        {content}
      </button>
    );
  }

  return (
    <span aria-hidden className={classes}>
      {content}
    </span>
  );
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
      {count > 9 ? '9+' : count}
    </span>
  );
}

function AvatarTrigger({
  avatarUrl,
  isOpen,
  onClick,
}: {
  avatarUrl?: string;
  isOpen: boolean;
  onClick?: () => void;
}) {
  const avatarSize = isOpen ? 56 : 32;
  const iconSize = isOpen ? 24 : 16;
  const buttonSize = isOpen ? 56 : 44;

  const avatar = (
    <motion.div
      initial={{ width: avatarSize, height: avatarSize }}
      animate={{ width: avatarSize, height: avatarSize }}
      transition={{ duration: 0.2 }}
      className="shrink-0"
    >
      <Avatar className="size-full border border-border shadow-sm">
        <AvatarImage src={avatarUrl} alt="" />
        <AvatarFallback>
          <motion.div
            initial={{ width: iconSize, height: iconSize }}
            animate={{ width: iconSize, height: iconSize }}
            transition={{ duration: 0.2 }}
          >
            <UserIcon className="size-full text-muted-foreground" />
          </motion.div>
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );

  if (!onClick) {
    return avatar;
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Profil"
      initial={{ width: buttonSize, height: buttonSize }}
      animate={{ width: buttonSize, height: buttonSize }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1',
        'hover:bg-accent',
      )}
    >
      {avatar}
    </motion.button>
  );
}

export function HomeHeader({
  variant,
  avatarUrl,
  title,
  notificationCount,
  onAvatarClick,
  onNotificationsClick,
  className,
}: HomeHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant !== undefined) return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const isOpen = variant !== undefined ? variant === 'open' : !scrolled;

  return (
    <header
      className={cn('flex w-full flex-col gap-3 bg-muted px-6 py-3', className)}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <AvatarTrigger
          avatarUrl={avatarUrl}
          isOpen={isOpen}
          onClick={onAvatarClick}
        />

        <div className="flex shrink-0 items-center gap-3">
          <Logo width={isOpen ? 42 : 38} />

          <BellButton
            count={notificationCount ?? 0}
            onClick={onNotificationsClick}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && title && (
          <motion.h1
            key="title"
            initial={{ scale: 1, y: 0, opacity: 1 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={GREETING_EXIT}
            transition={{ duration: 0.2 }}
            className="w-full text-xl font-bold leading-tight text-foreground"
          >
            {title}
          </motion.h1>
        )}
      </AnimatePresence>
    </header>
  );
}
