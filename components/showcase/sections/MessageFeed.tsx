import { GlowPanel } from "../GlowPanel";
import { MessageCard } from "../MessageCard";

const MESSAGES: {
  author: string;
  role: string;
  text: string;
  time: string;
  tone?: "cool" | "hot";
}[] = [
  {
    author: "Priya",
    role: "Product",
    text: "Can we get the apply-discount button live before the weekend promo?",
    time: "9:02 AM",
  },
  {
    author: "Dana",
    role: "On-call",
    text: "Main is red. The failing test is the promo interaction from two years ago.",
    time: "1:05 PM",
    tone: "hot",
  },
  {
    author: "Marcus",
    role: "Support",
    text: "Two customers say the promo discount applied twice at checkout.",
    time: "2:18 PM",
    tone: "hot",
  },
  {
    author: "Priya",
    role: "Product",
    text: "Marketing is asking for an ETA. What is the honest one?",
    time: "2:31 PM",
  },
];

/**
 * A stakeholder message feed as set dressing: the pressure of a real workday in
 * the established register. Static messages with a live typing line; the
 * blinking cursor is the one permitted ambient loop and stops under reduced
 * motion. Sample content only.
 */
export function MessageFeed() {
  return (
    <GlowPanel className="p-4">
      <div className="flex flex-col gap-2">
        {MESSAGES.map((message) => (
          <MessageCard key={`${message.author}-${message.time}`} {...message} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 px-1 font-mono text-[11px] text-ink-faint">
        <span>Product is typing</span>
        <span
          aria-hidden="true"
          className="inline-block h-3 w-1.5 animate-cursor-blink bg-accent"
        />
      </div>
    </GlowPanel>
  );
}
