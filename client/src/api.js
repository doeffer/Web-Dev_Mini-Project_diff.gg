export async function fetchSummoner(gameName, tagLine) {
  const res = await fetch('/api/summoner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameName, tagLine }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
