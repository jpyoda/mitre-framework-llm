import { NextResponse } from "next/server";
import { formatKillChain, getAttackMeta, getGroup } from "@/lib/attack";

// Returns what the scenario generator needs for one group, so the full ATT&CK
// data never has to be shipped to the browser.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const group = getGroup(params.id);
  if (!group) {
    return NextResponse.json({ error: "Unknown group" }, { status: 404 });
  }

  return NextResponse.json({
    id: group.id,
    name: group.name,
    aliases: group.aliases,
    url: group.url,
    killChain: formatKillChain(group),
    attack: getAttackMeta(),
  });
}
