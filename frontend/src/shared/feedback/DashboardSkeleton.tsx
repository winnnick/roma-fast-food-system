function DashboardSkeleton() {
  return (
    <div
      className="
        space-y-6 animate-pulse
      "
      aria-label="Cargando panel administrativo"
    >
      <div
        className="
          h-56 rounded-3xl
          bg-slate-300
        "
      />

      <div
        className="
          h-28 rounded-2xl
          bg-white
        "
      />

      <div
        className="
          grid gap-5
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {Array.from({
          length: 4,
        }).map((_, indice) => (
          <div
            key={indice}
            className="
              h-44 rounded-2xl
              border border-slate-200
              bg-white p-5
            "
          >
            <div
              className="
                h-11 w-11 rounded-xl
                bg-slate-200
              "
            />

            <div
              className="
                mt-5 h-4 w-28
                rounded bg-slate-200
              "
            />

            <div
              className="
                mt-3 h-7 w-36
                rounded bg-slate-300
              "
            />

            <div
              className="
                mt-3 h-3 w-44
                rounded bg-slate-200
              "
            />
          </div>
        ))}
      </div>

      <div
        className="
          grid gap-5
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        {Array.from({
          length: 4,
        }).map((_, indice) => (
          <div
            key={indice}
            className="
              h-32 rounded-2xl
              bg-white
            "
          />
        ))}
      </div>

      <div
        className="
          grid gap-6
          xl:grid-cols-2
        "
      >
        <div
          className="
            h-[430px]
            rounded-3xl bg-white
          "
        />

        <div
          className="
            h-[430px]
            rounded-3xl bg-white
          "
        />
      </div>

      <div
        className="
          grid gap-6
          xl:grid-cols-2
        "
      >
        {Array.from({
          length: 4,
        }).map((_, indice) => (
          <div
            key={indice}
            className="
              h-[420px]
              rounded-3xl bg-white
            "
          />
        ))}
      </div>
    </div>
  );
}

export default DashboardSkeleton;
