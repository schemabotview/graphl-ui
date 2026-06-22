/** PowerPoint-style content panel: title, then either a full Markdown body
 *  (faithful notebook slides) or the bullets/code shorthand, + optional audio. */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { resolveAsset } from '../content/client'
import type { Narration, Slide } from '../types'

interface SlidePanelProps {
  slide: Slide
  narration?: Narration
}

export function SlidePanel({ slide, narration }: SlidePanelProps) {
  const hasBody = typeof slide.body === 'string' && slide.body.trim().length > 0

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-8">
      <h2 className="text-3xl font-semibold text-slate-100">
        {slide.title}
      </h2>

      {hasBody ? (
        <article
          className="prose prose-invert max-w-none
            prose-headings:text-slate-100 prose-p:text-slate-300
            prose-strong:text-slate-100 prose-li:text-slate-300
            prose-a:text-violet-400
            prose-table:text-slate-300 prose-th:text-slate-100
            prose-code:text-violet-300 prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[#141414] prose-pre:border prose-pre:border-[#232323]"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {slide.body}
          </ReactMarkdown>
        </article>
      ) : (
        <>
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-3 text-lg text-slate-300">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {slide.code && (
            <pre className="overflow-x-auto rounded-lg border border-[#232323] bg-[#141414] p-4 text-sm text-slate-100">
              <code>{slide.code.source}</code>
            </pre>
          )}

          {slide.notes && (
            <p className="text-sm text-slate-500">{slide.notes}</p>
          )}
        </>
      )}

      {narration?.audioSrc && (
        <audio className="mt-auto w-full" controls src={resolveAsset(narration.audioSrc)} />
      )}
    </div>
  )
}
