
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const containerVariants = {
  start: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  end: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const circleVariants = {
  start: {
    y: '0%',
  },
  end: {
    y: ['0%', '-100%', '0%'],
  },
};

const transition = {
  duration: 1.5,
  ease: 'easeInOut',
  repeat: Infinity,
  repeatDelay: 0.2,
};

type LoaderProps = {
  text?: string;
  className?: string;
}

export function Loader({ text = "Scene loading.......", className }: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full gap-4", className)}>
        <motion.div
            className="flex gap-1"
            variants={containerVariants}
            initial="start"
            animate="end"
        >
            <motion.span
                className="block w-4 h-4 rounded-full bg-primary"
                variants={circleVariants}
                transition={transition}
            />
            <motion.span
                className="block w-4 h-4 rounded-full bg-secondary"
                variants={circleVariants}
                transition={{...transition, delay: 0.2}}
            />
            <motion.span
                className="block w-4 h-4 rounded-full bg-accent"
                variants={circleVariants}
                transition={{...transition, delay: 0.4}}
            />
        </motion.div>
        <p className="text-muted-foreground font-medium text-sm tracking-wider">{text}</p>
    </div>
  );
}

      