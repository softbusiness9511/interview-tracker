/**
 * A pinned reminder, styled as a sticky note so it reads as something tacked
 * onto the dashboard rather than another data panel.
 */
export function QuoteNote() {
  return (
    <div className="flex justify-center pt-2 pb-6">
      <figure className="relative -rotate-2 transition-transform duration-300 hover:rotate-0">
        {/* Pin head. Decorative, so it is hidden from screen readers. */}
        <span
          aria-hidden
          className="bg-note-pin absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full shadow-md ring-2 ring-black/10"
        />
        <span
          aria-hidden
          className="absolute -top-1 left-1/2 size-1.5 -translate-x-[1px] rounded-full bg-white/45"
        />

        <blockquote className="bg-note-bg text-note-fg rounded-sm px-8 pt-7 pb-6 text-center shadow-lg">
          <p className="text-sm leading-7 font-semibold tracking-[0.14em] uppercase">
            Passion
            <br />+ Consistency
            <br />= Success
          </p>
        </blockquote>
      </figure>
    </div>
  );
}
