import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { parse, Node, HTMLElement } from "node-html-parser";
import Image from "next/image";

dayjs.extend(dayOfYear);
dayjs.extend(customParseFormat);

const CALENDAR_IDS = ["2190", "2172", "2238", "2221", "2248"];

interface Item {
  id: string;
  won: boolean;
}

interface Props {
  items: Item[];
}

export default function Home({ items }: Props) {
  const numberOfCandles = Math.floor(
    (dayjs().add(1, "h").dayOfYear() - 330) / 7
  );

  return (
    <main>
      <header className="mb-4 flex items-center gap-2">
        <h1 className="text-6xl text-yellow-400 mt-1">Advent</h1>
        {new Array(numberOfCandles).fill(0).map((_, i) => (
          <Image key={i} src="/candle.png" alt="Kerze" height={40} width={50} />
        ))}
      </header>

      <h2 className="text-4xl mb-4">{`Gewinner (${dayjs().format(
        "DD.MM.YYYY"
      )})`}</h2>
      <a
        className="underline"
        href="https://schwabmuenchen-lechfeld-buchloe.lions.de/buchloe"
      >
        Zum Gewinnspiel
      </a>
      {items.length === 0 && <p className="italic">Keine Gewinnzahlen</p>}
      <div className="grid grid-cols-2 my-4 w-28">
        {items.map((item) => (
          <p
            className={item.won ? "text-green-500" : "text-red-500"}
            key={item.id}
          >
            {item.id}
          </p>
        ))}
      </div>
      <p className="mb-4">
        Seite von{" "}
        <a
          href="https://dominik-heller.de"
          className="underline text-yellow-400"
        >
          Dominik Heller
        </a>
      </p>
      <a
        className="underline text-sm"
        href="https://www.flaticon.com/free-icons/candle"
        title="candle icons"
      >
        Candle icons created by Freepik - Flaticon
      </a>
    </main>
  );
}

export async function getStaticProps() {
  const res = await fetch(
    "https://schwabmuenchen-lechfeld-buchloe.lions.de/buchloe"
  );
  const htmlString = await res.text();
  const root = parse(htmlString);
  const ids = traverse(root, []);
  const items = ids.map((id) => ({ id, won: CALENDAR_IDS.includes(id) }));

  return {
    props: {
      items,
    },
    revalidate: 60 * 60,
  };
}

function traverse(node: Node, ids: string[]) {
  if (node.nodeType === 1) {
    const el = node as HTMLElement;
    if (el.rawTagName === "tr" && el.childNodes.length > 0) {
      const dateString = el.childNodes[0].innerText;
      const date = dayjs(dateString, "DD.MM.YYYY");
      const now = dayjs().add(1, "h");
      if (
        date.isValid() &&
        date.dayOfYear() === now.dayOfYear() &&
        el.childNodes.length > 3
      ) {
        ids.push(
          ...el.childNodes[3].innerText.split(",").map((text) => text.trim())
        );
      }
    }
  }

  for (const child of node.childNodes) {
    ids = traverse(child, ids);
  }

  return ids;
}
