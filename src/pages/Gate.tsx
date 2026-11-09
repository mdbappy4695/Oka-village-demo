import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "../demo/DemoContext";
import { Eyebrow, focusRing } from "../components/ui";

export function Gate() {
  const { member, showSample } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Members only · Open Accounting";
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center bg-cream px-6 pt-10 pb-40">
      <section className="w-full max-w-xl rounded-2xl border border-sand bg-card px-8 py-12 shadow-[0_24px_50px_-32px_rgba(55,44,36,0.5)] sm:px-12">
        <p className="font-serif text-4xl">Oka</p>
        <div className="mt-8">
          <Eyebrow>Open Accounting</Eyebrow>
        </div>
        <h1 className="mt-3 font-serif text-5xl leading-tight">Members only</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/80">Open Accounting is for signed-in members.</p>
        <button
          type="button"
          className={`mt-8 rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white ${focusRing}`}
          onClick={() => {
            if (member) navigate("/open-accounting");
            else showSample();
          }}
        >
          {member ? "Continue to Open Accounting" : "Enter as a demo member"}
        </button>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">This is a demonstration and is not connected to Stripe.</p>
      </section>
    </main>
  );
}
