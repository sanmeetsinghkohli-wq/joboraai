/** An abstract Jobora screen: sidebar, list and board, in brand colours. */
export function AppScreen() {
  return (
    // Sized off the viewport so every bar scales with the laptop.
    <div className="flex h-full text-[min(1.5vw,13px)]">
      {/* Sidebar */}
      <div className="flex w-[17%] flex-col gap-[6%] border-r border-line bg-ivory p-[2.2%]">
        <div className="flex items-center gap-[8%]">
          <span className="aspect-square w-[22%] rounded-[25%] bg-gradient-to-br from-coral to-plum" />
          <span className="h-[0.5em] w-1/2 rounded-full bg-plum/70" />
        </div>
        {[true, false, false, false, false, false].map((active, i) => (
          <span key={i} className={`h-[1.4em] rounded-md ${active ? 'bg-plum' : 'bg-sand'}`} />
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-[3%] p-[2.5%]">
        <span className="h-[1.1em] w-[38%] rounded-full bg-plum/80" />
        <div className="grid flex-1 grid-cols-[1.1fr_1fr] gap-[3%]">
          {/* Job list with skill bars */}
          <div className="flex flex-col gap-[4%]">
            {[0.33, 0.25, 0.25, 0.2].map((fill, i) => (
              <div key={i} className="flex flex-1 items-center gap-[5%] rounded-lg border border-line bg-paper px-[5%]">
                <span className="aspect-square w-[11%] rounded-md bg-plum-50" />
                <div className="flex flex-1 flex-col gap-[0.35em]">
                  <span className="h-[0.45em] w-3/4 rounded-full bg-ink/70" />
                  <span className="h-[0.35em] w-1/2 rounded-full bg-ink/25" />
                  <span className="h-[0.3em] w-2/5 overflow-hidden rounded-full bg-sand">
                    <span className="block h-full rounded-full bg-coral" style={{ width: `${fill * 100 + 30}%` }} />
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Board */}
          <div className="grid grid-cols-3 gap-[4%] rounded-lg border border-line bg-paper p-[4%]">
            {[3, 2, 1].map((n, col) => (
              <div key={col} className="flex flex-col gap-[6%] rounded-md bg-ivory p-[6%]">
                <span className={`h-[0.4em] w-2/3 rounded-full ${col === 2 ? 'bg-success' : col === 1 ? 'bg-coral' : 'bg-plum'}`} />
                {Array.from({ length: n }).map((_, i) => (
                  <span key={i} className="h-[2.2em] rounded border border-line bg-paper" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
