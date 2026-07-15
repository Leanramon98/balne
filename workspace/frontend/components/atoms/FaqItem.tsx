'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';


interface FaqItemData {
  id: string;
  question: string;
  answer: string;
}

interface FaqItemProps {
  items: FaqItemData[];
}

export function FaqItem({ items }: FaqItemProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="w-full">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <motion.div
            layout
            key={item.id}
            className="border-b border-zinc-200"
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-zinc-900 hover:no-underline"
            >
              <span className="pr-2">{item.question}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ y: -8 }}
                    animate={{ y: 0 }}
                    exit={{ y: -8 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="pb-3 text-sm text-zinc-600 text-left"
                  >
                    {item.answer}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
