'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { FaqItem } from '@/components/atoms/FaqItem';
import { FadeIn } from '@/components/atoms/FadeIn';
import { Mail, MessageCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    questionKey: 'create-evaluation.question',
    answerKey: 'create-evaluation.answer',
  },
  {
    id: 'faq-2',
    questionKey: 'evaluation-status.question',
    answerKey: 'evaluation-status.answer',
  },
  {
    id: 'faq-3',
    questionKey: 'link-action.question',
    answerKey: 'link-action.answer',
  },
  {
    id: 'faq-4',
    questionKey: 'transformation-plan.question',
    answerKey: 'transformation-plan.answer',
  },
  {
    id: 'faq-5',
    questionKey: 'good-practices.question',
    answerKey: 'good-practices.answer',
  },
];

export function FaqSidebar() {
  const t = useTranslations('page.inicio.faq');
  const items = FAQ_ITEMS.map((item) => ({
    id: item.id,
    question: t(item.questionKey),
    answer: t(item.answerKey),
  }));

  return (
    <div className="space-y-4 w-full lg:w-80 shrink-0">
      <FadeIn delay={0.2}>
        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-zinc-900">
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <FaqItem items={items} />
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.3}>
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{t('help-title')}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {t('help-description')}
                </p>
                <a
                  href="mailto:capacitaciones@rediberoamericanadti.org"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="break-all text-left">capacitaciones@rediberoamericanadti.org</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
